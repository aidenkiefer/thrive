# Thrive Vineyard Website — Project memory

**Mission:** Centralized ministry information platform for Thrive Vineyard — every event, group, sermon, and announcement is one canonical entity displayed everywhere automatically.

## How to work

- **Bounded runs:** Every task is a ticket (`docs/workflow/ticket-template.md`). Edit only Allowed Files listed in the ticket.
- **Targeted reads:** Max 8 file reads, 6 grep/glob, 12 tool calls per ticket. Stop and ask before exceeding.
- **No verification runs:** Do not run build, dev, test, or compile to verify or confirm changes.
- **Specs once:** Read spec once per session → produce a Spec Summary (10–20 lines) → run tickets from the summary.
- **Lazy-load skills:** Ticket names the skill pack (0–2 core, 0–2 domain). Do not load the full skill registry.

## Hard constraints

- Edit only files in the Allowed Files list. Stop and ask if you need an unlisted file.
- **No Supabase client in React components.** Use Server Components with `src/lib/supabase/server.ts` for data fetching.
- **Admin routes require NextAuth session.** `middleware.ts` protects `/admin/**`. Do not bypass.
- **Never invent ministry data.** No fabricated event dates, staff names, or contact info.
- **ChurchSuite is forms only.** Link/embed destination — no API calls.
- **SEO: add 301 redirects** for any URL structure changes from WordPress migration.

## Project map

- **Workflow:** `docs/workflow/` — execution-rules, ticket-template, skill-map, task-type-reference-map, claude-opt
- **Architecture:** `docs/03-information-architecture.md`
- **Content models:** `docs/05-content-models.md` (all Supabase tables)
- **Integrations:** `docs/06-integrations.md`
- **Specs:** `docs/plans/specs/`
- **Tickets:** `docs/plans/tickets/`
- **Progress:** `docs/plans/PROGRESS.md`
- **Schema:** `supabase/schema.sql`
- **Doc index:** `docs/INDEX.md`
