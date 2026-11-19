-- =============================================================================
-- Migration: published_at guard (R2b, 2026-11-19)
--
-- Database enforcement for attributed publishing (issue #91). After R2, app
-- code is meant to change published_at only through cms_set_published, but any
-- service_role caller could still write the column directly and skip the
-- publication_events record. This migration makes the database refuse that:
--
--   * cms_set_published (re-created, same signature and behaviour) marks its
--     own write with the transaction-local setting thrive.cms_set_published =
--     'on' immediately before its UPDATE, and clears it right after, still
--     inside the function, so the mark cannot leak to later statements in the
--     same transaction.
--   * published_at_guard() is a BEFORE UPDATE OF published_at row trigger on
--     all 9 publishable tables. It raises P0001 when published_at actually
--     changes (IS DISTINCT FROM) and the mark is not 'on'. Updates that leave
--     published_at unchanged (e.g. a seed upsert re-writing the same timestamp,
--     or an editor saving content columns) pass.
--
-- Why the setting is safe: PostgREST exposes only functions in its exposed
-- schemas (public here), so a REST caller cannot run pg_catalog.set_config,
-- and every request/RPC is its own transaction, so a transaction-local value
-- cannot carry from one request into another. Anything that can run arbitrary
-- SQL as the table owner can bypass any trigger anyway; this guard is about
-- the service_role app path.
--
-- Known gap (follow-up #94): INSERT is NOT guarded. scripts/seed-current.ts
-- upserts already-published rows directly and has no actor to attribute them
-- to. Owner decision 2026-11-19: automation (seed, agents, scheduled jobs)
-- gets reserved system actor rows in admin_staff_accounts and publishes
-- through cms_set_published like staff; the INSERT guard lands with that.
--
-- The trigger function is revoked from public/anon/authenticated. Idempotent:
-- safe to run twice. Agents do not apply it.
-- =============================================================================

begin;

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
    perform pg_catalog.set_config('thrive.cms_set_published', 'on', true);
    execute format('update public.%I set published_at = $1 where id = $2', v_table)
      using v_now, p_entity_id;
    perform pg_catalog.set_config('thrive.cms_set_published', 'off', true);
    insert into public.publication_events (entity_type, entity_id, action, actor_id)
      values (p_entity_type, p_entity_id, 'publish', p_actor_id);
    v_current := v_now;
  elsif not p_publish and v_current is not null then
    perform pg_catalog.set_config('thrive.cms_set_published', 'on', true);
    execute format('update public.%I set published_at = null where id = $1', v_table)
      using p_entity_id;
    perform pg_catalog.set_config('thrive.cms_set_published', 'off', true);
    insert into public.publication_events (entity_type, entity_id, action, actor_id)
      values (p_entity_type, p_entity_id, 'unpublish', p_actor_id);
    v_current := null;
  end if;

  return v_current;
end;
$$;

create or replace function public.published_at_guard() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.published_at is distinct from old.published_at
     and coalesce(pg_catalog.current_setting('thrive.cms_set_published', true), '') <> 'on' then
    raise exception 'published_at changes only through cms_set_published'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists published_at_guard on public.sermon_series;
create trigger published_at_guard before update of published_at on public.sermon_series
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.sermons;
create trigger published_at_guard before update of published_at on public.sermons
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.recurring_events;
create trigger published_at_guard before update of published_at on public.recurring_events
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.one_time_events;
create trigger published_at_guard before update of published_at on public.one_time_events
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.groups;
create trigger published_at_guard before update of published_at on public.groups
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.ministries;
create trigger published_at_guard before update of published_at on public.ministries
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.announcements;
create trigger published_at_guard before update of published_at on public.announcements
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.landing_pages;
create trigger published_at_guard before update of published_at on public.landing_pages
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_guard on public.outreach;
create trigger published_at_guard before update of published_at on public.outreach
  for each row execute function public.published_at_guard();

revoke execute on function public.published_at_guard() from public;
revoke execute on function public.cms_set_published(text, uuid, boolean, uuid) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function public.published_at_guard() from anon;
    revoke execute on function public.cms_set_published(text, uuid, boolean, uuid) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke execute on function public.published_at_guard() from authenticated;
    revoke execute on function public.cms_set_published(text, uuid, boolean, uuid) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.cms_set_published(text, uuid, boolean, uuid) to service_role;
  end if;
end
$$;

commit;
