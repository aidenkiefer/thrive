# Workflow docs (v2: multi-agent)

How Claude Code, Cursor, and Codex work on this repo in parallel: a PM plans the session, three lane builders work in isolated worktrees, a scribe documents cheaply, and a senior QA engineer reviews and merges.

**Start here:** [workflow.md](./workflow.md)

## Version

| Version | Date | Change |
|---|---|---|
| v2 | 2026-11-07 | Multi-agent session model: lanes, tool-prefixed worktrees, cross-tool skills (`.agents/skills`), model routing, quality gate + CI, QA merge policy |
| v1 | 2026-06-11 | Single-agent ticket workflow from `~/projects/workflow-core` templates |

## File index

| File | Purpose |
|---|---|
| `workflow.md` | **Entrypoint.** Operating model, session lifecycle, launch prompts |
| `roles-and-lanes.md` | Roles, lane ownership map, hot files, contracts, tool ↔ lane fit |
| `git-and-worktrees.md` | Branch and worktree naming, setup script, commits, PRs, merge policy |
| `model-routing.md` | Model tiers T0–T3 per tool, switching rules, defaults by activity |
| `devops-automation.md` | Verification policy, quality gate, CI, agent config map, automations, hooks |
| `execution-rules.md` | Runtime rules, budgets by size, project constraints, git hygiene |
| `ticket-template.md` | Compact (inline) and full ticket forms |
| `skill-map.md` | Skills by workflow event (Layer 0 agent skills, Layers 1–3) |
| `task-type-reference-map.md` | Task types → docs, skills, agent types, lanes |
| `context-flow.md` | What each tool loads at startup, and how handoff artifacts flow |
| `claude-opt.md` | Token discipline (all tools) |
| `context-audit.md` | Quarterly review guide |
| `portability.md` | Reusing this on the next project; upstreaming to workflow-core |
| `research-sources.md` | Sources behind v2 decisions |
| `audits/` | Audit results |

**Related:** skills in `.agents/skills/`, session records in `docs/agents/`, scripts in `scripts/agents/`.
