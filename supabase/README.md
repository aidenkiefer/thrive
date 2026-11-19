# Supabase schema

| File | What it is |
|---|---|
| `schema.sql` | The current full schema. Source of truth for a **new** project. |
| `migrations/20261107000000_mvp_foundation.sql` | Brings a database created from the **June** schema (commit `cd012bd`) up to the Nov 7 foundation schema. |
| `migrations/20261107010000_ministry_schedule_forms.sql` | Adds nullable `ministries.schedule_description` and `ministries.churchsuite_form_url`. Run after the foundation migration. |

Agents never run either file against a live database. The owner applies them.

## Apply order

Pick **one** path, depending on the database you have.

**A. Fresh Supabase project (no tables yet)**

1. SQL editor → paste `schema.sql` → Run. Run it **once**: its `create policy` statements are not guarded, so a second run stops with "policy already exists" (harmless, but noisy).
2. Optional: run the migrations afterward, in filename order. On a fresh project they are no-ops.
3. Seed (see `migration-files/parsed/import-readiness.md`).

**B. Existing database created from the June schema**

1. Back up first: Supabase dashboard → Database → Backups, or `pg_dump`.
2. SQL editor → paste `migrations/20261107000000_mvp_foundation.sql` → Run. It runs in one transaction, so either everything applies or nothing does.
3. If it stops with `event_occurrences has N duplicated (recurring_event_id, start_datetime) pairs`, nothing was changed. Find the pairs with the query below, decide by hand which row to keep, delete the others, then run the migration again.

   ```sql
   select recurring_event_id, start_datetime, array_agg(id) as ids
   from event_occurrences
   group by 1, 2 having count(*) > 1;
   ```
4. SQL editor → paste `migrations/20261107010000_ministry_schedule_forms.sql` → Run. It only adds two nullable columns, so it is safe to run twice.
5. Seed.

With the Supabase CLI instead of the SQL editor, `supabase db push` applies `migrations/` in filename order.

## What the migration changes

| Change | Why |
|---|---|
| `recurring_events.external_url`, `one_time_events.external_url` | New "other action URL" field used by admin and event pages |
| `sermons.topics`, `sermons.service_type`, `recurring_events.venue`, `one_time_events.venue` | Sprint 01 patch columns. The June file listed them as "apply after", so a June DB may lack them |
| Unique index `event_occurrences_identity_idx` on `(recurring_event_id, start_datetime)` | The import and the admin form upsert on this pair. Duplicates are checked first; nothing is deleted |
| RLS enabled on all 12 tables, missing public-read policies created | Guarded, so they're safe to re-run |
| `public_read_event_occurrences` replaced (tightened) | See RLS finding 1 |

Every statement is guarded (`add column if not exists`, `create unique index if not exists`, `pg_policies` lookups, `drop policy if exists` + `create`), so it can run twice.

### Verification (2026-11-07, throwaway local `postgres:16`, not a live DB)

| Scenario | Result |
|---|---|
| June schema → migration → migration | Both runs succeed |
| June schema **without** its patch block → migration ×2 | Both runs succeed |
| Current `schema.sql` → migration | Succeeds, no-op |
| June schema + one duplicated occurrence → migration | Stops with the duplicate message; transaction rolled back (no `external_url` column added) |
| Catalog comparison (columns, types, defaults, nullability, indexes, policies, RLS flags) of both migrated June DBs vs a fresh `schema.sql` DB | Identical: 180 columns, 12 policies, RLS on 12/12 tables |

### Ministry schedule + form fields (2026-11-07)

`ministries.schedule_description` (free text) and `ministries.churchsuite_form_url` (signup form). The column name matches the one on `recurring_events`, `one_time_events`, `groups` and `outreach`. It may hold a ChurchSuite **or** Google Forms link. Admin blocks publishing any other host, and public pages embed only links that pass `isApprovedFormUrl()` in `src/lib/form-urls.ts`. RLS is unchanged.

Verified on a throwaway local `postgres:16` (not a live DB): main `schema.sql` → this migration ×2 → foundation migration again, all succeed; the migrated `ministries` columns match a fresh `schema.sql` exactly (15 columns); existing rows read NULL for both fields.

## RLS review (2026-11-07)

How access works: public pages read with the **anon** key (`src/lib/supabase/server.ts`), so RLS applies. Admin pages write with the **service-role** key (`src/lib/admin-db.ts`), which bypasses RLS. That's why every admin action checks the session first with `requireAdmin()`. No table has an insert/update/delete policy, so anon and authenticated users cannot write anything.

| Table | RLS | Public read rule | Notes |
|---|---|---|---|
| speakers | on | all rows | See finding 2 (`email` column) |
| sermon_series | on | published | |
| sermons | on | published | A published sermon in a draft series is still readable; admin now blocks publishing a sermon into a draft series |
| recurring_events | on | published | |
| event_occurrences | on | not cancelled **and** parent recurring event published | Tightened, finding 1 |
| one_time_events | on | published | |
| groups | on | published | |
| ministries | on | published | |
| announcements | on | published and not expired | |
| staff | on | all rows | See finding 2 (`email`, `phone`) |
| landing_pages | on | published | |
| outreach | on | published | |

**Tables without RLS: none.**

**Finding 1, fixed: occurrences of draft events were public.** The June policy was `cancelled = false`, so anyone with the anon key could list occurrences (times, location overrides, notes) of unpublished recurring events. The site's queries already dropped them in code, so the leak was API-only. The policy now also requires the parent recurring event to be published, in both `schema.sql` and the migration. Public pages are unaffected.

**Finding 2, owner decision: contact columns are readable on "all rows" tables.** `speakers.email`, `staff.email`, and `staff.phone` are readable by anyone with the anon key (RLS filters rows, not columns). Every other table exposes `contact_email` only on published rows, which is intended. If speaker or staff contact details should not be public, the options are leaving those columns empty, or revoking column access (`revoke select (email) on speakers from anon;` plus a grant on the remaining columns). Not changed this session.
