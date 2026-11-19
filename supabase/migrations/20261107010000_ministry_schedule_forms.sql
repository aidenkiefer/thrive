-- =============================================================================
-- Migration: ministry schedule + signup form fields (2026-11-07)
--
-- Adds two nullable columns to `ministries` so a ministry page can show its
-- meeting schedule and embed its signup form (assignment
-- release-candidate-2, contract C2):
--
--   schedule_description  free-text schedule entered by staff
--   churchsuite_form_url  signup form URL. Same name as the column on
--                         recurring_events, one_time_events, groups, outreach.
--                         Holds a ChurchSuite or Google Forms link; the admin
--                         and the public page both check it with
--                         isApprovedFormUrl() in src/lib/form-urls.ts.
--
-- Idempotent and non-destructive: guarded `add column if not exists`, no
-- defaults, no backfill. Existing rows keep working with NULL values.
-- RLS is unchanged (ministries already allow public read of published rows).
-- Apply after 20261107000000_mvp_foundation.sql. See supabase/README.md.
-- =============================================================================

begin;

alter table ministries add column if not exists schedule_description text;
alter table ministries add column if not exists churchsuite_form_url text;

commit;
