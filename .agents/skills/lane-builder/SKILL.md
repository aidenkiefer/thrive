---
name: lane-builder
description: Use when executing a lane assignment from docs/agents/assignments as one of several parallel agents (Claude Code, Cursor, or Codex), when working in an agent worktree on a claude/*, cursor/*, or codex/* branch, or when preparing a lane's pull request for senior QA.
---

# Lane builder: execute one lane, cleanly

You are one of up to three agents working in parallel. You own **one lane** of one assignment. Your job: finish its tickets inside its owned paths, leave a trail QA can trust, and open one PR. Other agents edit other files at the same moment, so the boundaries are what keep everyone's work mergeable.

**Violating the lane boundary is never "a small exception."** One out-of-lane edit can create a merge conflict that costs QA more than the whole ticket saved.

## 1. Start (before any edit)

1. `git branch --show-current && pwd`. The branch must start with **your** tool prefix (`claude/`, `cursor/`, `codex/`), and the path must be under `../thrive-worktrees/`. If not, stop. Create the worktree (`scripts/agents/worktree.sh new <tool> <lane>-<slug>`) or ask the owner. **Never work in the main checkout.**
2. Read **only your lane's section** of the assignment, plus its "Read first" refs. Also read the header tables (hot-file owners, contracts, merge order).
3. Start the session log: `scribe init` with assignment path, lane, and tool.
4. Set your model tier for the first ticket (`docs/workflow/model-routing.md`).

## 2. Ticket loop

For each ticket in order:

1. **Tier check.** Switch model or effort if this ticket's tier differs from the current one.
2. **Implement** inside owned paths only. Before editing, ask yourself whether the path is in your lane's owned paths. If not, it's a cross-lane request, not an edit.
3. **Spot-check cheaply** when useful: `scripts/agents/gate.sh --quick` (typecheck + lint). Don't run full builds after every edit.
4. **Commit** atomically: `git add <explicit paths>` then `git commit -m "<type>(<lane>): <summary>"`. Push at least once per ticket (`git push -u origin HEAD`). Pushing protects work from worktree cleanup.
5. **Checkpoint:** `scribe checkpoint <ticket-id> <tier/model> <one-line outcome>`.

Contract tickets come first. Open their PR right away with a `[contract]` title prefix (see `docs/workflow/roles-and-lanes.md` §4), then continue on the same branch or a second `<tool>/<lane>-contract-<slug>` branch.

## 3. When something gets in the way

| Situation | Do |
|---|---|
| Need a change in another lane's file | `scribe log request: <lane> needs <exact change> because <why>`, then continue with other work |
| Need a hot file you don't own | Same as above. The assignment names the owner |
| Blocked on an owner decision | `scribe log blocker: <question> (recommended: <answer>)`. **Park** the ticket and move to the next one. Don't stall the whole lane |
| Hard constraint at risk (auth, invented data, secrets, redirects) | Stop that ticket and ask the owner now |
| Ticket is bigger than its size | Do the part that stands alone, log the rest as follow-up |
| Consumer of a contract that hasn't landed | Work on other tickets. When it lands: `git fetch && git rebase origin/main` |

## 4. Subagents (optional)

Use them to protect your context, not to widen your scope:

- **Read-only exploration** (T0/T1): "find where X is used, return paths + 3–6 bullets."
- **Parallel independent tickets inside your lane:** only when their files don't overlap, and each in its own isolated worktree (Claude: `isolation: worktree`). You merge their results into your branch.
- Never give a subagent paths outside your lane. Never let a heavy-model subagent do T0 work.

## 5. Finish

1. Run the full gate: `scripts/agents/gate.sh`. It must end in `GATE: PASS`. Fix failures. If you can't fix one inside your lane, log it as a blocker and open the PR as **draft**.
2. Check the "Files changed" list the gate prints. Every path must be in your lane or be your own session log.
3. `scribe pr`. It writes the PR body file and returns its path.
4. `gh pr create --base main --title "[<lane>] <summary>" --body-file <path>`. Use `--draft` if any lane done-criterion is unmet.
5. `scribe log note: session end, <status line>`, commit the session log, and push.
6. Stop. **Do not merge.** Senior QA merges.

## Red flags: stop and re-check

- `git status` shows a path outside your lane
- You're editing a "quick fix" in someone else's file
- You're on the main checkout or on another tool's branch
- You're about to `git add -A` or `git push --force`
- You've run the full build three times this session "just to check"
- You're writing PROGRESS.md (QA owns it) or reformatting files you didn't need to touch
