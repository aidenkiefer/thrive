# Assignment: 2026-11-22-managed-signup-sprint

**Goal:** Advance Wednesday Nov 25 MVP readiness through three independent development/QA streams, with owner-required free service setup saved for later tonight.
**Owner-approved scope:** branded Thrive signup page/section handing off to Google's hosted form; official Forms REST management via CLI/templates; custom fields and Apps Script response bridge deferred (#148). Existing media/recovery/data policy decisions remain.
**Execution status:** ready for owner/platform handoff; no agent processes dispatched by this planning pass. Builders open their own worktree and verify current carry-over before editing. No paid service or live-operation authority is implied.
**Baseline:** approved redesign #144 on main `ab66c93` or newer. PR #146 contains this plan; have an independent agent review/merge the planning docs before app branches need their tracked paths. Until then read the exact file with `git show origin/codex/pm-managed-services-decisions:docs/agents/assignments/2026-11-22-managed-signup-sprint.md`; app worktrees still branch from main.
**Inputs:** product-manager/lanes/assignment template; owner answers; current PRs #105/#117/#143/#145/#146/#147/#150; issues #42/#47/#50/#52/#61/#64/#118/#148/#149/#151; official Forms REST methods/limits and Apps Script response/trigger references in the tradeoff record.

## Sequence and bounded cleanup

1. Shape the current scope/contracts and reconcile board next actions; done in this planning update. Do not start a native response platform.
2. Independent QA reviews carry-over in a small batch. Keep #143 historical checkpoint, #145 QA record and #146 latest architecture/assignment as distinct documentation scopes; no bulk closing or deletion. Reconcile any stale “six unanswered” statements as historical. Owner scope answers are in #146/#143 comments.
3. Start the three streams below using fixtures/dry runs. Actual form creation/publishing, storage/backup activation, credentials and owner-only checks wait for the later setup window.
4. Setup later: Google account/API OAuth -> one sandbox form -> hosted submit/private review/standard notification -> actual destinations; then Supabase/R2/backup/mail checks. Record real versus fixture evidence.

## Carry-over / collision map

| PR | Current treatment |
|---|---|
| #147 Claude date picker | Already implemented, not a new build ticket. Codex independently reviews DST/round-trip/browser behavior and gate. Holds admin.css and the affected existing date editors until accepted merge/reconciliation. No merge go is inferred from a passing gate. |
| #150 Cursor dark mode/transitions | Already implemented, not a fresh design assignment. Independent review; owner still chooses lift/zoom/focus and merge go. Holds shared theme/styles/layout/admin presentation paths. Do not run another concurrent visual redesign writer. |
| #117 Codex smoke | Existing fix-first PR; continue rather than duplicate. Rebase/current heading/hydration wait/evidence; two passing suites only after real defects resolved. Different agent reviews the author's fixes. |
| #105 sender runbook | Remains draft until its factual attestation/review requirement is resolved. Later routing answers are recorded; no false attestation. |
| #143/#145/#146 docs | Independent review, preserve evidence boundaries, and merge only with applicable owner go. Codex must not self-merge its PRs. |

## Lane map

| Lane | Tool | Worktree branch | Default tier |
|---|---|---|---|
| Data / form tooling | Claude Code | `claude/data-google-forms-cli` | T1; T2 for auth design only |
| Public experience | Cursor | `cursor/experience-signup-handoff` | T1, existing platform subscription model |
| Ops / independent QA | Codex | `codex/ops-sprint-readiness` | T1; T2 unknown bugs/review |

## Ownership and hot files

| Path | Single owner |
|---|---|
| New `scripts/google-forms/**`, `src/lib/google-forms/**`, `config/google-forms/**` and colocated unit fixtures | Data |
| Public signup panel and narrow event/group CTA integration | Experience |
| `package.json`, lockfile, CI/test configuration, `.github/**`, `scripts/agents/**`, e2e | Ops; one modifying worktree at a time |
| Existing admin date editors, admin.css, DatePicker, admin-date helpers | #147 carry-over hold; return to Data after review/merge |
| Theme preferences, theme.css, global styles/tokens, SiteShell/GlobalNav/AdminShell/login presentation | #150 carry-over hold; no competing writer until reconciled |
| Schema/types/query exports/API/admin feature files | Data; no schema/API expansion is needed for the selected MVP CLI/handoff |
| Assignment | PM |
| PROGRESS/QA reports | Independent senior QA |

Do not import new dependencies outside Ops ownership. Reuse built-in REST/fetch and a supported minimal auth library if needed; do not hand-roll OAuth. If global styling must change, request a one-writer reassignment after #150 rather than editing concurrently.

## Contract C1: CLI result to public signup configuration

No new per-visitor API or custom submit contract is required. Data's first ticket publishes a safe manifest/example containing `entityKey`, `templateKey`, `templateVersion`, `formId`, `responderUrl` and management publication state. Public surfaces consume the existing canonical entity's allowlisted responder URL, entered through the current admin workflow after owner approval. Do not expose editor/review URLs as public responder links, put private credentials in this manifest, or make live DB writes to install it.

Experience starts with a clearly labeled development fixture and pending/unavailable states; live entity-to-form linkage waits for an actual owner-approved manifest. Google owns submissions and external staff review. No response table/sync is introduced.

## Data — Claude Code

Read first: #151, #50, this assignment. Owned paths as above; do not change public components or package/lock directly. Owner setup is not needed for the first two tickets.

