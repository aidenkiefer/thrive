# Session log: `claude/data-launch-hardening`

**Assignment:** `docs/agents/assignments/2026-11-07-mvp-launch-readiness-1.md` · **Lane:** data · **Tool:** claude · **Started:** 2026-11-07

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
D1-D4 done: d16db4d (D1), ee2d908 (D2), fdf4b0a (D3), d612aa3 (D4 readiness + Express(o) as recurring).
D5 next. Lane NOT blocked; owner decision on speakers/staff contact columns is non-blocking (see blocker entry).

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `03:02` **change** D1 T1: `requireAdmin()` in `src/lib/admin-auth.ts` (getServerSession + ADMIN_EMAIL match; redirects to /admin/login on failure = fail closed). Called first in 10 actions across 9 admin pages; `adminDb()` delegates to it; removed unused `createServiceClient()` (service-role, no auth check). Middleware unchanged. (opus-5.5) [d16db4d]
  Key files: `src/lib/admin-auth.ts`, `src/lib/admin-db.ts`, `src/lib/supabase/server.ts`, `src/app/admin/*/page.tsx` (9 pages).
- `03:02` **note**: `server-only` package not installed (package.json is ops-quality lane), so not used.
- `03:06` **change** D2 T1: shared validator `src/lib/admin-validation.ts` (pure) + `saveWithFeedback`/`readFeedback` in `src/lib/admin-form.ts`; inline errors via `?error=&form=` redirect. Format rules for announcements, sermons, one-time events, recurring events, occurrences (dates 2000-2100, end>=start, HTTPS URLs, offset must match America/Chicago incl. DST; nonexistent 2026-03-08 02:30 rejected); publish rules only when Published is checked; relationship checks (speaker/series/parent exist; series must be published). Sanity-checked with tsx on DST cases 2026-03-08 and 2026-11-01. (opus-5.5) [ee2d908]
  Key files: `src/lib/admin-validation.ts`, `src/lib/admin-form.ts`, `src/app/admin/_components/form-feedback.tsx`, `src/app/admin/{announcements,sermons,events,recurring-events}/page.tsx`.
- `03:06` **decision**: publish rules: announcement needs body, CTA text+URL paired, expiry in future; sermon needs speaker + at least one of youtube/video/audio URL (9 of 120 imported sermons have no media, so they need media before re-saving as published).
  One-time event needs description or short summary; recurring event needs description or summary + schedule description + typical time; location NOT required (32/55 imported one-time events lack it).
- `03:06` **decision**: feedback travels in the query string (admin-only page, React-escaped text, capped at 500 chars). Limitation: on a rejected save the form re-renders with stored values, so unsaved edits are lost.
- `03:06` **note**: untracked `tsconfig.tsbuildinfo` appears after typecheck; not committed (`.gitignore` is not in the data lane).
- `03:10` **change** D3 T2: idempotent June->current migration + `supabase/README.md` (apply order, verification, RLS review); `supabase/schema.sql` synced. Verified on throwaway local postgres:16 (not live DB): June schema x2 OK, June-without-patch x2 OK, fresh schema + migration no-op, duplicate occurrence gives clear error + full rollback; migrated June catalog identical to fresh schema.sql (180 cols, 12 policies, RLS 12/12). (opus-5.5) [fdf4b0a]
  Key files: `supabase/migrations/20261107000000_mvp_foundation.sql`, `supabase/README.md`, `supabase/schema.sql`.
- `03:10` **decision**: tightened `public_read_event_occurrences` (schema.sql + migration) to require the parent recurring event be published. June policy exposed draft events' occurrences via the anon key. Public queries already filter in JS, so pages are unaffected. (opus-5.5) [fdf4b0a]
- `03:10` **blocker**: owner decision needed. `speakers.email`, `staff.email`, `staff.phone` are anon-readable (all-rows policies; RLS is row-level). Options: keep public, leave empty, or revoke column select from anon. Recommended: leave speakers.email empty or revoke; staff contact per owner. Not changed.
- `03:14` **change** D4 T1/opus-5.5: import readiness pass. Counts 120 sermons, 80 events (55+25); slugs unique + admin-valid (234); 0/246 datetimes with wrong Chicago offset; DST checked 2026-03-08 and 2026-11-01; relationships pass; seed re-run idempotent after fix. Express(o) resolved via OWNER_SCHEDULES (weekly Sun 8:30 AM Chicago, cafe; source "owner, 2026-11-07"); 13 occurrences 2026-11-08..2027-01-31; editorial hold removed. (opus-5.5) [d612aa3]
  Bugs fixed: (1) sermon published_at now Chicago offset, 180/180 match post_date_gmt; (2) recurrence_description now from rule fields ("Wednesdays", "Every other Thursday", "Selected dates"); (3) seed-current.ts series published_at = earliest sermon, not now(). parsed/ regenerated (occurrences 43->56).
  Key files: `migration-files/parse-current-exports.py`, `migration-files/parsed/import-readiness.md`, `scripts/seed-current.ts`, `migration-files/parsed/event_occurrences.json`, `migration-files/parsed/migration-report.json`, `migration-files/parsed/sermons.json`.
- `03:14` **note**: seed re-run overwrites admin edits on imported slugs. Documented as owner note in import-readiness.md.
