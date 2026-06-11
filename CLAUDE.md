# Thrive Vineyard Website

A centralized ministry information platform for Thrive Vineyard church. Every event, group, sermon series, and announcement is a single canonical entity referenced everywhere — not duplicated across pages.

## Architecture

- Next.js 15 App Router (TypeScript + Tailwind CSS)
- Supabase (Postgres) for all dynamic content — sermons, events, groups, announcements, staff, landing pages
- Custom `/admin` routes protected by NextAuth.js; Aiden is primary editor, staff use custom admin interfaces
- MDX files in `content/pages/` for structural pages that rarely change (About, Plan a Visit, Kids, Outreach, Give)
- ChurchSuite for signup/registration form embeds only — no data sync, no API integration
- Hosted on Vercel (free tier) + Supabase (free tier)

## How to work

- **Bounded runs:** Every task is a ticket (`docs/workflow/ticket-template.md`). Edit only Allowed Files.
- **Targeted reads:** Max 8 file reads, 6 grep/glob, 12 tool calls per ticket. Stop and ask before exceeding.
- **No verification runs:** Do not run build, dev, test, or compile to verify changes.
- **Specs once per session:** Read spec once → produce Spec Summary → run tickets from summary.
- **Lazy-load skills:** Ticket names the skill pack (0–2 core, 0–2 domain). No full registry loads.

## Hard constraints

- **No Supabase client in React components.** All data fetching via Server Components (using `src/lib/supabase/server.ts`) or API routes. Browser client (`src/lib/supabase/client.ts`) for client-side-only interactions only.
- **Admin routes require auth.** `middleware.ts` protects all `/admin/**` routes via NextAuth. Do not bypass.
- **Never invent ministry data.** Never fabricate event dates, staff names, contact info, or ministry descriptions. Follow `floorplan.md` AI agent rules.
- **SEO redirects.** Any URL structure change from the WordPress site requires a 301 redirect in `next.config.ts`. See `docs/04-seo-url-migration-map.md` (pending Search Console audit).
- **ChurchSuite is forms only.** It is a link/embed destination, not a data source. No API calls to ChurchSuite.

## Project map

| What | Where |
|------|-------|
| Workflow entrypoint | `docs/workflow/workflow.md` |
| Execution rules | `docs/workflow/execution-rules.md` |
| Ticket template | `docs/workflow/ticket-template.md` |
| Skill map | `docs/workflow/skill-map.md` |
| Claude optimization | `docs/workflow/claude-opt.md` |
| Task-type reference map | `docs/workflow/task-type-reference-map.md` |
| Architecture vision | `floorplan.md` |
| Project brief | `docs/00-project-brief.md` |
| URL structure + routes | `docs/03-information-architecture.md` |
| Content models (Supabase tables) | `docs/05-content-models.md` |
| Integrations | `docs/06-integrations.md` |
| Specs | `docs/plans/specs/` |
| Tickets | `docs/plans/tickets/` |
| Progress | `docs/plans/PROGRESS.md` |
| Doc index | `docs/INDEX.md` |
| Database schema | `supabase/schema.sql` |
