# Task Type → Reference Documents Map

**Purpose:** Maps task types to required reference documents, domain skills, agent types, and constraints.

**For:** Agents executing tickets; humans writing specs and tickets.

---

## How to Use

1. Identify your task type from the tables below
2. Load Required References first; Optional References only if relevant or budget allows
3. Prefer Small (S) docs over Large (L) when budget is tight
4. Apply the listed skills from the "Skills" column
5. Stay within Allowed Files from the ticket

### Priority and size definitions

- **HIGH:** Must-read first; primary source of truth.
- **MEDIUM:** Read when relevant or after HIGH.
- **LOW:** Load only if budget allows.
- **S:** < ~150 lines. **M:** ~150–500 lines. **L:** > ~500 lines.

---

## Verified Skills

### Core workflow process skills (Layer 1 — see `skill-map.md`)
`brainstorming` · `writing-plans` · `executing-plans` · `test-driven-development` · `systematic-debugging` · `verification-before-completion` · `requesting-code-review` · `receiving-code-review` · `using-git-worktrees` · `finishing-a-development-branch` · `dispatching-parallel-agents` · `subagent-driven-development` · `writing-skills`

### Domain skills (Layer 3 — see `skill-map.md`)
`frontend-design` · `react-best-practices` · `nextjs-app-router-patterns` · `tailwind-patterns` · `shadcn` · `mobile-design` · `seo` · `backend-dev-guidelines` · `nextjs-supabase-auth` · `postgres-best-practices` · `typescript-pro` · `vercel-deployment`

---

## Sub-Agent Routing

| Agent Type | Load these references | Load these skills |
|---|---|---|
| `frontend-agent` | `docs/07-design-system.md` (when created), `docs/03-information-architecture.md` | `frontend-design`, `react-best-practices`, `tailwind-patterns` |
| `backend-agent` | `docs/05-content-models.md`, `docs/06-integrations.md` | `backend-dev-guidelines` |
| `data-agent` | `docs/05-content-models.md`, `supabase/schema.sql` | `backend-dev-guidelines`, `postgres-best-practices` |
| `seo-agent` | `docs/03-information-architecture.md`, `docs/04-seo-url-migration-map.md` | `seo` |
| `admin-agent` | `docs/05-content-models.md`, `docs/06-integrations.md` | `backend-dev-guidelines`, `react-best-practices` |
| `debugging-agent` | `docs/03-information-architecture.md`, `docs/06-integrations.md` | `systematic-debugging` |
| `docs-agent` | `docs/INDEX.md`, `docs/workflow/workflow.md` | `writing-plans` |
| `auth-agent` | `docs/06-integrations.md`, `src/middleware.ts` (read-only) | `nextjs-supabase-auth`, `backend-dev-guidelines` |

---

## Task Type Reference Map

### 1. UI Components & Page Design

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Page Design** | Homepage, sermon archive, event listing, groups page | `docs/03-information-architecture.md` | `docs/07-design-system.md` (when created), relevant spec | `src/app/**/page.tsx` | `frontend-agent` | `brainstorming`, `frontend-design`, `nextjs-app-router-patterns` | Server Components for data; use Tailwind; no hardcoded colors | HIGH | M |
| **UI Components** | Cards, hero sections, nav, footer, event cards, sermon cards | `docs/03-information-architecture.md` | `docs/07-design-system.md` | `src/components/` | `frontend-agent` | `frontend-design`, `tailwind-patterns`, `shadcn` | Use shadcn/ui primitives; design tokens; no hardcoded spacing | HIGH | M |
| **Landing Pages** | Google Ads destination pages at `/[slug]` | `docs/05-content-models.md` section on `landing_pages` | `docs/03-information-architecture.md` | `src/app/[slug]/page.tsx`, `src/components/` | `frontend-agent` | `frontend-design`, `seo` | Minimal nav; single CTA; SEO fields populated; no reserved slugs | HIGH | M |
| **MDX Pages** | Plan a Visit, About, Kids & Youth, Outreach hub, Give | relevant MDX file in `content/pages/` | `docs/03-information-architecture.md` | `content/pages/*.mdx`, rendering components | `frontend-agent` | `frontend-design`, `react-best-practices` | MDX only — no Supabase for these pages; sanitize inputs | MEDIUM | M |
| **Admin UI** | Sermon form, event editor, announcement form, group editor | `docs/05-content-models.md` | `docs/06-integrations.md` | `src/app/admin/**/page.tsx`, `src/components/admin/` | `admin-agent` | `frontend-design`, `react-best-practices`, `shadcn` | Server action for saves; validate input at boundary; auth required | HIGH | M |
| **Responsive / Mobile** | Mobile nav, event cards at mobile breakpoints | `docs/03-information-architecture.md` | — | UI files | `frontend-agent` | `mobile-design`, `tailwind-patterns` | Mobile-first; 44px min touch targets | HIGH | M |

---

