# Supabase schema

| File | What it is |
|---|---|
| `schema.sql` | The current full schema. Source of truth for a **new** project. |
| `migrations/20261107000000_mvp_foundation.sql` | Brings a database created from the **June** schema (commit `cd012bd`) up to the Nov 7 foundation schema. |
| `migrations/20261107010000_ministry_schedule_forms.sql` | Adds nullable `ministries.schedule_description` and `ministries.churchsuite_form_url`. Run after the foundation migration. |
| `migrations/20261107020000_contact_column_privacy.sql` | Hides `speakers.email`, `staff.email`, `staff.phone` from public (anon) reads. Run last. |

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
5. SQL editor → paste `migrations/20261107020000_contact_column_privacy.sql` → Run. Grants only, no data changes; safe to run twice.
6. Seed.

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

**Finding 2, fixed (owner decision 2026-11-07): contact columns were readable on "all rows" tables.** `speakers.email`, `staff.email`, and `staff.phone` were readable by anyone with the anon key (RLS filters rows, not columns). Every other table exposes `contact_email` only on published rows, which is intended. The owner chose to hide them: `migrations/20261107020000_contact_column_privacy.sql` (and the end of `schema.sql`) revokes table-level `SELECT` on `speakers` and `staff` from `anon`/`authenticated` and grants it on every other column. The admin (service role) still reads everything.

Rules that follow:
- Public queries on `speakers`/`staff` must list columns. `select('*')` or an embed like `speakers(*)` fails with "permission denied". `src/lib/queries/sermons.ts` uses `SPEAKER_COLUMNS`.
- **Adding a column to `speakers` or `staff`?** Add it to the grant in both `schema.sql` and a new migration, or public pages can't read it.

Verified on a throwaway local `postgres:16` with Supabase-style table grants: June schema → all three migrations (privacy ×2) and a fresh `schema.sql` both deny `anon` on `select *` and the three contact columns, allow the listed columns, and end with identical column grants (30 rows).

## Shared rate limiter rehearsal (D1L-C, 2026-11-18, PGlite, not a live DB)

`migrations/20261118010000_shared_rate_limit.sql` (table `rate_limit_buckets`, functions `take_rate_limit` and `prune_rate_limit_buckets`) was run on PGlite 0.5.16, which is PostgreSQL 18.6 compiled to WASM. It ran in memory, with no docker and no network. The harness creates Supabase-like roles first: `anon` and `authenticated`, plus `service_role` with `BYPASSRLS`. It also sets Supabase-style default privileges that grant everything new in `public` to all three roles, so the migrations' revokes are actually tested. No `auth` schema is needed.

| Scenario | Result |
|---|---|
| Fresh `schema.sql` | Run 1 succeeds. Run 2 stops with `policy "public_read_speakers" ... already exists`, as documented in path A |
| Fresh `schema.sql` → all 4 migrations, in order, twice | All succeed; catalog unchanged (no-op) |
| June schema (`cd012bd`) → each migration ×2 in order → whole chain again | All succeed |
| June schema without its patch block → same | All succeed |
| Catalog of both migrated June DBs vs fresh `schema.sql` (columns, constraints, indexes, policies, RLS flags, table ACLs, functions incl. ACLs, triggers) | Identical: 196 columns, 86 constraints, 35 indexes, 12 policies, 14 tables, 3 functions, 2 triggers |
| Limiter checks, run on each of the 3 databases | 345/345 pass |

The limiter checks cover:

