# Thrive Vineyard — Doc Index

All documentation for the Thrive Vineyard website project.

**Current phase:** November 2026 MVP launch readiness. See [08-mvp-status-roadmap.md](./08-mvp-status-roadmap.md), [09-implementation-handoff.md](./09-implementation-handoff.md), and [10-launch-checklist.md](./10-launch-checklist.md).

---

## Architecture & Design

| Doc | Description | Size |
|---|---|---|
| `floorplan.md` (root) | Vision, architectural principle, canonical entity model, AI agent rules | L |
| `docs/00-project-brief.md` | Goals, constraints, tech stack rationale, out-of-scope | M |
| `docs/03-information-architecture.md` | Full URL tree, page type classification, homepage sections, admin routes | M |
| `docs/05-content-models.md` | All Supabase tables, fields, relationships, universal fields, reserved slugs | L |
| `docs/06-integrations.md` | Supabase, NextAuth, ChurchSuite, Vercel, Google Ads, future integrations | M |
| `supabase/schema.sql` | Full Postgres schema (tables, indexes, RLS policies) | L |

**Site evidence and migration planning:**
- [audit/2026-11/README.md](./audit/2026-11/README.md) — November 7 live page, URL, and integration audit
- [10-launch-checklist.md](./10-launch-checklist.md) — owner release checks for November 13

**June 2026 references (historical):**
- [01-current-site-audit.md](./01-current-site-audit.md) — WordPress crawl: URLs, content, forms, integrations
- [02-content-inventory.md](./02-content-inventory.md) — Parsed events/sermons export → Supabase mapping
- [04-seo-url-migration-map.md](./04-seo-url-migration-map.md) — Draft redirect map (needs Search Console to finalize)
- [07-design-system.md](./07-design-system.md) — Brand style subaudit + revamp plan (colors, type, components)

**Pending (not yet written):**
- `docs/08-ai-agent-rules.md` — AI agent rules (summarized version of `floorplan.md` section)

---

## Workflow

| Doc | Description | Size |
|---|---|---|
| `docs/workflow/workflow.md` | **Entrypoint (v2 multi-agent)**: operating model, session lifecycle, launch prompts | S |
| `docs/workflow/roles-and-lanes.md` | Roles, lane ownership map, hot files, contracts, tool ↔ lane fit | S |
| `docs/workflow/git-and-worktrees.md` | Branch/worktree naming, commits, PRs, merge policy | S |
| `docs/workflow/model-routing.md` | Model tiers per tool + switching rules | S |
| `docs/workflow/devops-automation.md` | Verification policy, quality gate, CI, automations, hooks | S |
| `docs/workflow/portability.md` | Reusing the workflow on other projects | S |
| `docs/workflow/research-sources.md` | Sources behind workflow v2 | S |
| `docs/workflow/execution-rules.md` | Runtime rules, budgets, project-specific constraints, completion docs | M |
| `docs/workflow/ticket-template.md` | Bounded job structure for every agent task | S |
| `docs/workflow/skill-map.md` | Layer 1/2/3 skills — when to invoke each | M |
| `docs/workflow/task-type-reference-map.md` | Task type → reference docs, agent type, domain skills | L |
| `docs/workflow/context-flow.md` | How context flows from startup through ticket execution | M |
| `docs/workflow/context-audit.md` | Quarterly audit guide for keeping reference docs accurate | M |
| `docs/workflow/claude-opt.md` | Token efficiency, session hygiene, output contracts | M |

---

## Plans & Progress

| Doc | Description |
|---|---|
| `docs/plans/PROGRESS.md` | Milestone log, patch history, backlog (written by senior QA only) |
| `docs/agents/` | Multi-agent records: assignments (PM), session logs (scribe), QA reports |
| `docs/plans/specs/` | Feature specs — **active:** `sprint-01-demo-draft.md` |
| `docs/plans/tickets/` | Bounded agent tasks — **10 tickets** for Sprint 01 |
| `docs/plans/summaries/` | Sprint and feature completion summaries |

---

## Session Notes

| Doc | Description |
|---|---|
| `docs/superpowers/specs/2026-06-09-thrive-architecture-planning-session.md` | Full brainstorm session — all decisions, answered questions |

---

## Key Code Locations

| What | Where |
|---|---|
| Root layout | `src/app/layout.tsx` |
| Homepage | `src/app/page.tsx` |
| Public routes | `src/app/(public)/` |
| Google Ads landing pages | `src/app/[slug]/page.tsx` |
| Admin panel | `src/app/admin/` |
| Admin auth | `src/app/api/auth/[...nextauth]/route.ts` |
| Supabase server client | `src/lib/supabase/server.ts` |
| Supabase browser client | `src/lib/supabase/client.ts` |
| Generated DB types | `src/lib/supabase/types.ts` |
| Admin route protection | `src/middleware.ts` |
| MDX static pages | `content/pages/` |
| Next.js config + redirects | `next.config.ts` |
