# QA report: Data stack (#15, #18, #23), CMS slice (#90) and carry-over PRs (2026-11-19)

Senior QA by Cursor (independent reviewer subagents; findings are evidence, PR bodies are claims). Nothing here was merged to production-bound `main` except where stated.

## Merged this session
#24 draft handoff, #25 motion (after QA found a soft-404 regression from a route-group `loading.tsx`, removed), #27 sitemap, #28 GTM (container `GTM-PRJX6P9H`, owner choice), #29 JSON-LD (unsourced `eventAttendanceMode` removed), #26, #85/#86/#89/#87/#21/#88/#92 (replacements for Codex PRs #5, #16, #20, #14; #9 closed as superseded).

## Data stack: HOLD for Preview verification (not code-blocked)
Gate: #15 127 tests, #18 143, #23 236, merged stack 250 (0 lint errors). Stack merges in order with no conflicts; production smoke with Supabase unset passes (`/admin*` 307 to login, empty form POST 400 JSON, public pages 200).

Why held: `main` deploys to production. Merging early would lock out shared-password admins before staff are enrolled, and feedback and staff sign-in return 503 until `RATE_LIMIT_HASH_SECRET` and migration `20261118010000` exist. Required before merge (checklist on issue #41): privilege query on hosted DB; 50-parallel-call limiter check (exactly 3 allowed at limit 3); migration chain twice; end-to-end staff sign-in with a real Auth user (wrong, expired, replayed, disabled, rebound codes); sandbox feedback send. Supabase Auth: disable signups, short OTP expiry (issue #54).

Findings (all on Claude's branches; hand-off prompt sent to the owner):
- #23 S1 docs/env omit `RATE_LIMIT_HASH_SECRET` and the migration step; S2 PR body stale (fixed by coordinator: body replaced with Claude's corrected text); N3 limiter runs before validation; N4 duplicated IP derivation.
- #15 S4 roster timing side channel (request-code and verify); S6 `service_role` can TRUNCATE `admin_staff_accounts` (revoke delete, truncate); S5 request body read before size cap.
- #15/#18/#23 S3 failures are silent (log fixed-code, PII-free lines). N1 stale `scripts/make-admin-hash.mjs`; N2 `.env.local.example` pre-fills transport and an unconfirmed `info@` address; N6 session is 4h from sign-in, revocation = disable row or bump `auth_version`; N7/N8 per-email lockout abuse accepted for MVP.
- Limiter fails closed everywhere (accepted; document in docs/06). Route coverage: forms, request-code, and the NextAuth credentials callback use it.
- Retarget procedure after #15 is squash-merged (#18 and #23 are not clean rebases): `gh api -X PATCH .../pulls/18 -f base=main`; branch from `origin/main` and cherry-pick #18's own two commits (`3b707c2 1ec0f87`); for #23 capture `gh pr diff 23 --name-only` first, retarget, branch from `origin/main`, `git checkout origin/claude/data-shared-limiter -- <files>`.

## CMS slice #90: FIX-FIRST (small)
Gate 155 tests on its own branch. Migration `20261119000000_publication_events.sql` is sound (RLS on, no policies, `security invoker` with fixed search_path, `service_role` select/insert only, append-only). Attribution comes from `requireAdmin()` and event plus publish share one transaction.
- F1 (should-fix): `src/lib/rate-limit/migration.test.ts` (from #23) slices `schema.sql` to end of file; after #90 appends its block 2 tests fail. Fix in #23: bound the slice at the next `-- ====` section rule (verified: 278 tests pass).
- F2 (should-fix): `src/app/admin/announcements/page.tsx:38-62` skips `revalidatePath('/')` if the update throws after an unpublish commits; wrap in try/finally.
- F3 (should-fix): in-repo tests do not cover draft/published visibility or actor pass-through; extract the save/publish sequence from the `'use server'` file into `src/lib/cms/` and test it; commit the PGlite rehearsal script or say it is unreproducible.
- F4 (should-fix): PR note says the `schema.sql` conflict is "keep both"; it is not. Say "take main's schema.sql, then append the R2 block".
- F5 stale PR-body numbers; F6 re-saving a published announcement edits live content (parked scope); F7 other editors still write `published_at` directly (deferred to #91).
- Retarget after the stack lands: branch from `origin/main`, `git checkout $OLD -- src/lib/cms src/app/admin/announcements/page.tsx supabase/migrations/20261119000000_publication_events.sql docs/agents/sessions/2026-11-19-claude-data-batch-2.md`, append the R2 block of `schema.sql` (from the `-- R2: publication_events` header) to main's; apply the F1 fix if #23 lacks it. Verified byte-identical to the merge simulation.

## Carry-over PR verdicts (resolved)
#16 -> replaced by #85; #20 -> #89 (3 new files only; vitest `oxc` JSX and `@` alias both needed); #5 -> #86; #14 -> #87 (owner approved the `AGENTS.md` forms-constraint change 2026-11-19); #9 closed (its `PROGRESS.md` edit stated a false status); #21 fixed (stack order #15 -> #18 -> #23; real limiter signature `takeSharedRateLimit({ purpose, subjectHash, limit, windowSeconds })`).

## Not verified
Real Supabase Auth email OTP and Resend delivery; hosted-Postgres privileges, concurrency and PostgREST behavior (PGlite stands in: 353 checks on the stack, 264/270 on #90, but single-connection and WASM); Ads tag inside `GTM-PRJX6P9H`; live URLs and ChurchSuite/Mailchimp destinations.
