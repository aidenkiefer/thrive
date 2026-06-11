# Context Flow Through Agent Workflow — Thrive Vineyard Website

**Purpose:** How context documents flow through the complete lifecycle of agent work in this project.

---

## 1. Startup Context (What Agents Receive)

### Core project files

- **`.claude/CLAUDE.md`** — Minimal project memory: mission, how to work, hard constraints, project map
- **`CLAUDE.md`** (root) — Fuller context: full architecture overview, commands, constraints, key doc map

### Workflow documentation (`docs/workflow/`)

- **`workflow.md`** — Entrypoint: specs vs tickets, session ritual, pointers
- **`execution-rules.md`** — Runtime rules: budgets, constraints, what not to do, where things are
- **`ticket-template.md`** — Bounded job structure for every task
- **`skill-map.md`** — Layer 1/2/3 skills; ticket names the pack
- **`task-type-reference-map.md`** — Task type → refs, agent type, domain skills
- **`claude-opt.md`** — Not loaded at startup; planning agents and orchestration prompts read it when writing specs or tickets

### What is NOT loaded at startup

- Full specs (read once per session during hydration)
- Design system / brand guide (loaded only for UI tasks)
- Architecture/integration docs (loaded only for backend/data tasks)
- Full skill registry (only skills named in the ticket are loaded)

---

## 2. Session Hydration Pattern

See `workflow.md` → "Session start ritual" for full steps.

**Summary:** When batching 3–8 related tickets on a sprint:
1. Read the relevant spec(s) **once**
2. Produce a Spec Summary (10–20 lines: constraints, invariants, key quotes)
3. Reuse the summary for all tickets in the batch
4. Do not re-read full specs per ticket

---

## 3. Ticket-Driven Context Loading

Each ticket defines exactly what context the agent loads.

**Load order:**
1. Required References first (from ticket)
2. Small (S) before Large (L)
3. HIGH priority before MEDIUM/LOW
4. Optional References only if relevant or within budget

### Sub-agent routing

| Agent Type | Load these references | Load these skills |
|---|---|---|
| `frontend-agent` | `docs/03-information-architecture.md`, `docs/07-design-system.md` (when created) | `frontend-design`, `react-best-practices`, `tailwind-patterns` |
| `backend-agent` | `docs/05-content-models.md`, `docs/06-integrations.md` | `backend-dev-guidelines` |
| `data-agent` | `docs/05-content-models.md`, `supabase/schema.sql` | `postgres-best-practices`, `backend-dev-guidelines` |
| `seo-agent` | `docs/03-information-architecture.md`, `docs/04-seo-url-migration-map.md` | `seo` |
| `admin-agent` | `docs/05-content-models.md`, `docs/06-integrations.md` | `backend-dev-guidelines`, `react-best-practices` |
| `auth-agent` | `docs/06-integrations.md`, `src/middleware.ts` | `nextjs-supabase-auth`, `backend-dev-guidelines` |
| `debugging-agent` | `docs/03-information-architecture.md`, `docs/06-integrations.md` | `systematic-debugging` |
| `docs-agent` | `docs/INDEX.md`, `docs/workflow/workflow.md` | `writing-plans` |

---

## 4. Reference Document Mapping by Task Type

### UI Component or Page Design

```
Ticket
  ↓
docs/03-information-architecture.md   [routes, page types, homepage sections]
  ↓
docs/07-design-system.md              [when created — colors, typography, tokens]
  ↓
Relevant spec                         [if available]
```

### Backend / API / Admin

```
Ticket
  ↓
docs/05-content-models.md             [Supabase tables, fields, relationships]
  ↓
docs/06-integrations.md               [Supabase client, NextAuth, ChurchSuite]
  ↓
Relevant spec                         [if available]
```

### SEO / WordPress Migration

```
Ticket
  ↓
docs/03-information-architecture.md   [URL structure, route types]
  ↓
docs/04-seo-url-migration-map.md      [when written — old URLs → new URLs]
  ↓
next.config.ts                        [redirect list, if adding redirects]
```

---

## 5. The 3-Layer Skill System

Skills are **lazy-loaded** — the ticket names which skills to invoke. See `skill-map.md`.

### Layer 1: Core workflow process skills

| When | Skill |
|------|-------|
| Starting a multi-step feature | `writing-plans` |
| Clarifying requirements or design | `brainstorming` |
| Implementing with tests | `test-driven-development` |
| Any bug or failure | `systematic-debugging` |
| Before claiming work complete | `verification-before-completion` |

### Layer 2: Workflow management skills

`using-git-worktrees` · `finishing-a-development-branch` · `dispatching-parallel-agents`

### Layer 3: Project domain skills

See `skill-map.md` Layer 3 for the full table. Common picks:

- **Frontend:** `frontend-design`, `react-best-practices`, `nextjs-app-router-patterns`, `tailwind-patterns`, `shadcn`
- **Backend/Data:** `backend-dev-guidelines`, `nextjs-supabase-auth`, `postgres-best-practices`
- **SEO:** `seo`
- **Deployment:** `vercel-deployment`

---

## 6. Context Audit

Run a quarterly context audit using `docs/workflow/context-audit.md`. Log results to `docs/workflow/audits/audit-results-[YYYY-MM].md`.

---

## 7. Best Practices

**For spec writers:** List all reference docs explicitly. Explain why each is needed. Keep specs focused — one feature per spec.

**For ticket writers:** Minimize Allowed Files. Name skills explicitly. Set realistic budgets (8 reads, 6 grep/glob, 12 tool calls).

**For agents:** Read spec once → Spec Summary → tickets. Respect Allowed Files. Stay within budgets. Load only named skills.

**For humans:** Keep CLAUDE.md current. Review docs quarterly. Add new docs to `docs/INDEX.md` when created.
