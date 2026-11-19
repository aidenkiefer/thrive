# Session log: `cursor/ops-mvp-fixtures`

**Assignment:** `docs/agents/assignments/2026-11-18-batch-2.md` · **Lane:** Ops (Cursor agent as stand-in; owner approved) · **Tool:** cursor · **Started:** 2026-11-19

## Status
This REPLACES PR #16 (`codex/ops-mvp-fixtures`, originally by Codex). Fixtures, tests and the URL/form disposition matrix are carried over with QA fixes applied. The E4 ministry renderer is integrated on `main`: `MinistryScheduleSignup` (`src/components/ministries/MinistryScheduleSignup.tsx`) is rendered by `src/app/(public)/ministries/[slug]/page.tsx`. Render-level tests that mount it with these fixtures are still an open cross-lane request to Experience (see `docs/agents/sessions/2026-11-18-cursor-experience-ministry-display.md`).

## Entries
- **change O1 (from #16):** Synthetic ministry schedule/form cases and approved-host validation tests (`tests/fixtures/ministry-display.ts`, `tests/ministry-display.test.ts`).
- **change O2 (from #16):** Launch route and form disposition matrix (`docs/plans/specs/2026-11-18-url-form-disposition.md`) with known owner decisions and outstanding destination gates.
- **QA finding 11 applied (fixtures):** The configured schedule text was `Sundays at 8:30 AM`, which equals a real Express(o) time. It is now `Synthetic fixture: sample schedule`; the rejected case reads `Synthetic fixture: schedule shown, form rejected`. The old test had no `not.toContain` on that text, so a new test asserts the serialized fixtures contain no clock time (regex), no `thrivevineyard` string, and that every non-null schedule says `Synthetic fixture`.
- **decision (ChurchSuite URL):** The configured URL stays on a real ChurchSuite hostname family (`https://example.churchsuite.com/forms/example`). Why: `isApprovedFormUrl` (`src/lib/form-urls.ts`) approves only https hosts under `churchsuite.com` and Google Forms, so an `.example` or invalid-TLD host would fail the allowlist and break the "approved" case. It uses the generic `example` subdomain instead of Thrive's real subdomain, and an `/example` path. The unsafe-URL cases in the test were changed the same way (`http://` and `:8443` variants now use `example.churchsuite.com`); lookalike hosts remain `.example`.
- **QA finding 4 applied (spec):** `/get-connected/` row now says it is published on `main` and `same-path` in docs/04 (no "once the contact hub is published"). The Youth Alpha row cites #24 and the hold-until-200 rule instead of closed PR #8. A note says rows citing `docs/audit/2026-11/integrations.md` resolve after the audit-launch-docs PR (`cursor/audit-launch-docs`, replacing #5) merges. Wording of the Youth Alpha row follows what `content/pages/kids-youth.mdx` actually does after #24 (no Youth Alpha link).
- **QA finding 4 applied (log/PR text):** Assignment reference changed from the development-kickoff file (exists only on PR #14) to `docs/agents/assignments/2026-11-18-batch-2.md`; "renderer not yet integrated" replaced with the integrated statement above; trailing literal `\n` removed. The log file was renamed to the `2026-11-19-cursor-` form.
- **QA finding 5 applied differently:** `docs/04-seo-url-migration-map.md` and `next.config.ts` (an Ops hot file) are NOT edited here. The owner-decided redirects (`/expresso` 301 to `/plan-a-visit#services`; `/prayer` and `/volunteering` 302 to `/get-connected`, 2026-11-07) are tracked in GitHub issue #84 (`[Ops] Implement owner-decided redirects ...`, M3: Launch Readiness).
- **not applied (deliberate):** #16's `.gitignore` (tsbuildinfo ignore already on `main` via #26) and `vitest.config.mts` (identical include widening already on `main` via #27). The `blocker` note about nvm noninteractive shells is dropped as environment-specific.

## Verification
- `scripts/agents/gate.sh`: GATE: PASS (typecheck, tests, lint, production build).
- `vitest run`: 9 files, 88 tests passed (main's 77 plus 11 fixture tests: 3 case tests, 1 synthetic-guard test, 5 unsafe-URL, 2 approved-Google).
