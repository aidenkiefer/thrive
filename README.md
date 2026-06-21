# Thrive Vineyard Website

A centralized ministry information platform for Thrive Vineyard church. Every event, group, sermon, and announcement exists as one canonical entity — displayed automatically across the site rather than duplicated across pages.

Built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

**Current phase:** v0.1.0 complete (scaffold + docs). **Next:** v0.2.0 — provision Supabase, apply schema, generate types, add seed data. See [docs/plans/PROGRESS.md](docs/plans/PROGRESS.md) for the full roadmap and checklist.

---

## Quick start

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXTAUTH_SECRET
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx supabase gen types typescript --local > src/lib/supabase/types.ts` | Regenerate DB types |

---

## Project structure

```
src/
  app/
    (public)/         Public-facing routes
    [slug]/           Google Ads landing pages (root catch-all)
    admin/            Staff admin panel (NextAuth-protected)
    api/auth/         NextAuth route handler
  lib/supabase/       Supabase client helpers + generated types
  components/         Shared UI components
  middleware.ts       Admin route protection

supabase/
  schema.sql          Full database schema

content/
  pages/              MDX files for rarely-changed structural pages
                      (About, Plan a Visit, Kids & Youth, Outreach, Give)

docs/
  00-project-brief.md
  03-information-architecture.md
  05-content-models.md
  06-integrations.md
  workflow/           Agent workflow docs (execution rules, tickets, skill map)
  plans/              Specs, tickets, progress log
```

---

## Documentation

| What | Where |
|---|---|
| Vision and architectural principles | `floorplan.md` |
| Project brief and tech stack | `docs/00-project-brief.md` |
| Live WordPress site audit | `docs/01-current-site-audit.md` |
| URL structure and routes | `docs/03-information-architecture.md` |
| SEO redirect map (draft) | `docs/04-seo-url-migration-map.md` |
| Supabase content model (all tables) | `docs/05-content-models.md` |
| Integrations (Supabase, NextAuth, ChurchSuite, Vercel) | `docs/06-integrations.md` |
| Agent workflow entrypoint | `docs/workflow/workflow.md` |
| Progress and milestone log | `docs/plans/PROGRESS.md` |
| Doc index | `docs/INDEX.md` |

---

## Tech stack

- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres)
- **Auth:** NextAuth.js (admin panel only)
- **Static pages:** MDX (`content/pages/`)
- **Forms/signups:** ChurchSuite (embed URLs only)
- **Hosting:** Vercel
