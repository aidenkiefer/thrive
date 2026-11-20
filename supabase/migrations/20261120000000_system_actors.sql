-- =============================================================================
-- Migration: system actors and the published_at INSERT guard (#94, 2026-11-20)
--
-- Owner decision 2026-11-19 (#94 option 1): automation (the seed, AI agents,
-- scheduled jobs) publishes through cms_set_published as reserved system actor
-- rows in admin_staff_accounts, with the same attribution as staff.
--
--   * admin_staff_accounts.kind: 'staff' (default, every existing row) or
--     'system'. A system row has a name ('seed', ...) and NO email and NO
--     auth_user_id, so the email-code sign-in can never match it, and the
--     website's staff lookups also filter kind = 'staff'. A system row's role is
--     always 'staff', so it never counts toward the last-admin rule. kind and
--     name are immutable. Disable a system actor like a person
--     (status = 'disabled'); it can then no longer publish.
--   * One reserved row is created here: name 'seed', used by
--     scripts/seed-current.ts. Each further agent or job gets its own named row
--     when it is built, so provenance stays per source.
--   * cms_set_published gains a 5-argument form with p_published_at. Only a
--     system actor may pass a non-null value, only to publish, and never in the
--     future; it carries an imported item's original publish time (the seed's
--     WordPress dates). Null means now(). The 4-argument staff form is kept with
--     the same signature and grants and delegates to it, so there is still one
--     publish path and every publish writes a publication_events row.
--   * INSERT guard (closes the R2b known gap): published_at_guard() now also
--     runs BEFORE INSERT on all 9 publishable tables and refuses any row whose
--     published_at is not null. Rows are inserted as drafts, then published
--     through cms_set_published. This applies to upserts too: Postgres fires
--     BEFORE INSERT triggers before the ON CONFLICT check, so an upsert must
--     leave published_at out of its payload.
--
-- Not covered: scripts/seed-from-parsed.ts and src/lib/seed/sql.ts still insert
-- published rows and will be refused once this is applied (follow-up).
--
-- Apply BEFORE deploying code that filters staff lookups on kind (the lookup
-- fails closed without the column, so nobody could sign in) or that seeds as
-- the seed actor. Idempotent: safe to run twice. Agents do not apply it without
-- the owner's go (docs/ops/supabase-live-project.md).
-- =============================================================================

begin;

alter table admin_staff_accounts add column if not exists kind text not null default 'staff';
alter table admin_staff_accounts add column if not exists name text;
alter table admin_staff_accounts alter column email drop not null;
alter table admin_staff_accounts alter column auth_user_id drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admin_staff_accounts_kind_valid') then
    alter table admin_staff_accounts add constraint admin_staff_accounts_kind_valid check (kind in ('staff', 'system'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admin_staff_accounts_kind_shape') then
    alter table admin_staff_accounts add constraint admin_staff_accounts_kind_shape check (
      (kind = 'staff' and email is not null and auth_user_id is not null and name is null)
      or (kind = 'system' and email is null and auth_user_id is null and role = 'staff'
          and name is not null and name ~ '^[a-z][a-z0-9-]{0,62}$')
    );
  end if;
end
$$;
create unique index if not exists admin_staff_accounts_name_key on admin_staff_accounts (name);

-- Same guard as 20261119020000, plus immutable kind and name.
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
  if new.kind is distinct from old.kind or new.name is distinct from old.name then
    raise exception 'admin_staff_accounts.kind and name are immutable';
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

insert into admin_staff_accounts (kind, name) values ('system', 'seed')
  on conflict (name) do nothing;

create or replace function public.cms_set_published(
  p_entity_type text,
  p_entity_id uuid,
  p_publish boolean,
  p_actor_id uuid,
  p_published_at timestamptz
) returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_table   text;
  v_kind    text;
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

  select kind into v_kind from public.admin_staff_accounts
    where actor_id = p_actor_id and status = 'active';
  if v_kind is null then
    raise exception 'inactive or unknown staff actor' using errcode = '42501';
  end if;

  if p_published_at is not null then
    if v_kind <> 'system' then
      raise exception 'only a system actor may set the publish time' using errcode = '42501';
    end if;
    if not p_publish then
      raise exception 'a publish time applies only to publishing' using errcode = '22023';
    end if;
    if p_published_at > v_now then
      raise exception 'publish time cannot be in the future' using errcode = '22023';
    end if;
  end if;

  execute format('select 1, published_at from public.%I where id = $1 for update', v_table)
    into v_present, v_current
    using p_entity_id;
  if v_present is null then
    raise exception 'content row not found' using errcode = 'P0002';
  end if;

  if p_publish and v_current is null then
    v_current := coalesce(p_published_at, v_now);
    perform pg_catalog.set_config('thrive.cms_set_published', 'on', true);
    execute format('update public.%I set published_at = $1 where id = $2', v_table)
      using v_current, p_entity_id;
    perform pg_catalog.set_config('thrive.cms_set_published', 'off', true);
    insert into public.publication_events (entity_type, entity_id, action, actor_id)
      values (p_entity_type, p_entity_id, 'publish', p_actor_id);
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

-- Staff form: same signature and grants as R2/R2b, always publishes at now().
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
begin
  return public.cms_set_published(p_entity_type, p_entity_id, p_publish, p_actor_id, null::timestamptz);
end;
$$;

create or replace function public.published_at_guard() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.published_at is not null then
      raise exception 'rows are inserted as drafts; publish through cms_set_published'
        using errcode = 'P0001';
    end if;
    return new;
  end if;
  if new.published_at is distinct from old.published_at
     and coalesce(pg_catalog.current_setting('thrive.cms_set_published', true), '') <> 'on' then
    raise exception 'published_at changes only through cms_set_published'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists published_at_insert_guard on public.sermon_series;
create trigger published_at_insert_guard before insert on public.sermon_series
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.sermons;
create trigger published_at_insert_guard before insert on public.sermons
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.recurring_events;
create trigger published_at_insert_guard before insert on public.recurring_events
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.one_time_events;
create trigger published_at_insert_guard before insert on public.one_time_events
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.groups;
create trigger published_at_insert_guard before insert on public.groups
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.ministries;
create trigger published_at_insert_guard before insert on public.ministries
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.announcements;
create trigger published_at_insert_guard before insert on public.announcements
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.landing_pages;
create trigger published_at_insert_guard before insert on public.landing_pages
  for each row execute function public.published_at_guard();
drop trigger if exists published_at_insert_guard on public.outreach;
create trigger published_at_insert_guard before insert on public.outreach
  for each row execute function public.published_at_guard();

revoke execute on function public.cms_set_published(text, uuid, boolean, uuid, timestamptz) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function public.cms_set_published(text, uuid, boolean, uuid, timestamptz) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke execute on function public.cms_set_published(text, uuid, boolean, uuid, timestamptz) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.cms_set_published(text, uuid, boolean, uuid, timestamptz) to service_role;
  end if;
end
$$;

commit;
