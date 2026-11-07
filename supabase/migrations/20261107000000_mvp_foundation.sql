-- =============================================================================
-- Migration: MVP foundation (2026-11-07)
--
-- Brings a database created from the June schema (commit cd012bd,
-- supabase/schema.sql) up to the current supabase/schema.sql.
--
-- Idempotent: every statement is guarded, so running it twice is safe.
-- Non-destructive: no table, column, or row is dropped or rewritten. The only
-- object replaced is the event_occurrences public-read policy (tightened, see
-- RLS review in supabase/README.md).
--
-- Runs in one transaction: if any check fails, nothing is applied.
-- Apply order and review notes: supabase/README.md
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Columns
-- The Sprint 01 patch columns were an "apply after" block in the June schema,
--    so a June database may or may not have them. external_url is new.
-- -----------------------------------------------------------------------------

alter table sermons          add column if not exists topics       text[];
alter table sermons          add column if not exists service_type text default 'Sunday Service';
alter table recurring_events add column if not exists venue        text;
alter table one_time_events  add column if not exists venue        text;
alter table recurring_events add column if not exists external_url text;
alter table one_time_events  add column if not exists external_url text;

-- -----------------------------------------------------------------------------
-- 2. Occurrence identity: one row per (recurring event, start time)
--    The import upserts on this pair. Creating the unique index fails if a
--    June database already holds duplicates, so check first and stop with a
--    clear message instead of deleting anything.
-- -----------------------------------------------------------------------------

do $$
declare
  duplicate_groups int;
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'event_occurrences_identity_idx'
  ) then
    select count(*) into duplicate_groups from (
      select recurring_event_id, start_datetime
      from event_occurrences
      group by recurring_event_id, start_datetime
      having count(*) > 1
    ) d;
    if duplicate_groups > 0 then
      raise exception
        'event_occurrences has % duplicated (recurring_event_id, start_datetime) pairs. Resolve them by hand (see supabase/README.md), then re-run this migration.',
        duplicate_groups;
    end if;
  end if;
end $$;

create unique index if not exists event_occurrences_identity_idx
  on event_occurrences(recurring_event_id, start_datetime);

-- -----------------------------------------------------------------------------
-- 3. Row level security: enabled on every table (idempotent)
-- -----------------------------------------------------------------------------

alter table speakers         enable row level security;
alter table sermon_series    enable row level security;
alter table sermons          enable row level security;
alter table recurring_events enable row level security;
alter table event_occurrences enable row level security;
alter table one_time_events  enable row level security;
alter table groups           enable row level security;
alter table ministries       enable row level security;
alter table announcements    enable row level security;
alter table staff            enable row level security;
alter table landing_pages    enable row level security;
alter table outreach         enable row level security;

-- -----------------------------------------------------------------------------
-- 4. Public read policies: create any that are missing (same definitions as
--    supabase/schema.sql). Existing policies with these names are left alone.
-- -----------------------------------------------------------------------------

do $$
declare
  p record;
begin
  for p in
    select * from (values
      ('speakers',         'public_read_speakers',         'true'),
      ('staff',            'public_read_staff',            'true'),
      ('sermon_series',    'public_read_sermon_series',    'published_at is not null'),
      ('sermons',          'public_read_sermons',          'published_at is not null'),
      ('recurring_events', 'public_read_recurring_events', 'published_at is not null'),
      ('one_time_events',  'public_read_one_time_events',  'published_at is not null'),
      ('groups',           'public_read_groups',           'published_at is not null'),
      ('ministries',       'public_read_ministries',       'published_at is not null'),
      ('announcements',    'public_read_announcements',    'published_at is not null and (expires_at is null or expires_at > now())'),
      ('landing_pages',    'public_read_landing_pages',    'published_at is not null'),
      ('outreach',         'public_read_outreach',         'published_at is not null')
    ) as t(table_name, policy_name, using_expr)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = p.table_name and policyname = p.policy_name
    ) then
      execute format('create policy %I on %I for select using (%s)', p.policy_name, p.table_name, p.using_expr);
    end if;
  end loop;
end $$;

-- event_occurrences: the June policy exposed occurrences of unpublished
-- (draft) recurring events. Replace it so anonymous reads only see
-- non-cancelled occurrences whose recurring event is published. The site's
-- queries already filter this way, so public pages are unaffected.
drop policy if exists "public_read_event_occurrences" on event_occurrences;
create policy "public_read_event_occurrences" on event_occurrences for select using (
  cancelled = false
  and exists (
    select 1 from recurring_events r
    where r.id = event_occurrences.recurring_event_id
      and r.published_at is not null
  )
);

commit;
