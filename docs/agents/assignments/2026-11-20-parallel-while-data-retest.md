# Assignment: 2026-11-20-parallel-while-data-retest

**Session goal:** Finish the owner checks that gate the Data stack, and give Claude and Codex non-overlapping work that does not touch that retest.
**Inputs read:** `docs/workflow/roles-and-lanes.md`; GitHub issues #31, #35, #40, #41, #43, #69, #72, #101, #102, #103; open PRs #15, #18, #23, #90, #95, #96, #114, #119, #120, #122, #123, #124, #128; project Thrive Website; 2026-11-19 Cursor session.
**Owner approval:** approved 2026-11-20 (publish the handoff so the other agents can start).

## What already happened (2026-11-19 evening)

Recorded on [#41](https://github.com/aidenkiefer/thrive/issues/41#issuecomment-7046764689). Do not re-do these:

- Privilege query passed on the live project. Staff and limiter tables stay closed to anonymous and signed-in visitors.
- `admin_staff_accounts` and `shared_rate_limit` were applied twice. Publishing migrations were not applied.
- Sequential limiter check passed: limit 3, 3 allowed, 47 denied. The 50-at-once HTTP check was not run.
- One staff code sign-in reached the admin dashboard on the `claude/data-shared-limiter` Preview. A reused code was rejected.
- `updates.thrivevineyard.com` is verified in Resend. The first feedback submit failed because the Preview sending key was limited to the apex domain. The owner replaced that key, redeployed, and at 11:53 CT a sandbox message arrived from `website@updates.thrivevineyard.com`.

Merged that night and marked Done on the board: #106, #107, #108, #109, #110, #115, #116, #125, #126, #127. #128 is docs-only, green, and still open. #124 is green and waiting. Neither is this session's build work.

## This session's owner checks (Cursor, already in progress)

These stay in the existing Cursor chat. No new worktree. No commits on the Data branches.

1. Done 11:53 CT. One sandbox feedback message arrived from `website@updates.thrivevineyard.com`.
2. Confirm `/feedback` keeps the typed text when the send is forced to 503.
3. Confirm Sign out, then `/admin`, returns to the login page.
4. Leave the 50-at-once HTTP check and the disabled/rebound cases for a private terminal and a second staff account. Do not disable the only staff row.

After those three, stop. A later PM/QA pass merges. Order when the owner says go: #128 (docs, any time), then the Data stack as a unit (#15, #18, #23, #95, #114, #123, #119, then #90, #96, #120, #122), then ready ops/experience carry-over (#111, #112, #113, #124). #117 and #105 stay draft.

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| data | claude | `claude/data-reserved-slugs` (existing) | `../thrive-worktrees/claude-data-reserved-slugs` | T1 |
| experience | — | — | — | — |
| ops | codex | `codex/ops-cutover-runbook` | `../thrive-worktrees/codex-ops-cutover-runbook` | T0 |

Experience is empty. #124 is carry-over. The photo-swap worktree has uncommitted local edits and must not be cleaned up (see Owner decisions).

## Hot-file owners (this session)

| File | Owner lane |
|---|---|
| `package.json`, `package-lock.json` | nobody (do not edit) |
| `supabase/schema.sql`, `src/lib/supabase/types.ts` | nobody (do not edit) |
| `next.config.ts` | nobody (do not edit) |
| `src/app/layout.tsx`, `tailwind.config.ts`, `src/components/layout/GlobalNav.tsx` | nobody (do not edit) |
| `src/lib/reserved-slugs.ts` | data |

## Contracts

None.

## Merge order

No merge in this assignment. Claude's slug fix stays on the stacked branch. Codex opens a docs PR and leaves it for the later QA pass.

---

## Lane: data, reserved slug for Thrive Flames

**Tool:** claude · **Branch:** `claude/data-reserved-slugs` · **Default tier:** T1
**Owned paths:** `src/lib/reserved-slugs.ts`, `src/lib/reserved-slugs.test.ts`, this branch's session log
**Read first (≤3):** `src/lib/reserved-slugs.ts`, `src/lib/reserved-slugs.test.ts`, the 2026-11-20 comment on PR #120
**Out of scope:** every other Data branch, rebasing, Vercel env, the live database, Preview redeploys, `src/app/[slug]/page.tsx` (experience request, after this PR merges)

### Tickets

**D1 · Reserve thrive-flames** · S · T1
- Task: Add `thrive-flames` to `RESERVED_SLUGS` on the existing branch. It is a public route on `main` and missing from the list, so the test fails once this branch sits on current `main`.
- Files: `src/lib/reserved-slugs.ts`, `src/lib/reserved-slugs.test.ts` only if an assertion must name the new slug
- Done when: the list contains `thrive-flames`, the reserved-slug test passes, and the commit is pushed to the existing PR #120. The branch is not rebased.

**Lane done when:** D1 is pushed to #120, or parked with the failing command in the session log.

---

## Lane: ops, cutover and monitoring drafts

**Tool:** codex · **Branch:** `codex/ops-cutover-runbook` · **Default tier:** T0
**Owned paths:** `docs/ops/**`, this branch's session log
**Read first (≤3):** issue #69, issue #72, `docs/04-seo-url-migration-map.md` (headings only)
**Out of scope:** `next.config.ts`, `package.json`, the Data stack, Vercel env values, DNS changes at the registrar, #105 (leave that draft alone)

### Tickets

**O1 · Cutover runbook** · M · T0 · #69
- Task: Draft the cutover runbook with an explicit TBD table for DNS, TTLs, rollback, WordPress retirement, and Search Console. Do not invent DNS values, account names, or dates.
- Files: `docs/ops/cutover-runbook.md` (create), issue #69 comment with the path
- Done when: every unknown is a TBD row, and the doc states what the owner must fill before cutover.

**O2 · Monitoring proposal** · S · T0 · #72
- Task: Draft provider options with public pricing notes and what the owner still has to choose (account, alert recipient). Do not create an account or add a dependency.
- Files: `docs/ops/monitoring-proposal.md` (create)
- Done when: the proposal names options and the owner decision, and package.json is untouched.

**Lane done when:** both docs are in one PR, gate passes, and the PR is left open.

---

## QA focus

- Do not merge #15, #18, or #23 until the three Cursor checks above are recorded on #41.
- #120 still cannot merge before the stack, even after `thrive-flames` is added.
- No live database writes and no second feedback send beyond the one retest.

## Owner decisions needed

- Say go before any merge, including docs-only #128.
- The 50-at-once limiter check uses the service-role key in a private terminal. Do not paste it into chat.
- A second staff account is required before disabled or rebound login tests. Do not disable the current account.
- `cursor/experience-photo-swap` has uncommitted local edits (nav mark, pastor portraits, About gallery spacing and hover, `public/images/brand/`). They are not on a PR. Do not delete that worktree. The next experience session commits them onto a new branch from `origin/main`.