- **Access:** RLS is on and there are no policies. `anon` and `authenticated` are denied select, insert, update, delete, `take_rate_limit`, and `prune_rate_limit_buckets` (42501). `PUBLIC` holds no grant. `service_role` can do all of them. Both functions are `security invoker` with `search_path=""`.
- **CHECK constraints:** `subject_hash` must be exactly 64 lowercase hex characters. 63 or 65 characters, uppercase, non-hex, a raw email, an empty string, or a trailing newline are all rejected (23514). The purpose, window, hits, and expiry checks also reject bad values.
- **Invalid arguments:** null, malformed, or out-of-range purpose, hash, limit, or window, and prune bounds of 0, 10001, or null, raise 22023 and write nothing.
- **Counting** (limit 3, 60 s window): hits 1–3 are allowed with retry 0. Hit 4 and later are denied, with `retry_after` equal to the seconds left in the window. The counter stays capped at limit + 1. A limit of 1 allows one hit, then denies.
- **Isolation:** a different purpose, subject, or window length gets its own bucket.
- **Window expiry:** tested both by moving a row back an hour and with a real 1-second window. The next hit is allowed and the counter resets to 1.
- **Cleanup:** each `take_rate_limit` call deletes at most 25 expired rows and keeps live rows and the caller's row. `prune_rate_limit_buckets(n)` honors its bound, returns the count, and removes only expired rows.

Two control checks prove the harness can fail. Removing the `anon` revoke fails 30 checks. Removing the `least(...)` cap fails the cap check. The run also showed that `service_role` depends on `BYPASSRLS`: a role with the same grants but without it gets "new row violates row-level security policy". The privilege checks above mean `anon` is stopped by the missing grants, not only by RLS.

**What this does not prove:**

- **Column grants.** The catalog comparison covers table ACLs, not column-level grants, so the harness does not check the contact-column privacy grants. Those were verified separately on `postgres:16` (Finding 2 above).

- **Concurrency.** PGlite has one connection, so concurrent callers were not tested there. The real test is the "Real Postgres rehearsal (#60)" section below: 50 simultaneous connections against Postgres 17.
- **Hosted Supabase roles.** The roles and default privileges were stubbed by hand. Real Supabase role details (`supabase_admin` as owner, PostgREST exposure, whether `service_role` really bypasses RLS) are unproven. Re-run the privilege query in the D1L session log on Preview.
- **Postgres version.** Hosted Supabase runs an older major version than PGlite's 18.6. The SQL uses only long-standing features.

Re-run it. The harness is committed in `scripts/pglite-rehearsal/`, a standalone package with its own lockfile. PGlite is **not** an app dependency, and the app build does not touch the folder:

```sh
cd scripts/pglite-rehearsal && npm ci && npm run rehearse   # exit 0 = all checks pass
```

It reads the June baseline schema from this checkout's git history (`cd012bd`). Since the QA round on 2026-11-19 it also checks the D1R staff table: `service_role` has only select, insert, and update, and delete and truncate are refused, with the row surviving. That made 398 checks (406 once #90's R2 block is stacked on top). #102 adds the staff role checks (default `staff`, invalid role refused, role change bumps `auth_version`, last active admin cannot be demoted or disabled): **448 checks** on `claude/data-admin-role`; the `last-admin` mutant fails 18 of them and exits 1. To prove the harness can fail, build a mutated copy and rehearse it. It must exit 1:

```sh
node mutate.mjs ../.. /tmp/mut staff-truncate && node rehearse.mjs /tmp/mut   # also: revoke, cap, last-admin
```

## Real Postgres rehearsal (#60, 2026-11-19)

The same schema and migration chain, run on a real multi-connection Postgres: **PostgreSQL 17.11** from the `embedded-postgres` npm package (`17.11.0-beta.19`), started as a disposable local cluster in a temp dir on a random port and deleted afterwards. No docker, no psql, no network database, no live Supabase project. The Supabase role stubs are the same as the PGlite harness: `anon`, `authenticated`, and `service_role` with `BYPASSRLS`, plus Supabase-style default privileges.

```sh
cd scripts/pg-rehearsal && npm ci && node rehearse-pg.mjs   # exit 0 = pass, 1 = a check failed, 2 = crash
```

It is a standalone package with its own lockfile, not an app dependency. It reads the June baseline from git history (`cd012bd`), like the PGlite harness. It takes about 20 seconds and uses about 50 connections at a time.

