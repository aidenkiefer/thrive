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
| #8 | Experience E1-E6/R1 | OPEN — QA follow-up | Content/redirect review passes. The rebased branch's gate and Vercel checks pass; mobile drawer-link target sizing and route-by-route 375px/keyboard evidence remain required. E6 remains intentionally limited until canonical schedule/form fields land. |
| #5 | Audit A2-A5 | REVIEWED, NOT MERGED | All 985 sitemap URLs accounted for; archive mapping corrected; rebased after #6. Rebase and full gate after remaining code merges still required. |

**Final-main gate:** not rerun after the last merge because the owner requested tonight's checkpoint. The identical #7 candidate passed its full gate before squash merge. No final-main PASS is claimed.

**Handoff branch verification:** clean `npm ci` followed by the full shared gate passed on this docs-only branch based on `ba3fe81`: typecheck, 33 tests, lint (0 errors / 12 warnings), and successful production build. Install reported 6 moderate findings; no high/critical findings or build failures.

**Post-checkpoint PR evidence:** #8 was rebased and force-with-lease updated after #7. Its GitHub gate completed successfully on 2026-11-07 09:52 UTC, Vercel succeeded, and Supabase Preview was skipped. This does not replace the outstanding browser evidence or make unprovided Youth Alpha schedule/form data ready to publish. #5 remains clean and passing, but is intentionally held for a rebase and full integrated gate after #8 lands.

## Findings worth remembering

- Every one of 10 admin actions checks `requireAdmin()` first; service-role client creation is guarded. Independent validator checks covered DST gaps/overlaps, real calendar dates and publish requirements. No live DB writes were performed.
- June-to-current migration was statically reviewed as guarded and non-destructive; builder documented disposable-Postgres repeatability checks. Import regeneration matches 120 sermons and 80 events; Express(o) Sunday 8:30 AM cafe schedule is owner-provided, not unresolved.
- #7 adds 33 tests against actual TypeScript validators and Python recurrence functions; an independent simulated failing test made the gate exit 1. CI installs Python. Lint is intentionally warning-only this session.
- Dependencies: 18 findings (9 moderate, 7 high, 2 critical) became 6 moderate / 0 high / 0 critical. Remaining minimatch and five TypeScript-ESLint development dependencies propagate one advisory. Scoped same-major PostCSS override passed production build.
- #8 copy and observed donation URL trace to C1; stale Youth Alpha dates are withheld; taxonomy redirects remain temporary and no route shadowing/loops were found. Observed giving URL does not constitute church approval.

## Carry-over and exact resume order

1. Continue #8 in its existing branch; do not reassign its open work. In `src/components/layout/GlobalNav.tsx`, mobile drawer links still need 44px targets, not only the toggle. Record page-by-page 375px/keyboard results. E6 must remain an intentional pending state until C2 supplies canonical schedule/form fields and the owner enters confirmed Youth Alpha values. The branch has a passing CI gate and Vercel check; run the full integrated gate again only after the remaining fixes and after any rebase.
2. Rebase #5 after #8 merges; confirm the archive maps to `/events`, preserve current import facts, run the full integrated gate, then merge. Independent review accepted the corrected inventory, integration evidence and checklist.
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

## Resumed QA — awaiting owner go for #8 (2026-11-07)

This section supersedes the earlier #8 evidence status. No further merge occurred; main remains `ba3fe81`.

**Spec summary:** preserve #8 → #5 merge order, audit-backed copy, authenticated admin boundaries, forms-only ChurchSuite use and canonical ministry records. Keep E6 pending until C2 and owner-confirmed values exist. Final-main gate and final consolidation follow approved merges. #9 requires its own owner go. Its superseded RC2 draft is staged for deletion; the authoritative PM assignment is `docs/agents/assignments/2026-11-07-release-candidate-2.md` (not present on origin/main at this checkpoint).

**#8 reviewed head:** `63688ab6d5953f965dcd0fc49cde6406530918c0`, based on current origin/main. Scope matches experience ownership; global error/not-found paths are justified by E4. No admin/auth, client Supabase, secrets, invented ministry facts or ChurchSuite API additions found. About/Kids prose matches C1; Give prose, list entries and decoded mailto destinations match C1. Redirects remain non-shadowing: permanent Youth Alpha, temporary taxonomy routes.

**Gate:** clean Linux Node 20.20.0 npm ci followed by the full gate passed in isolated `/tmp/thrive-qa-pr8`: typecheck, 33 tests, lint (0 errors / 12 warnings), production build. Install reported 6 moderate findings. Exact-head GitHub gate and Vercel succeeded; Supabase Preview skipped. QA-docs branch also passed clean install/full gate. Initial Windows npm invocation failed with ENOTEMPTY before the gate; selecting Linux Node resolved it. A report-writing command was interrupted after shell expansion errors; no push or merge resulted.

**Browser evidence:** signed-in Chrome, exact-head deployment https://thrive-vineyard-lw7fjci3f-aiden-kiefers-projects.vercel.app, viewport 375 × 812. All eight drawer links measured 44px. Enter opens/focuses the first link; Escape closes/restores menu focus and body scrolling. Skip-link activation focused main#main-content on all seven routes. Home skip-link visibility verified at top 16px. Screenshots reviewed; document width 360px within the 375px viewport.

| Route | Mobile layout / keyboard result | Content limitation |
|---|---|---|
| `/` | PASS: layout, menu, Escape/focus, skip link | Existing Express(o) pause copy/announcement remain for next batch/owner. |
| `/events` | PASS: layout, menu, Escape/focus, skip link | Intentional no-upcoming-events state; no data created. |
| `/sermons` | PASS: layout, menu, Escape/focus, skip link | Existing imported title HTML entities outside scope. |
| `/about` | PASS: layout, menu, Escape/focus, skip link | Church content approval still required. |
| `/give` | PASS: layout, menu, Escape/focus, skip link | Captured donation destination does not establish owner approval. |
| `/kids-youth` | PASS: layout, menu, Escape/focus, skip link | Replacement form intentionally pending. |
| `/ministries/youth-alpha` | PASS for branded 404 shell layout/menu/skip link; ministry content NOT VERIFIED | Canonical record absent in Preview. No schedule/form/pending-panel runtime PASS claimed; owner record + C2 required. |

**Verdict:** #8 code ready for owner merge go with these explicit E6/record and launch-content limitations. #5 held for post-#8 rebase/full gate; final-main gate and final results pending. No live DB writes, seed, configuration changes or launch approval performed.
