# Thrive Vineyard Website

Centralized ministry information platform — every event, group, sermon, and announcement exists as one canonical entity displayed everywhere automatically.

## How to work

- **Bounded runs:** Every task is a ticket. Edit only Allowed Files listed in the ticket.
- **Targeted reads:** Max 8 file reads, 6 grep/glob, 12 tool calls per ticket. Stop and ask if you need more.
- **Mandatory clean pre-push build:** Before every `git push`, run `npm ci` followed by `npm run build` from the repo root and require a successful production build. Fix all build errors before pushing; never push a failing build. Report warnings and distinguish them from build failures.
- **Clean handoff:** Before each push, review `git status`, remove temporary artifacts, and push only the intended committed changes.
- **Specs once:** Read spec once per session → Spec Summary → run tickets from summary.
- **Lazy-load skills:** Ticket names the skill pack. Do not load the full skill registry.

## Hard constraints

- Edit only Allowed Files. Stop and ask if a needed file is not listed.
- No Supabase client in React components — use Server Components with `src/lib/supabase/server.ts`.
- Admin routes (`/admin/**`) require a NextAuth session — do not bypass middleware.
- Never invent ministry data, event dates, staff names, or contact information.
- ChurchSuite is a forms-only destination — no API calls or data sync.

## Where to look

- **Workflow:** `docs/workflow/workflow.md`
- **Claude optimization:** `docs/workflow/claude-opt.md`
- **Architecture:** `docs/03-information-architecture.md`
- **Content models:** `docs/05-content-models.md`
- **Integrations:** `docs/06-integrations.md`
- **Specs:** `docs/plans/specs/`
- **Tickets:** `docs/plans/tickets/`
- **Progress:** `docs/plans/PROGRESS.md`
- **Schema:** `supabase/schema.sql`
