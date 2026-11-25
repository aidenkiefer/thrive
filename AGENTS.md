# Thrive Vineyard Website

## MVP signup refinement — later 2026-11-22

Owner chose a **branded Thrive signup surface linking to Google's hosted form** for MVP. Use the official Forms REST API through an operator CLI to create/read/update/publish forms from reusable templates (#151); no authenticated Google API call per public page view. Responses/private review remain in Google. Custom Thrive input rendering and an Apps Script submission bridge are post-MVP (#148), not launch blockers. The branded surface is #149; #50 is the umbrella.

Free Browser/Computer setup is authorized for the later owner-assisted window. Defer account consent/provisioning until then; do not enable a paid plan, billable commitment or unknown-cost service. This does not replace artifact-specific live database or DNS approval. Build/QA templates, dry runs, mocked API adapters and branded handoff states before setup; mocks never establish real service success. Newest refinement supersedes earlier plain-link-only or custom-field aspirations.

Centralized ministry information platform for Thrive Vineyard church. Every event, group, sermon series, and announcement is **one canonical entity** shown everywhere, never duplicated across pages.

**Stack:** Next.js 15 App Router (TypeScript, Tailwind) · Supabase Postgres · NextAuth for `/admin/**` · MDX in `content/pages/` for structural pages · Google Forms for signup links; ChurchSuite for giving links · Vercel (`main` = production).

## Owner architecture direction (2026-11-22)

- Prefer managed/hosted services that reduce our runtime, custom code and operational burden. Compare maintenance, reliability, permissions, portability and current quotas before implementing a subsystem.
- Prefer suitable free allowances until payment is justified. This is not a hard $0 ceiling; present paid commitments and expected recurring charges to the owner before enabling them.
- Target **more than 1,000 concurrent website visitors**, primarily a regional audience within roughly 60 miles. This is an unverified capacity requirement, not 1,000 simultaneous submissions, database connections or requests/second. Define journey/load assumptions and favor CDN/static/cache delivery.
- Keep the existing stack and accepted #144 visual design. Major architecture/interface/design/product/cost changes still return to the owner.
- **Signup choice:** Google Forms/Sheets, with external response review and links from Thrive admin; no response synchronization, custom form builder or in-app response dashboard for MVP. Standard provider notifications are sufficient; custom detailed-email automation, bespoke export controls and automated retention are not required for MVP. Ordinary private sharing and deletion on request are retained; the fixed 12-month cleanup requirement is explicitly deferred.
- **Media:** retain optimized committed site assets; use Supabase Storage for changing images, owner/dashboard-managed initially. Defer the custom staff uploader.
- **Recovery:** approved direction is weekly GitHub Actions exports, encrypted before transfer to separate private R2 storage, keeping ten verified snapshots, restore rehearsal and failure/missed-backup alerts. Exact account setup and any paid commitment still need owner action/approval.
- **Mail:** native staff-code sender info@thrivevineyard.com; website notification sender website@updates.thrivevineyard.com; default recipient info@thrivevineyard.com includes prayer. The prayer recipient env setting can point to that same inbox; no separate prayer mailbox is required.
- Wednesday November 25 means tested/approved MVP readiness, not automatic DNS cutover. CMS preview/version restore remains deferred. Decision record and tradeoffs: docs/plans/specs/2026-11-22-managed-services-tradeoffs.md.

## Commands

- `npm run dev` / `npm run build` / `npm run seed`
- `scripts/agents/gate.sh`: **required before every push** (typecheck, lint, production build). `--quick` for a cheap spot check.
- `scripts/agents/worktree.sh new <claude|cursor|codex> <lane>-<slug>`: create your isolated worktree + branch.

## How agents work here (multi-agent, v2)

Three tools (Claude Code, Cursor, Codex) work in parallel. Start with [agent onboarding](docs/workflow/agent-onboarding.md) and [the workflow](docs/workflow/workflow.md) before your first session.

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
- **Forms:** Google Forms owns event/group signup collection and responses; use approved hosted links/embeds without syncing responses into Supabase. ChurchSuite giving stays external. Existing native feedback/prayer forms use server-side email, both to the approved default church inbox. See the [current floorplan](floorplan.md) and dated owner decisions.
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