### 2. Backend & API Development

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **API Routes** | Revalidation webhook, form submission, admin save actions | `docs/06-integrations.md` | `docs/05-content-models.md` | `src/app/api/` | `backend-agent` | `backend-dev-guidelines` | Validate inputs; never log secrets; service role key server-only | HIGH | M |
| **Server Actions** | Admin form saves, publish/unpublish, announcement expire | `docs/05-content-models.md` | `docs/06-integrations.md` | `src/app/admin/**/` | `backend-agent` | `backend-dev-guidelines` | Supabase service role key server-only; validate before write | HIGH | M |
| **Data Fetching** | Sermon archive page, event listing, homepage sections | `docs/05-content-models.md` | `docs/03-information-architecture.md` | `src/app/**/page.tsx` (server), `src/lib/` | `backend-agent` | `backend-dev-guidelines`, `react-best-practices` | Use Server Components; ISR revalidation where appropriate; handle null | HIGH | M |
| **ChurchSuite Integration** | Render signup button, embed form URL | `docs/06-integrations.md` section on ChurchSuite | — | Any component rendering signup link | `backend-agent` | — | Link/embed only — no API calls to ChurchSuite | HIGH | S |
| **Auth & Sessions** | Admin login, NextAuth config, session check | `docs/06-integrations.md` section on NextAuth | `src/middleware.ts` (read-only) | `src/app/api/auth/`, `src/middleware.ts`, `src/app/admin/layout.tsx` | `auth-agent` | `nextjs-supabase-auth`, `backend-dev-guidelines` | All admin routes protected; redirect to `/admin/login` on 401 | HIGH | M |

---

### 3. Data & Schema

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Schema Changes** | New table, new column, new index, new relation | `docs/05-content-models.md` | `supabase/schema.sql` (read-only reference) | `supabase/schema.sql` | `data-agent` | `postgres-best-practices` | Review migration plan; no destructive ops without approval; RLS on all tables | HIGH | M |
| **Supabase Types** | Regenerate TypeScript types after schema change | — | `supabase/schema.sql` | `src/lib/supabase/types.ts` | `data-agent` | — | Run CLI: `npx supabase gen types typescript --local > src/lib/supabase/types.ts` | MEDIUM | S |
| **Data Access Patterns** | Queries with filters, joins, pagination, ordering | `docs/05-content-models.md` | `supabase/schema.sql` | `src/lib/`, Server Components | `data-agent` | `postgres-best-practices`, `backend-dev-guidelines` | No N+1 queries; index slug and published_at; filter by published_at | HIGH | M |
| **Seed Data** | Initial staff, test events, sample sermons | `docs/05-content-models.md` | — | `supabase/seed.sql` or scripts | `data-agent` | — | Idempotent; never invent real ministry data | MEDIUM | S |

---

### 4. SEO & Migration

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **SEO Meta Tags** | Title, description, og:image for sermon, event, group pages | `docs/03-information-architecture.md` | `docs/05-content-models.md` (SEO fields) | `src/app/**/page.tsx` | `seo-agent` | `seo` | Use `seo_title` / `seo_description` from Supabase; fallback to name/title | HIGH | M |
| **Structured Data** | JSON-LD for Event, Sermon, Organization | `docs/03-information-architecture.md` | — | `src/app/**/page.tsx` or layout | `seo-agent` | `seo` | Use schema.org types; validate against Google Rich Results | HIGH | M |
| **301 Redirects** | Old WordPress URLs → new Next.js URLs | `docs/04-seo-url-migration-map.md` (when written) | `docs/03-information-architecture.md` | `next.config.ts` | `seo-agent` | `seo`, `vercel-deployment` | Redirects are permanent (301); preserve every high-traffic WordPress URL | HIGH | S |
| **Sitemap & Robots** | `sitemap.xml`, `robots.txt` for all public routes | `docs/03-information-architecture.md` | — | `src/app/sitemap.ts`, `src/app/robots.ts` | `seo-agent` | `seo` | Include all published entities; exclude `/admin/**` | HIGH | M |

---

### 5. Testing & Quality

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Component Tests** | Render tests for cards, nav, sermon player | — | Relevant component file | `__tests__/` or co-located | `testing-agent` | `test-driven-development` | Test edge cases (null data, expired events); mock Supabase | MEDIUM | M |
| **Integration** | Admin save flow, auth redirect, ISR revalidation | `docs/06-integrations.md` | `docs/03-information-architecture.md` | Test files | `testing-agent` | `test-driven-development` | Test critical admin paths; use stable selectors | MEDIUM | M |

---

### 6. Deployment & Infrastructure

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Vercel Config** | Env vars, ISR revalidation interval, redirects | `docs/06-integrations.md` | `docs/03-information-architecture.md` | `next.config.ts`, Vercel dashboard | `debugging-agent` | `vercel-deployment` | Never commit secrets; use Vercel env var dashboard | HIGH | S |
| **ISR Revalidation** | Set revalidate interval for sermon/event pages | `docs/03-information-architecture.md` | `docs/06-integrations.md` | `src/app/**/page.tsx` | `backend-agent` | `vercel-deployment`, `nextjs-app-router-patterns` | Homepage/announcements: shorter interval; static entity pages: 60s | MEDIUM | S |

---

