# Session log: `claude/data-release-candidate-2`

**Assignment:** `docs/agents/assignments/2026-11-07-release-candidate-2.md` · **Lane:** data · **Tool:** claude · **Started:** 2026-11-07

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
D1 done (01aeb00); contract PR #11 open for fast-merge. Next: D2.
D5 is parked until the owner answers decision 3 (contact-column privacy).

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- **blocker** D5: owner decision 3 is open (revoke anon read on `speakers.email`, `staff.email`, `staff.phone`?). Recommended: revoke. Parked until answered. (opus-5.5)
- **change** D1 T1: C2 + C3 delivered. `ministries.schedule_description` and `churchsuite_form_url` (guarded migration `20261107010000`), `Ministry` type, `isApprovedFormUrl()` in `src/lib/form-urls.ts`, admin ministries editor with inline feedback and publish-time form-URL rule. Disposable postgres:16: migration ×2 rc=0, columns match fresh schema. (opus-5.5) [01aeb00]
  Key files: `supabase/migrations/20261107010000_ministry_schedule_forms.sql`, `src/lib/form-urls.ts`, `src/lib/queries/ministries.ts`, `src/app/admin/ministries/page.tsx`, `src/lib/admin-validation.ts`, `supabase/README.md`.
- **decision** D1: contract shipped on a second branch `claude/data-contract-release-candidate-2` (PR #11) so it can fast-merge without D2–D4. (opus-5.5)
- **request** ops: add Vitest cases for `isApprovedFormUrl` in `tests/` (accept ChurchSuite subdomains, `docs.google.com/forms/`, `forms.gle/x`; reject `http:`, `churchsuite.com.evil.io`, `evilchurchsuite.com`, Google non-form paths, credentials, ports, leading whitespace, `javascript:`) and for `formUrlPublishProblems`. Target lane: ops. (opus-5.5)
