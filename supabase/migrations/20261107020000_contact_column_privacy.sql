-- =============================================================================
-- Migration: hide speaker/staff contact columns from public reads (2026-11-07)
--
-- Owner decision 3 (assignment release-candidate-2, 2026-11-07): speakers.email,
-- staff.email and staff.phone must not be readable with the public (anon) key.
-- RLS filters rows, not columns, and both tables allow public read of all rows,
-- so this uses column privileges: revoke table-level SELECT from anon and
-- authenticated, then grant SELECT on every other column.
--
-- Effects:
--   - Public queries must list columns. `select('*')` / `speakers(*)` on these
--     tables now fail with "permission denied" for anon.
--   - The admin (service-role key) is unaffected and still reads every column.
--   - A column added to speakers or staff later is NOT public until it is
--     granted here too (see supabase/README.md).
--
-- Idempotent: REVOKE on a table also removes its column grants, and GRANT
-- re-adds them, so running this twice gives the same result. No data changes.
-- Apply after 20261107010000_ministry_schedule_forms.sql.
-- =============================================================================

begin;

revoke select on table speakers from anon, authenticated;
grant select (id, slug, name, title, bio, photo_url, created_at)
  on table speakers to anon, authenticated;

revoke select on table staff from anon, authenticated;
grant select (id, slug, name, title, bio, photo_url, display_order, created_at)
  on table staff to anon, authenticated;

commit;
