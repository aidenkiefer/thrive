# Thrive Vineyard — Doc Index

All documentation for the Thrive Vineyard website project.

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

**Pending (not yet written — needs external data first):**
- `docs/01-current-site-audit.md` — WordPress crawl results
- `docs/02-content-inventory.md` — WordPress content export
- `docs/04-seo-url-migration-map.md` — Old URL → new URL mapping (needs Search Console audit)
- `docs/07-design-system.md` — Brand colors, typography, Tailwind tokens
- `docs/08-ai-agent-rules.md` — AI agent rules (summarized version of `floorplan.md` section)

---

## Workflow

| Doc | Description | Size |
|---|---|---|
| `docs/workflow/workflow.md` | Agent session entrypoint — how to batch tickets, specs vs tickets | S |
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
| `docs/plans/PROGRESS.md` | Milestone log, patch history, backlog |
| `docs/plans/specs/` | Feature specs (to be written per sprint) |
| `docs/plans/tickets/` | Bounded agent task tickets |
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
