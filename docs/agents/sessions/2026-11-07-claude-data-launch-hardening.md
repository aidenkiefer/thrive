# Session log: `claude/data-launch-hardening`

**Assignment:** `docs/agents/assignments/2026-11-07-mvp-launch-readiness-1.md` · **Lane:** data · **Tool:** claude · **Started:** 2026-11-07

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
D1 T1 done (d16db4d): `requireAdmin()` added and called first in all 10 inline admin server actions.
D2 T1 done (ee2d908): publish-time validation for announcements, sermons, events, recurring events, occurrences.
Gate run: unknown. Next ticket: unknown.

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
