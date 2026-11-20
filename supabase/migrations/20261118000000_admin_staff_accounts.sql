-- =============================================================================
-- Migration: admin_staff_accounts (D1R, 2026-11-18)
--
-- Service-role-only table binding a durable staff actor UUID to a preprovisioned
-- Supabase Auth user. The website checks it on every admin request: the row
-- must be 'active' and its auth_version must equal the session's.
--
--   actor_id      durable author key for revisions; never reused, never derived
--                 from email
--   email         normalized (lowercase, trimmed); login/contact detail only
--   auth_user_id  the Supabase Auth user (auth.users.id) that proves the email;
--                 no FK so this file also runs where the auth schema is absent
--   status        'active' | 'disabled'
--   auth_version  bumped by trigger on disable, re-enable, or auth_user_id
--                 rebind, which revokes every existing session
--
-- Rows are never deleted or truncated (triggers block both, and service_role
-- has no delete/truncate grant) so revision attribution survives.
-- RLS is on with NO policies; anon/authenticated are revoked; only service_role
-- can select/insert/update. Idempotent: safe to run twice. Agents do not apply it.
--
-- Provision (owner, SQL editor, after creating the user in Auth > Users):
--   insert into admin_staff_accounts (email, auth_user_id)
--   values ('person@example.org', '<auth user uuid>');
-- Disable:  update admin_staff_accounts set status = 'disabled' where actor_id = '...';
-- Rebind:   update admin_staff_accounts set auth_user_id = '<new uuid>' where actor_id = '...';
-- =============================================================================

begin;

create table if not exists admin_staff_accounts (
  actor_id      uuid primary key default gen_random_uuid(),
  email         text not null,
  auth_user_id  uuid not null,
  status        text not null default 'active',
  auth_version  integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  disabled_at   timestamptz,
  constraint admin_staff_accounts_email_normalized check (email <> '' and email = lower(btrim(email))),
  constraint admin_staff_accounts_status_valid check (status in ('active', 'disabled')),
  constraint admin_staff_accounts_version_positive check (auth_version >= 1)
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
  if new.status is distinct from old.status or new.auth_user_id is distinct from old.auth_user_id then
    -- Disable, re-enable, or rebind: revoke every existing website session.
    new.auth_version := greatest(new.auth_version, old.auth_version) + 1;
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

commit;
