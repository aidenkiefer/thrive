-- =============================================================================
-- Migration: shared_rate_limit (D1L, 2026-11-18)
--
-- Shared fixed-window abuse limiter backed by Postgres, so every serverless
-- instance enforces the same counters.
--
--   purpose       short limiter name, e.g. 'forms.submit'
--   subject_hash  HMAC-SHA256 hex digest computed in the app with a server
--                 secret. The database never sees a raw email, IP address, or
--                 form content.
--   hits          counter for the current window (capped at limit + 1)
--
-- RLS is on with NO policies; anon/authenticated/public are revoked; only
-- service_role can use the table and execute the functions. Idempotent: safe to
-- run twice. Agents do not apply it.
--
-- Rollback (counters are disposable):
--   drop function if exists public.take_rate_limit(text, text, integer, integer);
--   drop function if exists public.prune_rate_limit_buckets(integer);
--   drop table if exists public.rate_limit_buckets;
-- =============================================================================

begin;

-- The primary key includes window_seconds so a config change to a window length
-- can never mix counters from different windows.
create table if not exists public.rate_limit_buckets (
  purpose         text not null,
  window_seconds  integer not null,
  subject_hash    text not null,
  window_start    timestamptz not null,
  expires_at      timestamptz not null,
  hits            integer not null,
  constraint rate_limit_buckets_pkey primary key (purpose, window_seconds, subject_hash),
  constraint rate_limit_buckets_purpose_valid check (purpose ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  constraint rate_limit_buckets_subject_is_hash check (subject_hash ~ '^[0-9a-f]{64}$'),
  constraint rate_limit_buckets_window_valid check (window_seconds between 1 and 86400),
  constraint rate_limit_buckets_hits_valid check (hits >= 1),
  constraint rate_limit_buckets_expiry_valid check (expires_at > window_start)
);
create index if not exists rate_limit_buckets_expires_at_idx on public.rate_limit_buckets (expires_at);

-- One atomic statement per call: the upsert takes the row lock, so concurrent
-- callers on the same key serialize and each sees the previous count.
-- security invoker: service_role already holds the table grants, so there is no
-- definer escalation.
create or replace function public.take_rate_limit(
  p_purpose text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
) returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_now      timestamptz := clock_timestamp();
  v_start    timestamptz;
  v_expires  timestamptz;
  v_hits     integer;
begin
  if p_purpose is null or p_purpose !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'invalid limiter purpose' using errcode = '22023';
  end if;
  if p_subject_hash is null or p_subject_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid limiter subject' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100000 then
    raise exception 'invalid limiter limit' using errcode = '22023';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid limiter window' using errcode = '22023';
  end if;

  v_start   := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  v_expires := v_start + make_interval(secs => p_window_seconds);

  insert into public.rate_limit_buckets as b
    (purpose, window_seconds, subject_hash, window_start, expires_at, hits)
  values (p_purpose, p_window_seconds, p_subject_hash, v_start, v_expires, 1)
  on conflict (purpose, window_seconds, subject_hash) do update
    set hits         = case when b.window_start >= excluded.window_start
                            then least(b.hits + 1, p_limit + 1) else 1 end,
        window_start = greatest(b.window_start, excluded.window_start),
        expires_at   = greatest(b.expires_at, excluded.expires_at)
  returning b.hits, b.expires_at into v_hits, v_expires;

  allowed := v_hits <= p_limit;
  retry_after_seconds := case when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_expires - v_now)))::integer) end;

  -- Bounded cleanup: at most 25 expired rows per call, never waiting on locks.
  delete from public.rate_limit_buckets d
  where d.ctid in (
    select e.ctid from public.rate_limit_buckets e
    where e.expires_at < v_now
    limit 25
    for update skip locked
  );

  return next;
end;
$$;

-- Optional scheduled/manual sweep, also bounded.
create or replace function public.prune_rate_limit_buckets(p_max_rows integer default 1000)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if p_max_rows is null or p_max_rows < 1 or p_max_rows > 10000 then
    raise exception 'invalid prune bound' using errcode = '22023';
  end if;
  delete from public.rate_limit_buckets d
  where d.ctid in (
    select e.ctid from public.rate_limit_buckets e
    where e.expires_at < clock_timestamp()
    limit p_max_rows
    for update skip locked
  );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

alter table public.rate_limit_buckets enable row level security;
-- No policies on purpose: anon and authenticated can read or write nothing.
revoke all on table public.rate_limit_buckets from public;
revoke execute on function public.take_rate_limit(text, text, integer, integer) from public;
revoke execute on function public.prune_rate_limit_buckets(integer) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.rate_limit_buckets from anon;
    revoke execute on function public.take_rate_limit(text, text, integer, integer) from anon;
    revoke execute on function public.prune_rate_limit_buckets(integer) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.rate_limit_buckets from authenticated;
    revoke execute on function public.take_rate_limit(text, text, integer, integer) from authenticated;
    revoke execute on function public.prune_rate_limit_buckets(integer) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.rate_limit_buckets to service_role;
    grant execute on function public.take_rate_limit(text, text, integer, integer) to service_role;
    grant execute on function public.prune_rate_limit_buckets(integer) to service_role;
  end if;
end
$$;

commit;
