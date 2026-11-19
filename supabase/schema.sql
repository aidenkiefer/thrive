-- Thrive Vineyard — Supabase Schema
-- Source of truth: docs/05-content-models.md
-- Fresh project: apply this file once. Existing June database: apply supabase/migrations/ instead.
-- See supabase/README.md. Apply via Supabase dashboard SQL editor or `supabase db push`
-- After applying: npx supabase gen types typescript --local > src/lib/supabase/types.ts

-- =============================================================================
-- SERMON SYSTEM
-- =============================================================================

create table if not exists speakers (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  title           text,
  bio             text,
  photo_url       text,
  email           text,
  created_at      timestamptz default now()
);

create table if not exists sermon_series (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  thumbnail_url   text,
  start_date      date,
  end_date        date,
  -- SEO
  seo_title       text,
  seo_description text,
  og_image_url    text,
  published_at    timestamptz,
  created_at      timestamptz default now()
);

create table if not exists sermons (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  title                 text not null,
  description           text,
  speaker_id            uuid references speakers(id),
  series_id             uuid references sermon_series(id),
  scripture_references  text[],
  audio_url             text,
  video_url             text,
  youtube_url           text,
  thumbnail_url         text,
  duration_seconds      int,
  preached_at           date not null,
  location              text,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create index if not exists sermons_preached_at_idx on sermons(preached_at desc);
create index if not exists sermons_published_at_idx on sermons(published_at);

-- =============================================================================
-- EVENTS
-- =============================================================================

create table if not exists recurring_events (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null,
  name                    text not null,
  description             text,
  short_summary           text,
  category                text,
  recurrence_description  text,   -- Human-readable: "First Saturday of the month"
  typical_time            text,   -- Human-readable: "7:00 PM"
  location                text,
  leader                  text,
  contact_email           text,
  contact_phone           text,
  featured_image_url      text,
  gallery_urls            text[],
  video_urls              text[],
  churchsuite_form_url    text,
  external_url            text,
  -- SEO
  seo_title               text,
  seo_description         text,
  og_image_url            text,
  published_at            timestamptz,
  created_at              timestamptz default now()
);

create table if not exists event_occurrences (
  id                  uuid primary key default gen_random_uuid(),
  recurring_event_id  uuid not null references recurring_events(id) on delete cascade,
  start_datetime      timestamptz not null,
  end_datetime        timestamptz,
  location            text,   -- Overrides recurring_event.location if set
  notes               text,
  cancelled           boolean default false,
  created_at          timestamptz default now()
);

create index if not exists event_occurrences_start_datetime_idx on event_occurrences(start_datetime);
create index if not exists event_occurrences_recurring_event_id_idx on event_occurrences(recurring_event_id);
create unique index if not exists event_occurrences_identity_idx on event_occurrences(recurring_event_id, start_datetime);

create table if not exists one_time_events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  description           text,
  short_summary         text,
  category              text,
  start_datetime        timestamptz not null,
  end_datetime          timestamptz,
  location              text,
  leader                text,
  contact_email         text,
  featured_image_url    text,
  churchsuite_form_url  text,
  external_url          text,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create index if not exists one_time_events_start_datetime_idx on one_time_events(start_datetime);

-- =============================================================================
-- GROUPS & MINISTRIES
-- =============================================================================

create table if not exists groups (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  description           text,
  short_summary         text,
  category              text,   -- 'small-group', 'connect-group', 'youth', etc.
  meeting_schedule      text,   -- Human-readable: "Tuesdays at 7 PM"
  location              text,
  leader                text,
  contact_email         text,
  contact_phone         text,
  featured_image_url    text,
  churchsuite_form_url  text,
  is_open               boolean default true,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create table if not exists ministries (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  description         text,
  short_summary       text,
  leader              text,
  contact_email       text,
  featured_image_url  text,
  schedule_description text,  -- free-text meeting schedule, owner-entered (never inferred)
  churchsuite_form_url text,  -- signup form: ChurchSuite, or Google Forms where ChurchSuite has none
  -- SEO
  seo_title           text,
  seo_description     text,
  og_image_url        text,
  published_at        timestamptz,
  created_at          timestamptz default now()
);

-- =============================================================================
-- ANNOUNCEMENTS
-- =============================================================================

create table if not exists announcements (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  body                  text,
  cta_text              text,
  cta_url               text,
  featured_image_url    text,
  is_homepage_feature   boolean default false,
  expires_at            timestamptz,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create index if not exists announcements_homepage_idx on announcements(is_homepage_feature, expires_at, published_at);

-- =============================================================================
-- STAFF
-- =============================================================================

create table if not exists staff (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  title           text,
  bio             text,
  photo_url       text,
  email           text,
  phone           text,
  display_order   int,
  created_at      timestamptz default now()
);

create index if not exists staff_display_order_idx on staff(display_order);

-- =============================================================================
-- LANDING PAGES (Google Ads campaigns)
-- =============================================================================

create table if not exists landing_pages (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,   -- Root-level URL: /[slug]
  title               text not null,          -- Internal name
  hero_heading        text,
  hero_subheading     text,
  hero_image_url      text,
  body_content        text,                   -- Rich text / markdown
  cta_text            text,
  cta_url             text,
  -- Link to a canonical entity (optional — pulls description, image, form URL)
  linked_entity_type  text check (linked_entity_type in ('recurring_event', 'one_time_event', 'group', 'ministry')),
  linked_entity_id    uuid,
  -- SEO
  seo_title           text,
  seo_description     text,
  og_image_url        text,
  published_at        timestamptz,
  created_at          timestamptz default now()
);

-- =============================================================================
-- OUTREACH
-- =============================================================================

create table if not exists outreach (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  description           text,
  short_summary         text,
  featured_image_url    text,
  contact_email         text,
  volunteer_signup_url  text,
  churchsuite_form_url  text,
  is_ongoing            boolean default false,
  start_date            date,
  end_date              date,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Public: read published records only
-- Admin: full access via service role key (bypasses RLS)
-- =============================================================================

alter table speakers enable row level security;
alter table sermon_series enable row level security;
alter table sermons enable row level security;
alter table recurring_events enable row level security;
alter table event_occurrences enable row level security;
alter table one_time_events enable row level security;
alter table groups enable row level security;
alter table ministries enable row level security;
alter table announcements enable row level security;
alter table staff enable row level security;
alter table landing_pages enable row level security;
alter table outreach enable row level security;

-- Public read: only published records (published_at IS NOT NULL)
-- Speakers and staff have no published_at — always readable

create policy "public_read_speakers" on speakers for select using (true);
create policy "public_read_staff" on staff for select using (true);

create policy "public_read_sermon_series" on sermon_series for select using (published_at is not null);
create policy "public_read_sermons" on sermons for select using (published_at is not null);
create policy "public_read_recurring_events" on recurring_events for select using (published_at is not null);
-- Occurrences are public only when not cancelled and their recurring event is published
create policy "public_read_event_occurrences" on event_occurrences for select using (
  cancelled = false
  and exists (
    select 1 from recurring_events r
    where r.id = event_occurrences.recurring_event_id
      and r.published_at is not null
  )
);
create policy "public_read_one_time_events" on one_time_events for select using (published_at is not null);
create policy "public_read_groups" on groups for select using (published_at is not null);
create policy "public_read_ministries" on ministries for select using (published_at is not null);
create policy "public_read_announcements" on announcements for select using (
  published_at is not null
  and (expires_at is null or expires_at > now())
);
create policy "public_read_landing_pages" on landing_pages for select using (published_at is not null);
create policy "public_read_outreach" on outreach for select using (published_at is not null);

-- =============================================================================
-- SCHEMA PATCH: Sprint 01 additions
-- Apply after initial schema creation.
-- After applying: npx supabase gen types typescript --local > src/lib/supabase/types.ts
-- =============================================================================

alter table sermons add column if not exists topics text[];
alter table sermons add column if not exists service_type text default 'Sunday Service';
alter table recurring_events add column if not exists venue text;
alter table one_time_events add column if not exists venue text;
alter table recurring_events add column if not exists external_url text;
alter table one_time_events add column if not exists external_url text;

-- =============================================================================
-- COLUMN PRIVACY (owner decision, 2026-11-07)
-- Contact columns on "all rows" tables are not public: anon/authenticated may
-- read every column except speakers.email, staff.email, staff.phone. When you
-- add a column to speakers or staff, add it to the matching grant below.
-- Same statements as migrations/20261107020000_contact_column_privacy.sql.
-- =============================================================================

revoke select on table speakers from anon, authenticated;
grant select (id, slug, name, title, bio, photo_url, created_at)
  on table speakers to anon, authenticated;

revoke select on table staff from anon, authenticated;
grant select (id, slug, name, title, bio, photo_url, display_order, created_at)
  on table staff to anon, authenticated;

-- =============================================================================
-- D1R: admin_staff_accounts (mirror of migrations/20261118000000_admin_staff_accounts.sql
-- plus #102 roles, migrations/20261119020000_admin_staff_roles.sql)
-- =============================================================================

-- Staff accounts (D1R): service-role-only binding of a durable actor UUID to a
-- preprovisioned Supabase Auth user. See supabase/migrations/20261118000000_admin_staff_accounts.sql.
create table if not exists admin_staff_accounts (
  actor_id      uuid primary key default gen_random_uuid(),
  email         text not null,
  auth_user_id  uuid not null,
  status        text not null default 'active',
  auth_version  integer not null default 1,
  role          text not null default 'staff',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  disabled_at   timestamptz,
  constraint admin_staff_accounts_email_normalized check (email <> '' and email = lower(btrim(email))),
  constraint admin_staff_accounts_status_valid check (status in ('active', 'disabled')),
  constraint admin_staff_accounts_version_positive check (auth_version >= 1),
  constraint admin_staff_accounts_role_valid check (role in ('admin', 'staff'))
);
create unique index if not exists admin_staff_accounts_email_key on admin_staff_accounts (email);
create unique index if not exists admin_staff_accounts_auth_user_id_key on admin_staff_accounts (auth_user_id);

create or replace function admin_staff_accounts_guard() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('DELETE', 'TRUNCATE') then
    raise exception 'admin_staff_accounts rows are preserved for attribution; set status = ''disabled'' instead';
  end if;
  if new.actor_id is distinct from old.actor_id then
    raise exception 'admin_staff_accounts.actor_id is immutable';
  end if;
  if new.auth_version < old.auth_version then
    raise exception 'admin_staff_accounts.auth_version never decreases';
  end if;
  if new.status is distinct from old.status or new.auth_user_id is distinct from old.auth_user_id
     or new.role is distinct from old.role then
    -- Disable, re-enable, rebind, or role change: revoke every existing website session.
    new.auth_version := greatest(new.auth_version, old.auth_version) + 1;
  end if;
  if old.status = 'active' and old.role = 'admin' and (new.status <> 'active' or new.role <> 'admin') then
    -- Serialize admin removals; each statement below takes a fresh snapshot.
    perform pg_advisory_xact_lock(hashtext('admin_staff_accounts.last_admin'));
    if not exists (
      select 1 from public.admin_staff_accounts a
      where a.role = 'admin' and a.status = 'active' and a.actor_id <> old.actor_id
    ) then
      raise exception 'admin_staff_accounts: cannot demote or disable the last active admin';
    end if;
  end if;
  if new.status = 'disabled' and old.status <> 'disabled' then
    new.disabled_at := now();
  elsif new.status = 'active' then
    new.disabled_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists admin_staff_accounts_guard_update on admin_staff_accounts;
create trigger admin_staff_accounts_guard_update before update on admin_staff_accounts
  for each row execute function admin_staff_accounts_guard();
drop trigger if exists admin_staff_accounts_guard_delete on admin_staff_accounts;
create trigger admin_staff_accounts_guard_delete before delete on admin_staff_accounts
  for each row execute function admin_staff_accounts_guard();
drop trigger if exists admin_staff_accounts_guard_truncate on admin_staff_accounts;
create trigger admin_staff_accounts_guard_truncate before truncate on admin_staff_accounts
  for each statement execute function admin_staff_accounts_guard();

alter table admin_staff_accounts enable row level security;
-- No policies on purpose: anon and authenticated can read or write nothing.
revoke all on table admin_staff_accounts from public;
revoke execute on function admin_staff_accounts_guard() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table admin_staff_accounts from anon;
    revoke execute on function admin_staff_accounts_guard() from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table admin_staff_accounts from authenticated;
    revoke execute on function admin_staff_accounts_guard() from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    -- Supabase default privileges give service_role everything, including
    -- delete and truncate (a row-level trigger cannot stop TRUNCATE). Reset first.
    revoke all on table admin_staff_accounts from service_role;
    grant select, insert, update on table admin_staff_accounts to service_role;
  end if;
end
$$;

-- =============================================================================
-- D1L: rate_limit_buckets (mirror of migrations/20261118010000_shared_rate_limit.sql)
-- =============================================================================

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
-- R2: publication_events (mirror of migrations/20261119000000_publication_events.sql)
-- =============================================================================

create table if not exists public.publication_events (
  id           bigint generated always as identity primary key,
  entity_type  text not null,
  entity_id    uuid not null,
  action       text not null,
  actor_id     uuid not null references public.admin_staff_accounts (actor_id),
  occurred_at  timestamptz not null default now(),
  constraint publication_events_entity_type_valid check (entity_type in (
    'sermon_series', 'sermon', 'recurring_event', 'one_time_event', 'group',
    'ministry', 'announcement', 'landing_page', 'outreach'
  )),
  constraint publication_events_action_valid check (action in ('publish', 'unpublish'))
);
create index if not exists publication_events_entity_idx
  on public.publication_events (entity_type, entity_id, occurred_at desc);

create or replace function public.publication_events_guard() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'publication_events is append-only; rows cannot be updated or deleted';
end;
$$;

drop trigger if exists publication_events_guard_update on public.publication_events;
create trigger publication_events_guard_update before update on public.publication_events
  for each row execute function public.publication_events_guard();
drop trigger if exists publication_events_guard_delete on public.publication_events;
create trigger publication_events_guard_delete before delete on public.publication_events
  for each row execute function public.publication_events_guard();
drop trigger if exists publication_events_guard_truncate on public.publication_events;
create trigger publication_events_guard_truncate before truncate on public.publication_events
  for each statement execute function public.publication_events_guard();

create or replace function public.cms_set_published(
  p_entity_type text,
  p_entity_id uuid,
  p_publish boolean,
  p_actor_id uuid
) returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_table   text;
  v_present integer;
  v_current timestamptz;
  v_now     timestamptz := now();
begin
  v_table := case p_entity_type
    when 'sermon_series'    then 'sermon_series'
    when 'sermon'           then 'sermons'
    when 'recurring_event'  then 'recurring_events'
    when 'one_time_event'   then 'one_time_events'
    when 'group'            then 'groups'
    when 'ministry'         then 'ministries'
    when 'announcement'     then 'announcements'
    when 'landing_page'     then 'landing_pages'
    when 'outreach'         then 'outreach'
    else null
  end;
  if v_table is null then
    raise exception 'unknown entity type' using errcode = '22023';
  end if;
  if p_publish is null then
    raise exception 'publish flag is required' using errcode = '22023';
  end if;

  if p_actor_id is null or not exists (
    select 1 from public.admin_staff_accounts
    where actor_id = p_actor_id and status = 'active'
  ) then
    raise exception 'inactive or unknown staff actor' using errcode = '42501';
  end if;

  execute format('select 1, published_at from public.%I where id = $1 for update', v_table)
    into v_present, v_current
    using p_entity_id;
  if v_present is null then
    raise exception 'content row not found' using errcode = 'P0002';
  end if;

  if p_publish and v_current is null then
    execute format('update public.%I set published_at = $1 where id = $2', v_table)
      using v_now, p_entity_id;
    insert into public.publication_events (entity_type, entity_id, action, actor_id)
      values (p_entity_type, p_entity_id, 'publish', p_actor_id);
    v_current := v_now;
  elsif not p_publish and v_current is not null then
    execute format('update public.%I set published_at = null where id = $1', v_table)
      using p_entity_id;
    insert into public.publication_events (entity_type, entity_id, action, actor_id)
      values (p_entity_type, p_entity_id, 'unpublish', p_actor_id);
    v_current := null;
  end if;

  return v_current;
end;
$$;

alter table public.publication_events enable row level security;
-- No policies on purpose: anon and authenticated can read or write nothing.
revoke all on table public.publication_events from public;
revoke execute on function public.publication_events_guard() from public;
revoke execute on function public.cms_set_published(text, uuid, boolean, uuid) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.publication_events from anon;
    revoke execute on function public.publication_events_guard() from anon;
    revoke execute on function public.cms_set_published(text, uuid, boolean, uuid) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.publication_events from authenticated;
    revoke execute on function public.publication_events_guard() from authenticated;
    revoke execute on function public.cms_set_published(text, uuid, boolean, uuid) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    -- Supabase default privileges grant service_role everything; narrow it first.
    revoke all on table public.publication_events from service_role;
    grant select, insert on table public.publication_events to service_role;
    grant execute on function public.cms_set_published(text, uuid, boolean, uuid) to service_role;
  end if;
end
$$;

