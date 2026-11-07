# Context flow

**Purpose:** What each tool loads automatically, what each role reads on demand, and how artifacts carry context between agents, so nobody re-reads what another agent already summarized.

---

## 1. Loaded automatically (keep these small)

| Tool | Always loaded | Notes |
|---|---|---|
| Claude Code | `CLAUDE.md` → imports `AGENTS.md`; skill descriptions from `.claude/skills` (→ `.agents/skills`) | Skill bodies load only when invoked |
| Codex | `AGENTS.md` (global → repo → nearest subdir); skill descriptions from `.agents/skills` | |
| Cursor | `.cursor/rules/00-core.mdc` (always-apply) → points to `AGENTS.md`; skill descriptions from `.agents/skills` | |

**Budget:** `AGENTS.md` stays under ~60 lines. Everything else is on demand. Add a rule only after an agent repeats a mistake.

## 2. Read on demand, by role

| Role | Reads | Never reads |
|---|---|---|
| PM | roles-and-lanes, latest QA report, PROGRESS status section, roadmap/spec, open PRs | Source code (beyond `ls`) |
| Lane builder | Its lane section of the assignment + ≤3 "read first" refs + files it edits | Other lanes' sections, full specs every turn, PROGRESS.md |
| Scribe | Caller's notes, git log/diff `--stat`, its session log | Source code |
| Senior QA | Assignment header, PR bodies, session logs, then diffs (risk-weighted) | Specs (the assignment already distilled them) |

## 3. Handoff artifacts (the context pipeline)

```
roadmap / specs / QA report (prev)
        │  PM distills
        ▼
assignment  ──►  builder reads ONLY its lane section
        │
        ▼
session log (scribe, per branch)  ──►  PR body (scribe pr)
        │                                   │
        └──────────────► senior QA ◄────────┘
                             │  scribe consolidate
                             ▼
                PROGRESS.md + QA report  ──►  next PM
```

Each artifact is the **compressed** form of the step before it. Downstream agents read the artifact, not the raw source. If a downstream agent has to re-read the source, the upstream artifact was too thin, and that goes in the QA report under "Workflow friction".

## 4. Reference bundles for code tasks

Unchanged from v1. Use `task-type-reference-map.md`. Load required references first, small before large, and optional references only within budget.

## 5. Session boundaries

- One chat per lane per session. Use `/clear` or a new chat when switching lanes or roles.
- PM and QA always start in **fresh** sessions, so their judgment isn't colored by builder context.
- For long lanes, run `/compact` after a ticket checkpoint. The session log is the durable memory, not the chat.
