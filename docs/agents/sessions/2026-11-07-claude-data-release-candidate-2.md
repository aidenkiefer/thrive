# Session log: `claude/data-release-candidate-2`

**Assignment:** `docs/agents/assignments/2026-11-07-release-candidate-2.md` · **Lane:** data · **Tool:** claude · **Started:** 2026-11-07

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
D1–D5 done (D1 merged as #11 14b7e25; D5 3a67917). GATE: PASS.
PR #12 open for senior QA; not merged. D3 still needs a runtime check in a configured env.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- **blocker** D5: owner decision 3 is open (revoke anon read on `speakers.email`, `staff.email`, `staff.phone`?). Recommended: revoke. Parked until answered. (opus-5.5)
- **change** D1 T1: C2 + C3 delivered. `ministries.schedule_description` and `churchsuite_form_url` (guarded migration `20261107010000`), `Ministry` type, `isApprovedFormUrl()` in `src/lib/form-urls.ts`, admin ministries editor with inline feedback and publish-time form-URL rule. Disposable postgres:16: migration ×2 rc=0, columns match fresh schema. (opus-5.5) [01aeb00]
  Key files: `supabase/migrations/20261107010000_ministry_schedule_forms.sql`, `src/lib/form-urls.ts`, `src/lib/queries/ministries.ts`, `src/app/admin/ministries/page.tsx`, `src/lib/admin-validation.ts`, `supabase/README.md`.
- **decision** D1: contract shipped on a second branch `claude/data-contract-release-candidate-2` (PR #11) so it can fast-merge without D2–D4. (opus-5.5)
- **request** ops: add Vitest cases for `isApprovedFormUrl` in `tests/` (accept ChurchSuite subdomains, `docs.google.com/forms/`, `forms.gle/x`; reject `http:`, `churchsuite.com.evil.io`, `evilchurchsuite.com`, Google non-form paths, credentials, ports, leading whitespace, `javascript:`) and for `formUrlPublishProblems`. Target lane: ops. (opus-5.5)
- **change** D2 T1: `formUrlPublishProblems()` added to publish rules for events and recurring events; groups and outreach switched to `saveWithFeedback` + `fail()` so the message shows inline (plain `Error` messages are hidden in production). `requireAdmin()` still first in all 5 actions. (opus-5.5) [518301f]
  Key files: `src/app/admin/{events,recurring-events,groups,outreach}/page.tsx`.
- **change** D3 T1: new client `AdminForm` submits from `onSubmit` (preventDefault), which skips React 19's post-action form reset, so typed values survive a rejected save. Nothing goes into the URL or storage. `formInstanceKey()` remounts only after a successful save. Applied to 8 forms on 7 pages. (opus-5.5) [7f51563]
  Key files: `src/app/admin/_components/admin-form.tsx`, `src/app/admin/_components/form-feedback.tsx`.
- **note** D3: not exercised at runtime. This worktree has no `.env.local` and Preview env vars aren't configured. QA: in a configured env, publish an announcement with a passed expiry and confirm the inputs keep their values and show the error; fix it and confirm the save succeeds and the "new" form clears. (opus-5.5)
- **change** D4 T1: Express(o) `isPaused: false`, `pauseNote: null`; time/location unchanged; owner source noted in a comment. Only consumer: `src/components/home/ServiceTimesSection.tsx` (experience; renders the pause note only when paused, so no change needed there). (opus-5.5) [91f483b]
- **note**: lint warnings unchanged at 12. The pre-existing `prefer-const` in `src/app/admin/staff/page.tsx:16` was left alone (not in a ticket). (opus-5.5)
- **note**: session end. GATE: PASS. PR #11 [contract] + PR #12 [data] open for senior QA; D5 parked on owner decision 3. (opus-5.5)
- **decision**: owner merged #11 and answered yes to decisions 1–4 (2026-11-07). Branch rebased onto 14b7e25; the duplicate D1 commit dropped. (opus-5.5)
- **change** D5 T2: guarded grants migration `20261107020000_contact_column_privacy.sql` + the same block in `schema.sql`. Sermon queries embed `speakers(${SPEAKER_COLUMNS})`; public `Speaker` type drops `email`. No public code read the hidden columns (grep). Disposable postgres:16: June → 3 migrations (privacy ×2) and fresh schema both deny anon `select *`/contact columns and allow the listed columns; grants identical. (opus-5.5) [3a67917]
  Key files: `supabase/migrations/20261107020000_contact_column_privacy.sql`, `supabase/schema.sql`, `supabase/README.md`, `src/lib/queries/sermons.ts`.
- **note** D5 for QA/owner: after applying, `select('*')` on `speakers`/`staff` with the anon key fails by design. A new column on these tables needs a grant to become public (README). (opus-5.5)
