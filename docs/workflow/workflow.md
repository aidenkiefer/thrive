# Agent workflow: entrypoint

**Read this first.** It describes how three coding agents (Claude Code, Cursor, Codex) work on this repo at the same time without colliding, and how their work gets reviewed and merged.

> Version 2 (2026-11-07). This replaces the single-agent "one ticket per run" model with a **multi-agent session model**. The ticket system still exists. Tickets now live inside lane assignments.

---

## The operating model in one picture

```
           ┌─────────────────────────────────────────────┐
 PLAN      │ product-manager  (one fresh session, heavy)  │
           │  reads status → writes ONE assignment file   │
           │  with 3 lane assignments + merge order       │
           └───────────────┬─────────────────────────────┘
                           │ assignment committed to main
        ┌──────────────────┼──────────────────┐
 BUILD  ▼                  ▼                  ▼
  claude/<slug>      cursor/<slug>      codex/<slug>      ← one worktree + branch each
  lane-builder       lane-builder       lane-builder      ← optional subagents inside lane
     │ scribe            │ scribe           │ scribe      ← cheap session logs, no conflicts
     ▼                   ▼                  ▼
   PR (gate ✔)        PR (gate ✔)        PR (gate ✔)
        └──────────────────┼──────────────────┘
 MERGE                     ▼
           ┌─────────────────────────────────────────────┐
           │ senior-qa (fresh session, heavy)             │
           │  reviews in merge order → human "go" →       │
           │  squash-merge → PROGRESS.md → QA report      │
           └───────────────┬─────────────────────────────┘
                           └──► QA report "next session" feeds the next PLAN
```

## The four rules that make it work

1. **Lanes don't overlap.** Each lane owns a set of paths. No two agents edit the same file in one session. Shared "hot files" have exactly one owner per session. See [roles-and-lanes.md](./roles-and-lanes.md).
2. **One agent = one worktree = one branch, named by tool.** `claude/*`, `cursor/*`, `codex/*`. See [git-and-worktrees.md](./git-and-worktrees.md).
3. **Communication goes through files, never shared edits.** Assignments, per-branch session logs, PR bodies, and QA reports are each owned by one writer. Nothing like `PROGRESS.md` is edited by three agents at once.
4. **Right model for the job.** Heavy models plan, review, and debug. Standard models implement. Fast models do docs and grunt work. See [model-routing.md](./model-routing.md).

---

## Session lifecycle

| Phase | Who | Skill | Output | Model tier |
|---|---|---|---|---|
| 1. Plan | Any one tool, fresh session | `product-manager` | `docs/agents/assignments/<date>-<name>.md` | Heavy |
| 2. Set up | Human (or each agent) | `scripts/agents/worktree.sh new <tool> <slug>` | 3 worktrees on `<tool>/<slug>` branches | — |
| 3. Build | Claude, Cursor, Codex in parallel | `lane-builder` (+ `scribe`) | Commits, session log, PR | Standard (escalate per ticket) |
| 4. Review + merge | One tool, fresh session | `senior-qa` (+ `scribe consolidate`) | Merged PRs, `PROGRESS.md`, `docs/agents/qa/<date>-<name>.md` | Heavy |
| 5. Clean up | QA or human | `scripts/agents/worktree.sh prune` | Removed worktrees and branches | — |

**Human checkpoints (you):** approve the plan (end of phase 1), relay blockers between agents if needed (phase 3), and say "go" before anything merges to `main`, because `main` is production (phase 4).

### Launch prompts (copy-paste)

```text
# Phase 1, in any tool:
Use the product-manager skill. Goal for this session: <one sentence, or "pick from the roadmap">.

# Phase 3, in each tool, from inside its worktree:
Use the lane-builder skill. Assignment: docs/agents/assignments/<file>.md. Lane: <data|experience|ops>.

# Phase 4, in a fresh session (main checkout):
Use the senior-qa skill. Assignment: docs/agents/assignments/<file>.md.
```

The product-manager prints these prompts, already filled in, at the end of phase 1.

---

## When NOT to use the full model

- **Tiny fix (one file, under 15 minutes):** one agent, one branch `<tool>/fix-<slug>`, gate, PR. Skip the PM and QA ceremony. QA reviews it with the next batch, or you merge it yourself after CI is green.
- **Only one or two lanes have real work:** run only those lanes. Never invent work to fill a lane.
- **Exploration or brainstorming:** use a plain session (`brainstorming` skill). No worktree needed until code changes start.

---

## Where everything lives

| What | Path |
|---|---|
| Agent skills (cross-tool) | `.agents/skills/` (Claude Code reads it through the `.claude/skills` symlink) |
| Assignments, session logs, QA reports | `docs/agents/` |
| Specs / tickets / progress | `docs/plans/specs/`, `docs/plans/tickets/`, `docs/plans/PROGRESS.md` |
| Runtime rules + constraints | [execution-rules.md](./execution-rules.md) |
| Lanes + ownership map | [roles-and-lanes.md](./roles-and-lanes.md) |
| Branches, worktrees, PRs, merging | [git-and-worktrees.md](./git-and-worktrees.md) |
| Model + effort selection | [model-routing.md](./model-routing.md) |
| CI, quality gate, automations | [devops-automation.md](./devops-automation.md) |
| Reusing this on another project | [portability.md](./portability.md) |
| Ticket shape | [ticket-template.md](./ticket-template.md) |
| Skills by workflow event / domain | [skill-map.md](./skill-map.md), [task-type-reference-map.md](./task-type-reference-map.md) |
| Token discipline | [claude-opt.md](./claude-opt.md) |
| Research behind these choices | [research-sources.md](./research-sources.md) |