**D1 Templates, manifest and dry-run planner — M, T1 (#151, C1)**
- Task: define a bounded reusable group/event template format, validate questions/metadata, generate a safe operation plan/manifest contract; publish C1 example early.
- Files: `config/google-forms/**`, `src/lib/google-forms/**`, unit fixtures, `scripts/google-forms/**`.
- Done: offline validation and dry run require no credentials/network writes; missing required inputs fail clearly; no invented ministry facts or public response/edit links. Keep forms/IDs reconciled rather than duplicate-create on rerun.

**D2 REST management adapter and operator commands — M, T1 (#151)**
- Task: implement create/read/batch-update/publish through documented methods, a supported private OAuth path and explicit operator confirmation. Standard API quotas/cost checks are a later live setup gate.
- Done: fixture tests verify operation sequence, failure/429 behavior, plan versus execute, redacted output and duplicate reconciliation; live execution fails clearly when unconfigured. No response submission endpoint, Apps Script bridge, custom admin builder, watch/PubSub setup or response download is needed.

**D3 Conditional follow-on — M, T1 (#42)**
- Only after #147/shared admin ownership resolves, scope missing series/speaker editors using existing attribution and approved admin design. Reuse the real DatePicker if accepted; do not duplicate it. This ticket is parked if carry-over remains unresolved; D1/D2 must not wait for it.

## Experience — Cursor

Read first: #149, #47/#61, this assignment. Reuse accepted #144 styles and respect #150's active file ownership. If the existing Cursor session still owns #150, hand off/finish that work before opening another writer for the same paths.

**E1 Branded hosted-form handoff — M, T1 (#149)**
- Task: reusable intentional signup panel on existing canonical event/group pages: approved context, clear Google signup CTA, help/provider label and pending/unavailable state.
- Done: existing allowlist and canonical responder URL used; accessible/mobile branded presentation; no bare iframe, custom fields, proxy submission, invented form URL or per-visitor authenticated Forms call. Fixture preview clearly marked; actual linked journey remains a later setup check.

**E2 Release UI audit / bounded fixes — M, T1 (#47/#61)**
- Task: inspect populated/empty mobile and keyboard states and code-held photo dependencies; fix narrow public-only defects without touching #150 hot files.
- Done: route/width/focus matrix, bounded fixes and explicit Data/Ops requests. Do not recreate approved design or claim actual provider setup from a fixture.

**E3 Hydration investigation — M, T2 only if needed (#64/#117 dependency)**
- Reproduce current-main Plan a Visit/Kids hydration behavior and provide a focused fix/evidence if present. Never hide 404 failures with a route-group loading boundary. Coordinate shared component changes after carry-over ownership clears.

## Ops / QA — Codex

Read first: #117 latest QA verdict, #147, #118 and this assignment. Review/apply the senior-QA workflow for others' PRs; use lane-builder for authored changes. Separate reviewer and author verdicts.

**O1 Independent carry-over review — M, T2 (#147/#150/docs)**
- Review head/base/diff/gate, date/DST round trips, theme hydration/reduced motion/404 implications, documented browser gaps and owner transition choice. Queue precise findings and required owner actions; no self-merge or inferred live runtime PASS. Prioritize #146 instruction correctness before app builders rely on it.

**O2 Smoke carry-over — M, T1 (#117/#64)**
- Continue the existing smoke PR in its own worktree; fix assertions/wait/evidence, coordinate E3, rebase after accepted merges. Done: current candidate results and two passing suites when defects permit; independent review of authored fixes. Package/config writes are serialized with this lane's other work.

**O3 Backup tooling / local rehearsal — M, T1 (#118)**
- Prepare weekly export/encryption/upload adapter/verified keep-ten retention and failure/staleness design with local fake storage and disposable local restore fixtures. Do not create cloud accounts, enable billing, read personal data, schedule a live job or use a real DB connection before the later owner setup window.
- Done: fixture failure paths preserve recoverability; secrets/log redaction; exact pending owner inputs and deployment/runbook steps. Actual R2 backup/restore acceptance remains open until performed.

## Review / merge order

Independent documentation review -> owner-go merges of carry-over (not assumed) -> C1 tooling contract -> isolated CLI and public handoff PRs -> fixture tests/release fixes -> later real service validation -> integrated candidate QA. No builder self-merges. Re-gate each rebased integrated result. Update board acceptance with evidence, not green build alone.

## Later owner-assisted free setup checklist

- Google: correct church account; project/API enablement and supported OAuth consent/scopes; private credentials. CLI dry run reviewed, one sandbox form created/published/read back, respondent URL recorded, hosted response/private review/standard notification checked. No payment/billing/quota upgrade accepted automatically.
- Site: approved entity-to-responder links, real ministry/team/holiday/giving/newsletter facts, production feedback/prayer routing and second-account/limiter checks. No DB re-seed.
- Storage/recovery: Supabase image bucket/permissions and dashboard workflow; R2 private bucket/credential and encryption-key custody, real backup, restore proof and missed-backup alert. Check actual quotas/cost before activation.
- Remaining cutover DNS/rollback is later and separately approved. Browser/Computer control is authorized for free setup but login/2FA/owner-only consent may still require the owner; do not seek secrets in chat.

## Handoff prompts

Use [the three launch prompts](../prompts/2026-11-22-managed-signup-sprint.md). This is a staged plan; do not claim the three external platforms were started by preparing these files. Start independent offline work first, park manual setup for the owner window, and finish with a precise PR/verification/blocker handoff.
