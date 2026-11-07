# Ticket template

Tickets are **budgeted jobs**. In session mode they live inline in a lane assignment (compact form). Write a standalone file in `docs/plans/tickets/` only for solo-mode work or for an M ticket whose context won't fit inline.

---

## Compact form (inline in an assignment)

```markdown
**D1 · <name>** · S · T1 · [contract C1]
- Task: <one sentence>
- Files: <paths; must be inside the lane's owned paths>
- Done when: <verifiable statements>
- Skills: <0–2>
```

## Full form (standalone file: `docs/plans/tickets/NN-short-name.md`)

```markdown
# Ticket: NN-short-name

**Lane:** data | experience | ops · **Size:** S | M · **Tier:** T0–T3 · **Branch:** <tool>/<lane>-<slug>

## Task
One sentence describing the change.

## Allowed files (edit ONLY these)
- exact paths or globs

If the change needs another file: in solo mode, stop and ask. In session mode, file a cross-lane request and continue.

## Read-only references
- Required (1–2 max): <path> (why)
- Optional: <path> (only if needed)
- Example to imitate: <path>

## Skill pack
- Core (0–2): from skill-map.md Layer 1
- Domain (0–2): from skill-map.md Layer 3 / task-type-reference-map.md

## Done when
- Verifiable statements about the code
- `scripts/agents/gate.sh` passes
- Logged via `scribe checkpoint` (session mode) or a PROGRESS.md entry by QA (solo mode)
```

---

## Notes

- **Shorter ticket = cheaper run.** Don't repeat rules from AGENTS.md or execution-rules.md.
- **Size sets the budget** (execution-rules.md §3). L tickets are not allowed; split them.
- **Tier is a recommendation**, not a cage. Escalate once on evidence and log why (model-routing.md §3).
- **Agent type** (`frontend-agent`, `data-agent`, …) from `task-type-reference-map.md` is still a valid shorthand for a reference bundle. Each agent type maps to a lane (see that file's routing table).