### 7. Workflow & Planning

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Spec Writing** | Feature specs, sprint docs | `docs/workflow/ticket-template.md`, `docs/workflow/execution-rules.md`, `docs/workflow/claude-opt.md` | Relevant arch doc | `docs/plans/specs/` | `docs-agent` | `writing-plans`, `brainstorming` | Keep focused; Spec Summary not full spec per turn | HIGH | S |
| **Ticket Writing** | Bounded tickets from specs | `docs/workflow/ticket-template.md`, `docs/workflow/claude-opt.md` | Relevant spec | `docs/plans/tickets/` | `docs-agent` | `writing-plans` | Set Allowed Files, budgets, done criteria; name skill pack | HIGH | S |
| **Context Audit** | Quarterly docs review | `docs/workflow/context-audit.md` | — | `docs/` | `docs-agent` | — | Follow audit checklist; document findings; ticket issues | MEDIUM | M |

---

### 8. Troubleshooting & Debugging

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Build Errors** | TypeScript errors, missing env vars, module not found | `docs/06-integrations.md` | `docs/03-information-architecture.md` | Build config, error location | `debugging-agent` | `systematic-debugging` | Identify root cause; don't suppress errors | HIGH | M |
| **Data Issues** | Null entity, missing slug, draft published | `docs/05-content-models.md` | `supabase/schema.sql` | Server Components, admin routes | `debugging-agent` | `systematic-debugging`, `postgres-best-practices` | Check published_at, slug uniqueness, RLS policies | HIGH | M |
| **Auth Issues** | Admin login fails, session not persisting, 401 redirect | `docs/06-integrations.md` section on NextAuth | `src/middleware.ts` | Auth files, middleware | `auth-agent` | `systematic-debugging`, `nextjs-supabase-auth` | Check NEXTAUTH_SECRET, callback URLs, env vars first | HIGH | M |

---

## Reference Document Sizes

| Size | Examples in this project |
|------|---|
| **S** (< 150 lines) | `docs/workflow/ticket-template.md`, `.env.local.example`, `src/middleware.ts` |
| **M** (150–500 lines) | `docs/03-information-architecture.md`, `docs/05-content-models.md`, `docs/06-integrations.md` |
| **L** (> 500 lines) | `supabase/schema.sql`, `docs/workflow/task-type-reference-map.md` |

---

## Quick Reference: Most Common Task Types

1. **React page or component** → `frontend-agent`, load `docs/03-information-architecture.md`, skills: `frontend-design`, `react-best-practices`
2. **Admin form or save action** → `admin-agent`, load `docs/05-content-models.md` + `docs/06-integrations.md`, skills: `backend-dev-guidelines`
3. **Supabase query or schema** → `data-agent`, load `docs/05-content-models.md`, skills: `postgres-best-practices`
4. **SEO meta or structured data** → `seo-agent`, load `docs/03-information-architecture.md`, skills: `seo`
5. **Bug or unexpected behavior** → `debugging-agent`, skills: `systematic-debugging`
6. **Auth / admin protection** → `auth-agent`, load `docs/06-integrations.md`, skills: `nextjs-supabase-auth`
7. **Spec or ticket writing** → `docs-agent`, load `ticket-template.md`, skills: `writing-plans`, `brainstorming`
8. **Vercel / ISR config** → load `docs/06-integrations.md`, skills: `vercel-deployment`

---

## [PROJECT-SPECIFIC] Thrive-Specific Task Types

<!-- PRESERVE: Thrive Vineyard project-specific task types -->

### Church content management

| Task Type | Examples | Required References | Optional References | File Scope | Agent type | Skills | Constraints | Priority | Size |
|---|---|---|---|---|---|---|---|---|---|
| **Canonical Entity Page** | Sermon page, recurring event page, group page | `docs/05-content-models.md`, `docs/03-information-architecture.md` | Relevant spec | `src/app/(public)/[entity]/[slug]/page.tsx` | `frontend-agent` | `frontend-design`, `seo`, `react-best-practices` | SEO fields from Supabase; ISR revalidate; ChurchSuite form link if applicable | HIGH | M |
| **Homepage Sections** | Upcoming events block, latest sermon block, featured announcement | `docs/03-information-architecture.md` | `docs/05-content-models.md` | `src/app/page.tsx`, `src/components/home/` | `frontend-agent` | `frontend-design`, `react-best-practices` | Server Components; pull from Supabase; handle empty state gracefully | HIGH | M |
| **Event Occurrence Management** | Add/edit/cancel dated instances of a recurring event | `docs/05-content-models.md` section on `event_occurrences` | — | `src/app/admin/events/[id]/edit/page.tsx` | `admin-agent` | `backend-dev-guidelines`, `react-best-practices` | Occurrences belong to recurring_event; never mutate parent; soft-cancel via `cancelled` field | HIGH | M |
| **WordPress Migration** | Import sermon/page content from WordPress export | `docs/05-content-models.md`, `docs/04-seo-url-migration-map.md` | `docs/06-integrations.md` | `supabase/` seed scripts, `next.config.ts` | `data-agent` | `postgres-best-practices`, `seo` | Never invent dates; map old WordPress slugs; add 301 redirects | HIGH | M |

<!-- /PRESERVE -->
