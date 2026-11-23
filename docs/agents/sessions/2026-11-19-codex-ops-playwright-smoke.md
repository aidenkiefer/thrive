# Session log: `codex/ops-playwright-smoke`

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Lane:** ops · **Tool:** codex · **Started:** 2026-11-19

## Status

#64 current-candidate fixture fixes completed on rebased `c21f05b` main. Two consecutive production-build Chromium suites passed 31/31 on 2026-11-22. No React hydration 418 appeared on Plan a Visit, Kids & Youth, or the redirect landing page after the test waited for the hydrated theme control and network idle. This is a current-browser recheck, not an application-side root-cause fix or signed-in admin test. Full gate and independent review remain before the PR leaves draft.

## Entries

- `14:42` **note** #64: Sized M. Plan covers public routes, admin redirects, legacy redirects, and unknown routes. One model tier reported its usage limit. Account percentage unavailable.
- `14:42` **change** #64: Drafted 31 smoke tests in lane-owned paths. The first run passed 10 HTTP tests. Browser launches failed because WSL libraries were missing.
- `14:42` **note** #64: The second run used temporarily extracted libraries via LD_LIBRARY_PATH. It passed 22 tests and failed nine. All seven unknown-route 404 checks passed.
- `14:42` **note** #64: Six public-route tests and one redirect test counted intentionally blocked resources as console errors. The plan-a-visit and kids-youth routes also reported React hydration error 418. Cause unresolved.
- `14:42` **note** #64: Admin redirects used localhost while the fixture expected 127.0.0.1. The /im-new/ redirect took two hops. Investigate both observations.
- `14:42` **request** #64: Ops to correct the fixture, isolate the hydration errors, and coordinate with Experience if needed. Rerun twice and pass the full gate before push, PR, and independent QA.
- `14:42` **note** #64: No live database access, secret access, or message sends during smoke testing.
- `14:42` **note** PRs #105 (DNS) and #107 (environment matrix) have FIX-FIRST fixes pushed. Both await independent Cursor rechecks.
- `14:42` **note** PRs #110 (readiness), #111 (Preview verification), #112 (redirects), #113 (media), and #115 (hygiene) are QA-ready pending Cursor review. The PR author never merges.
- `14:42` **note** #103: Owner confirmed SMTP save and tracking off. The owner deferred sandbox delivery. Auth template and forms configuration remain open.
- `14:42` **decision** #63: Activation requires #62 to merge and explicit owner approval on the issue.
- `14:51` **change** #64: The fixture filters errors from deliberately blocked resources. Admin redirects must reach the login pathname on the same loopback port, accepting localhost or 127.0.0.1.
- `14:51` **blocker** #64: The isolated rerun hit the 240-second Playwright web server timeout during the build while eight WSL builds ran concurrently. It produced no test results. Hydration remains unconfirmed, and application source was unchanged.
- `14:54` **note** #64: Once build load cleared, the isolated run with temporary browser libraries passed 28 of 31 tests. All seven unknown-route 404 checks and admin redirects passed. Blocked resources and loopback aliases no longer caused failures.
- `14:54` **blocker** #64: /plan-a-visit and /kids-youth reported React hydration error 418. The /im-new/ test reached /plan-a-visit and reported the same error. The second run was deferred because the first failed.
- `14:54` **request** #64: Experience to investigate and fix hydration on both pages. Nested paragraph markup in CtaBand is an unconfirmed hypothesis. Ops made no application source changes.
- `14:54` **request** #64: Ops to investigate the two-hop /im-new/ redirect and rerun smoke twice after the hydration fix. Keep the PR in draft for handoff.
- `14:56` **change** #64: Added an explanatory ESLint suppression limited to the Playwright fixture callback. The default gate passed on Node 20 with 91 tests in 10 files, typecheck, and build. Lint reported zero errors and four existing warnings.
- `--:--` **change** #64: Rebased the existing `codex/ops-playwright-smoke` worktree onto current main `c21f05b`; resolved `.gitignore` and package script conflicts by retaining media catalog setup and Playwright artifacts/scripts. Reconciled `@playwright/test` in package.json with the existing lockfile. No duplicate checkout was created.
- `--:--` **note** #64: First rebased run: 24/31 passed; all seven failures were the obsolete `Page not found` heading expectation. HTTP 404 responses and current `We could not find that page` UI were observed. After the heading correction, a second 24/31 run exposed Chromium's expected console resource error for each 404 document; these were excluded narrowly while other console and page errors still fail.
- `--:--` **change** #64: Public/404/feedback/redirect checks now await the ThemeToggle's post-hydration `aria-pressed` state and network idle before asserting browser errors. The `/im-new/` test asserts the observed chain `/im-new/ (308) -> /im-new (308) -> /plan-a-visit (200)` rather than merely counting hops. The intermediate 308 is Next.js trailing-slash normalization, so no redirect-map change was made.
- `--:--` **note** #64: Two consecutive current-candidate runs passed 31/31 (2.9–3.9 minutes each) against production builds with no browser errors beyond the expected 404 document console messages. Public-data empty states were expected because the smoke server strips external database/transport settings. No live database, DNS, email, or other external service was accessed. Tier T1 implementation; T2 review of hydration/404 evidence.
- `--:--` **change** #64: Independent review caught that the initial 404 console filter could also hide a missing asset. A focused Chromium probe confirmed the 404 console message includes the exact document URL; the fixture now retains source URLs and excludes only that page URL. This changed the final candidate after the two passes, so two further passing suites are required before calling it verified.
- `--:--` **note** #64: First suite on that tightened final candidate passed 31/31 (2.0 minutes). A second consecutive suite and a clean full gate are still required before push. Pausing at owner request; no push or PR status change yet.
