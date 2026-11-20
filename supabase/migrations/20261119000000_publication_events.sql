-- =============================================================================
-- Migration: publication_events + cms_set_published (R2, 2026-11-19)
--
-- Attributed publishing. Every publish or unpublish of a content row is
-- recorded once, with the durable staff actor (admin_staff_accounts.actor_id,
-- never an email), by one atomic function:
--
--   cms_set_published(entity_type, entity_id, publish, actor_id) -> published_at
--
-- The function requires an ACTIVE staff actor, locks the content row, flips
-- published_at only when the state actually changes (re-saving an already
-- published row keeps its original publish time and logs nothing), and writes
-- the event in the same transaction. The entity type maps to its table through
-- a fixed whitelist; nothing caller-supplied reaches the SQL as an identifier.
--
-- publication_events is append-only (triggers block UPDATE, DELETE and TRUNCATE), RLS is
-- on with NO policies, anon/authenticated are revoked, and only service_role can
-- select/insert. Idempotent: safe to run twice. Agents do not apply it.
-- =============================================================================

begin;

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

commit;
