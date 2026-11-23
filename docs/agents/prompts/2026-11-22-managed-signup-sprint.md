# Three platform launch prompts — 2026-11-22

Assignment: `docs/agents/assignments/2026-11-22-managed-signup-sprint.md` in PR #146 (`codex/pm-managed-services-decisions`). Read current planning-branch AGENTS.md too (`git show origin/codex/pm-managed-services-decisions:AGENTS.md`) until merged. Read the current branch copy; if not merged, `git fetch origin` then `git show origin/codex/pm-managed-services-decisions:docs/agents/assignments/2026-11-22-managed-signup-sprint.md`. Start app worktrees from current main, never the busy main checkout. Do not start another writer if that platform is already editing the assigned files.

## Claude Code — Data / form tooling

```text
Use Thrive's lane-builder skill. Read AGENTS.md, then the current PR #146 assignment docs/agents/assignments/2026-11-22-managed-signup-sprint.md (from the planning branch with git show if not merged), Data section and carry-over/ownership table. Create/resume your own worktree with scripts/agents/worktree.sh new claude data-google-forms-cli; verify branch/pwd before edits.

Start D1/D2 for #151 and #50: reusable group/event templates, safe C1 manifest, offline validator/dry-run planner and documented Forms REST create/read/batchUpdate/publish operator commands. No credentials or owner setup needed for fixture work. Responses stay in Google; no custom input renderer, Apps Script submit bridge, response table/sync or in-app response dashboard for MVP. #148 is post-MVP. Use the existing stack and supported minimal OAuth approach; request any dependency through Ops.

Your existing #147 date picker is carry-over, not a ticket to rebuild. Hold its admin.css/editors until independent review resolves it. #42 is conditional later work. Respect Cursor's #150 theme/admin presentation ownership. Keep all live account/OAuth configuration, actual form create/publish and real data checks for the later owner window. Do not expose secrets or claim mocks as live evidence.

Publish C1 early, gate before push, draft the PR through scribe, and request independent QA; never self-merge. Record completed fixtures, exact commands/PRs and remaining owner steps. Do not change DNS, apply live DB changes, spend money or silently expand scope. Use standard implementation tier; escalate only on evidence per model-routing.md.
```

## Cursor — Public experience

```text
Use Thrive's lane-builder skill. Read AGENTS.md and current PR #146 assignment docs/agents/assignments/2026-11-22-managed-signup-sprint.md (git show from planning branch if not merged), Experience section and carry-over table. Create/resume scripts/agents/worktree.sh new cursor experience-signup-handoff; verify branch/pwd. Use the repo-approved Cursor subscription models; no premium model/billing switch without owner approval.

Start #149: an intentional Thrive-branded signup panel/page using accepted #144 components and an explicit handoff to Google's hosted responder form. Prefer existing canonical event/group detail surfaces. Use the existing approved URL field/allowlist and development fixtures with a clear demo label. No bare iframe, bespoke form fields/submission bridge, per-visitor Google API request, private response link, fake production success or invented ministry destination.

Also perform bounded #47/#61 public mobile/keyboard audits, and investigate current Plan a Visit/Kids hydration if #117 still reproduces it. Respect your #150 dark-mode/transitions carry-over: no duplicate writer or competing changes to global theme/layout/admin presentation. Admin code is Data-owned after accepted merges. Work on independent public-only tasks while shared ownership is held.

Keep Google account configuration and actual hosted signup verification for the later owner window. Gate before push, use scribe for PR/handoff, request independent QA and never merge your own work. Report fixture evidence separately from real browser/provider evidence and return precise cross-lane requests.
```

## Codex — Ops / independent QA

```text
Read AGENTS.md and the current PR #146 assignment docs/agents/assignments/2026-11-22-managed-signup-sprint.md (git show from planning branch if needed), Ops/QA and carry-over sections. Use senior-qa for independent reviews and lane-builder for authored work. Create/resume scripts/agents/worktree.sh new codex ops-sprint-readiness; keep #117 fixes in its existing worktree, never another agent's checkout.

First reconcile/review carry-over: #147 date picker, #150 theme/transitions and docs #143/#145/#146. Verify current head/base, scope, constraints and required gate; record browser gaps and owner transition choice. Do not infer merge go. Do not self-merge a Codex-authored PR; obtain a different reviewer for those.

Continue #117/#64 with current 404 heading, deterministic hydration wait and honest redirect/evidence records; coordinate Cursor's app hydration work. Then prepare #118 export/encryption/keep-ten/failure-staleness tooling and disposable local restore fixtures with fake storage. Package/lock/test config ownership is yours; serialize edits and accept precise dependency requests from Data.

No live Google/Supabase/R2 setup, real mail, real DB writes, paid service or DNS operation before the later owner window. Mocks/local rehearsal are not live acceptance. Gate before push, scribe the PR/evidence, and leave precise completed/parked work plus owner setup steps. Google Forms REST management has no response-submit method; custom fields/Apps Script bridge #148 are post-MVP.
```
