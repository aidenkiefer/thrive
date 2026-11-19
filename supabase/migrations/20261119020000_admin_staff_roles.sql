-- =============================================================================
-- Migration: admin_staff_accounts.role (#102, 2026-11-19)
--
-- Adds a role to every staff account: 'admin' or 'staff' (default 'staff').
-- Owner decision (2026-11-19): staff account control (create, disable,
-- re-enable, rebind, change role) is admin-only; the owner is the only admin
-- for now. The website interprets roles in exactly one place
-- (src/lib/admin-permissions.ts); the database only enforces two invariants:
--
--   1. Changing a role bumps auth_version, which revokes that person's sessions
--      (same rule as disable, re-enable and rebind).
--   2. No update may leave zero active admins once one exists: demoting or
--      disabling the last active admin is refused. A transaction-scoped
--      advisory lock serializes concurrent demotions, so two admins demoting
--      each other at once cannot both succeed.
--
-- Bootstrapping is unaffected: inserts never reduce the number of admins, so
-- staff rows can exist before the first admin is enrolled.
--
-- Apply BEFORE deploying code that selects `role` (the staff lookup fails
-- closed without the column). Idempotent: safe to run twice. Agents do not
-- apply it without the owner's go (docs/ops/supabase-live-project.md).
--
-- Enroll the first admin (owner, SQL editor, after creating the Auth user):
--   insert into admin_staff_accounts (email, auth_user_id, role)
--   values ('person@example.org', '<auth user uuid>', 'admin');
-- Change a role: update admin_staff_accounts set role = 'staff' where actor_id = '...';
-- =============================================================================

begin;

alter table admin_staff_accounts add column if not exists role text not null default 'staff';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admin_staff_accounts_role_valid') then
    alter table admin_staff_accounts add constraint admin_staff_accounts_role_valid check (role in ('admin', 'staff'));
  end if;
end
$$;

-- Same guard as 20261118000000, plus the role bump and the last-admin rule.
-- Replacing the function keeps its triggers and its revoked execute grants.
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

commit;
