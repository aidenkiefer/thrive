# Agent workflow — Thrive Vineyard Website

**Use this as the entrypoint for agentic work in this repo.**

---

## How we work

Bounded, cost-efficient: minimal persistent context, specs read once per session, every task is a ticket with Allowed Files and budgets.

- **Execution rules:** [execution-rules.md](./execution-rules.md) — session strategy, budgets, constraints, where things are
- **Ticket template:** [ticket-template.md](./ticket-template.md) — use for every agent task
- **Skill map:** [skill-map.md](./skill-map.md) — workflow process skills (Layer 1); ticket names the pack
- **Task-type reference map:** [task-type-reference-map.md](./task-type-reference-map.md) — which docs and domain skills to load for each code task type
- **Context flow:** [context-flow.md](./context-flow.md) — how context flows through this project's workflow lifecycle
- **Context audit:** [context-audit.md](./context-audit.md) — quarterly guide for keeping reference docs accurate
- **Claude optimization:** [claude-opt.md](./claude-opt.md) — token-efficient prompting, session hygiene, output contracts. Canonical copy: `~/projects/workflow-core/claude-opt.md`

**Specs** live in `docs/plans/specs/` (read-only; summarize once per session). **Tickets** live in `docs/plans/tickets/` (one bounded task per run). Do not re-attach full specs every turn; use a Spec Summary when batching 3–8 tickets.

Human-only philosophy: `docs/workflow/philosophy.md` (do not load into agent context).

---

## Session start ritual

Use when batching 3–8 related tickets that share the same spec(s). Skip for single one-off tasks.

### When to use

- You are working through a sprint or multi-ticket chunk of related work
- Multiple tickets reference the same spec or design doc
- You want to amortize the cost of reading a large spec across several tickets

### When to skip

- Single one-off task with clear Allowed Files and no spec context needed
- The ticket provides its own 1–2 read-only references
- A short manual context note at the start of the message covers it

---

### Steps

**1. Project memory is already loaded.**
`.claude/CLAUDE.md` (or root `CLAUDE.md`) is already in context. Do not load more global instructions.

**2. Read the spec(s) for the next chunk of work — once.**
Typically from `docs/plans/specs/` or the current sprint doc in `docs/plans/`.
Read each spec **once**. Do not re-read it for every ticket.

**3. Produce a Spec Summary (10–20 lines).**
Extract:
- Constraints and invariants (data access rules, immutable entities, service-layer rules)
- Success metrics or definition of done for the chunk
- Key reference quotes — snippets to re-anchor on if needed

**4. Confirm scope.**
- Current sprint or phase
- Allowed Files defaults and budget defaults: max 8 file reads, 6 grep/glob, 12 tool calls

**5. Run tickets from the summary.**
- Use Spec Summary + each ticket (Task, Allowed Files, Read-only references, Budget, Done criteria)
- Do not re-attach full spec(s) to every message
- If a ticket needs a detail not in the summary, re-anchor to one small quote rather than reloading the whole doc

**6. At context boundary.**
- Use /clear (or new thread) when switching to unrelated work
- Optionally save a short session summary (decisions, modified files) to `docs/plans/summaries/`
