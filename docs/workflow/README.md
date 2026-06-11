# Workflow docs

Agent workflow documentation for the Thrive Vineyard website project. Set up from `~/projects/workflow-core` templates on 2026-06-11.

## Last Sync

**Date:** 2026-06-11
**Workflow-core version:** 2026-06-11

**Files created:**
- `workflow.md` — Agent entrypoint + session ritual
- `execution-rules.md` — Runtime rules, budgets, project-specific constraints
- `ticket-template.md` — Bounded job structure
- `skill-map.md` — Layer 1/2/3 skills (Layer 3 populated for this stack)
- `task-type-reference-map.md` — Task types → docs, skills, agent types (Thrive-specific section added)
- `context-flow.md` — Context loading lifecycle for this project
- `context-audit.md` — Quarterly audit guide
- `claude-opt.md` — Claude/Cursor token discipline guide

**No changes needed:** N/A (initial setup)

**Manual review required:** None — all tokens filled from brainstorm session context.

## File index

| File | Purpose |
|---|---|
| `workflow.md` | Start here — session ritual, how to batch tickets |
| `execution-rules.md` | Budgets, constraints, anti-patterns, completion docs |
| `ticket-template.md` | Copy this for every agent task |
| `skill-map.md` | Which skills to invoke (by workflow event or domain) |
| `task-type-reference-map.md` | Which docs + skills to load for each task category |
| `context-flow.md` | How context flows from startup → ticket execution |
| `context-audit.md` | Quarterly review guide |
| `claude-opt.md` | Token efficiency for planning and orchestration |
| `audits/` | Audit result files (quarterly) |
