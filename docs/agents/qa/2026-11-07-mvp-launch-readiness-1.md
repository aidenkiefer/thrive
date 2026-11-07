# QA checkpoint: 2026-11-07-mvp-launch-readiness-1

**Assignment:** `docs/agents/assignments/2026-11-07-mvp-launch-readiness-1.md`
**Reviewer:** Codex coordinator with independent reviewer agents. **Owner authorization:** merge ready PRs and prepare the next batch; later instruction: wrap tonight, document, push, and open a PR.
**Checkpoint main:** `ba3fe81818f8fc6182fe1c5f6b4728338010aa06`. This is an integration checkpoint, not launch approval.

## Results

| PR | Lane | Verdict | Evidence |
|---|---|---|---|
| #4 | Audit C1 | MERGED `08f49ac` | Independent live-source comparison across six pages; clean install and full gate on then-current main; CI/Vercel green. |
| #6 | Data D1-D5 | MERGED `ceb39e0` | Two independent reviewers; auth/validation and schema/import checks; clean install and full integrated gate; CI/Vercel green. |
| #7 | Ops-quality Q1-Q3 | MERGED `ba3fe81` | Independent dependency/config/test review; clean install, 33 tests, lint and production build passed on current base; CI/Vercel green. |
| #8 | Experience E1-E6/R1 | HOLD | Content/redirect review passes. Mobile target fix, completion-status correction, browser evidence, rebase and full integrated gate still required. |
| #5 | Audit A2-A5 | REVIEWED, NOT MERGED | All 985 sitemap URLs accounted for; archive mapping corrected; rebased after #6. Rebase and full gate after remaining code merges still required. |

**Final-main gate:** not rerun after the last merge because the owner requested tonight's checkpoint. The identical #7 candidate passed its full gate before squash merge. No final-main PASS is claimed.

**Handoff branch verification:** clean `npm ci` followed by the full shared gate passed on this docs-only branch based on `ba3fe81`: typecheck, 33 tests, lint (0 errors / 12 warnings), and successful production build. Install reported 6 moderate findings; no high/critical findings or build failures.

## Findings worth remembering

- Every one of 10 admin actions checks `requireAdmin()` first; service-role client creation is guarded. Independent validator checks covered DST gaps/overlaps, real calendar dates and publish requirements. No live DB writes were performed.
- June-to-current migration was statically reviewed as guarded and non-destructive; builder documented disposable-Postgres repeatability checks. Import regeneration matches 120 sermons and 80 events; Express(o) Sunday 8:30 AM cafe schedule is owner-provided, not unresolved.
- #7 adds 33 tests against actual TypeScript validators and Python recurrence functions; an independent simulated failing test made the gate exit 1. CI installs Python. Lint is intentionally warning-only this session.
- Dependencies: 18 findings (9 moderate, 7 high, 2 critical) became 6 moderate / 0 high / 0 critical. Remaining minimatch and five TypeScript-ESLint development dependencies propagate one advisory. Scoped same-major PostCSS override passed production build.
- #8 copy and observed donation URL trace to C1; stale Youth Alpha dates are withheld; taxonomy redirects remain temporary and no route shadowing/loops were found. Observed giving URL does not constitute church approval.

## Carry-over and exact resume order

1. Finish #8 in its existing branch; do not reassign its open work. In `src/components/layout/GlobalNav.tsx`, mobile drawer links need 44px targets, not only the toggle. Correct the session claim that E1-E6 are complete: E6 has pending UI without canonical schedule/form fields or a complete field-value handoff. Record page-by-page 375px/keyboard results. Rebase on main after #7; clean `npm ci`, full gate and CI must pass before QA merges. Plain `git diff --check` flags CRLF additions; inspect/normalize line endings as appropriate (the `cr-at-eol` check passed). QA's detached rebase was conflict-free; its install passed, but the gate was intentionally interrupted at typecheck for wrap-up. No integrated PASS is claimed.
2. Rebase #5 after #8; confirm the archive maps to `/events`, preserve current import facts, run the full integrated gate, then merge. Independent review accepted the corrected inventory, integration evidence and checklist.
3. Run the full gate on resulting main. Consolidate these final results and then finalize the draft next assignment. No next-batch builders have been launched.
4. Keep nine imported published sermons without media, re-seed overwriting admin edits, and public speaker/staff contact-column policy explicit. Schema apply, seed, Preview configuration, approved replacement forms, Youth Alpha current schedule/record, giving approval, Search Console/Ads and domain/rollback checks remain owner steps. Do not infer readiness from build success.
5. Public `src/lib/constants/service-times.ts` still marks Express(o) paused; #8 fixes MDX wording but this data-owned constant remains a next-batch correction. Untracked `tsconfig.tsbuildinfo` cleanup belongs in a future allowed `.gitignore` change.

## Next session (for PM)

Draft: `docs/agents/assignments/2026-11-07-mvp-release-candidate-2.md`. Finish #8/#5 first, then refresh the draft from merged facts. Proposed independent lanes: data (ministry contract, admin feedback, shared service schedule); experience (audited connection content, public media states, ministry presentation after contract); ops (runtime smoke checks, URL coverage evidence, tooling cleanup). No live database/launch operations are assigned.

## Workflow friction

- C1 was available while Cursor remained stopped on its earlier dependency wait; resumed the existing conversation through its UI. Explicit dependency handoff should accompany future contract merges.
- Claude finished data without starting its sequential quality lane. Coordinator posted a no-duplicate handoff on #6 and assigned Q1-Q3 to isolated `codex/ops-quality-gates`. Only the assigned quality files and its session log changed.
- QA worked in a separate worktree and preserved the dirty main checkout and other builders. No active worktrees were pruned at the checkpoint. Generated QA build-info is removed before pushing.

## Model usage

Independent agents reviewed source provenance, schema/import and auth/validation separately; quality implementation used its own isolated agent. No runtime or external-service configuration result is inferred from these reviews.