**What it proves:** the #60 chain, the #102 role checks and last-admin race, and the #45 RLS matrix below. The command prints the pass count. Do not treat an older count in this paragraph as the current total.

- **Scenarios.** A: fresh `schema.sql`, then the chain twice (190 checks). B: June schema, each migration twice, then the chain again (191). C: June schema without its patch block (191). In B and C the catalog (columns, constraints, indexes, policies, RLS flags, table ACLs, function bodies and ACLs, triggers) is identical to the fresh schema.
- **Grants and RLS.** `rate_limit_buckets` and `admin_staff_accounts` have RLS on and no policies. `anon` and `authenticated` have no table privilege and cannot execute `take_rate_limit` or `prune_rate_limit_buckets`, checked with `has_*_privilege` and by connecting and running `SET ROLE` (error 42501). `PUBLIC` has no grant. `service_role` can use the limiter, and on `admin_staff_accounts` it has select, insert, and update but not delete or truncate. A control role with the same grants but no `BYPASSRLS` is blocked, so `service_role` depends on `BYPASSRLS`.
- **Function behaviour.** The PGlite counting, validation, cap, retry, window, and cleanup checks all pass again on Postgres 17.
- **Concurrency.** 50 separate connections, each `SET ROLE service_role`, call `take_rate_limit` at the same moment. A coordinator holds an advisory lock until all 50 backends are parked on it, then releases it, so the calls really overlap. In each scenario (45 checks each):
  - 5 trials on a brand-new subject, limit 3, so each is a first-insert race: exactly 3 allowed, 47 denied with `retry_after_seconds` in [1, 60], and the bucket `hits` = 4 (limit + 1). No errors.
  - 1 trial on an existing bucket with one hit: exactly 2 allowed.
  - 1 mixed trial, 50 callers over 5 subjects, limit 2: exactly 10 allowed, 2 per subject.
  - 1 trial with 100 expired rows to clean up while 50 callers run: no errors or deadlocks.
- **The concurrency test can fail.** In scenario A the script also builds a deliberately non-atomic copy (`mut.take_rate_limit`: read the count, then write back the value it read). It fails 5 of 5 new-subject trials and 5 of 5 existing-bucket trials (between 5 and 13 calls allowed instead of the limit). A separate run with the `anon` revoke removed from the migration failed 22 checks.
- **RLS matrix (#45, `src/lib/security/rls-matrix.mjs`, 125 checks per scenario).** In a rolled-back transaction it seeds a published and a draft row per content table, then probes as `anon` and `authenticated`. They see only published rows, with no drafts and no expired announcements; occurrences show only when not cancelled and their parent is published; every speakers and staff row is readable but `speakers.email`, `staff.email` and `staff.phone` are refused (42501); every insert, update and delete on the 12 content tables is refused; they have no access to `admin_staff_accounts`, `rate_limit_buckets` or the limiter functions; and every table in `public` must be classified as content or service-only. It prints one NOTE: `anon` and `authenticated` hold `TRUNCATE` on the content tables (Supabase default privileges), which RLS does not cover. PostgREST has no truncate operation and both roles are `nologin`, so the API can't reach it; revoking it is an owner decision. It can fail: a mutated copy with `using (true)` on sermons and `email` in the speakers grant failed 8 matrix checks.

**What it still does not prove:**

- **Hosted Supabase roles and ownership.** The roles are stubs and the owner is a superuser. Real `supabase_admin` ownership, hosted default privileges, and extra grants are unproven.
- **PostgREST exposure.** Nothing here goes through the API. Whether `rate_limit_buckets` and the functions are reachable at `/rest/v1` with the anon key is unproven.
- **Postgres version.** 17.11 is tested. A Supabase project still on 15 is not.
- **Load.** 50 callers from one machine proves the row lock serializes. It says nothing about pooler behaviour or latency on the hosted project.
