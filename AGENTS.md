# Thrive Vineyard Website

Centralized ministry information platform for Thrive Vineyard church. Every event, group, sermon series, and announcement is **one canonical entity** shown everywhere, never duplicated across pages.

**Stack:** Next.js 15 App Router (TypeScript, Tailwind) · Supabase Postgres · NextAuth for `/admin/**` · MDX in `content/pages/` for structural pages · ChurchSuite for form links only · Vercel (`main` = production).

## Commands

- `npm run dev` / `npm run build` / `npm run seed`
- `scripts/agents/gate.sh`: **required before every push** (typecheck, lint, production build). `--quick` for a cheap spot check.
- `scripts/agents/worktree.sh new <claude|cursor|codex> <lane>-<slug>`: create your isolated worktree + branch.

## How agents work here (multi-agent, v2)

Three tools (Claude Code, Cursor, Codex) work in parallel. Read `docs/workflow/workflow.md` before your first session.

- **Own worktree, own branch:** `<tool>/<lane>-<slug>`. Never edit in the main checkout or on another tool's branch. Check `git branch --show-current && pwd` before the first edit.
- **Stay in your lane:** edit only the lane's owned paths (`docs/workflow/roles-and-lanes.md`) or the ticket's Allowed Files. Other files → cross-lane request via `scribe`.
- **Skills** (`.agents/skills/`): `product-manager` plans, `lane-builder` executes, `scribe` documents (cheap model), `senior-qa` reviews and merges.
- **Model tier per ticket** (`docs/workflow/model-routing.md`): heavy for planning, review, and unknown bugs; standard for implementation; fast for docs.
- **Gate before push, PR via template, never merge your own PR.** Only senior QA writes `docs/plans/PROGRESS.md`.
- **Budgets:** S tickets ≤8 reads / 15 tool calls; M ≤15 / 30; split anything larger. No whole-repo scans.

## Hard constraints

- **No Supabase client in React components.** Fetch in Server Components or API routes via `src/lib/supabase/server.ts`. `client.ts` is for client-only interactions.
- **Admin routes require auth.** `src/middleware.ts` protects `/admin/**` via NextAuth. Never bypass it.
- **Never invent ministry data:** no fabricated dates, staff names, contact info, descriptions, or form URLs. Unknowns go to the owner.
- **SEO redirects:** any public URL change from the WordPress site needs a 301 in `next.config.ts` (see `docs/04-seo-url-migration-map.md`).
- **Forms:** embedded ChurchSuite forms (link/embed only, no API calls, no sync). Google Forms embeds are allowed for forms ChurchSuite doesn't cover.
- **No secrets in git.** `.env*` stays local (except `.env.local.example`).

## Map

| What | Where |
|---|---|
| Workflow entrypoint | `docs/workflow/workflow.md` |
| Lanes / git / models / CI | `docs/workflow/roles-and-lanes.md`, `git-and-worktrees.md`, `model-routing.md`, `devops-automation.md` |
| Runtime rules | `docs/workflow/execution-rules.md` |
| Assignments, session logs, QA reports | `docs/agents/` |
| Roadmap / progress | `docs/08-mvp-status-roadmap.md`, `docs/plans/PROGRESS.md` |
| Architecture, routes, content models, integrations | `floorplan.md`, `docs/03-information-architecture.md`, `docs/05-content-models.md`, `docs/06-integrations.md` |
| Schema | `supabase/schema.sql` |
| Doc index | `docs/INDEX.md` |
