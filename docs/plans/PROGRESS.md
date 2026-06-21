# Thrive Vineyard Website — Progress

Tracks milestones, sprints, and completed work across the project lifespan.

---

## Current status (2026-06-20)

**Phase:** **Sprint 01 Demo Draft COMPLETE** — all 10 tickets shipped. Next: Sprint 02 (admin panel stub).

**Spec:** [`docs/plans/specs/sprint-01-demo-draft.md`](specs/sprint-01-demo-draft.md)  
**Tickets:** `docs/plans/tickets/01-*` through `10-*` — all done

**Human action required before first run:**
1. Create Supabase project + copy `.env.local.example` → `.env.local` with real keys
2. Apply `supabase/schema.sql` via Supabase dashboard SQL editor
3. Run `npm install` (next-mdx-remote upgraded to v6)
4. Run `npm run seed` to import parsed WordPress data

### What's done (Sprint 01 complete)

| Area | Status | Notes |
|------|--------|-------|
| Architecture docs | Complete | `00`, `01`, `03`, `04` (draft), `05`, `06`; `floorplan.md`; session notes |
| Agent workflow | Complete | CLAUDE.md, AGENTS.md, workflow docs, ticket template |
| Next.js scaffold | Complete | Next 15, TypeScript, Tailwind, ESLint; `npm install` works |
| Supabase schema (DDL) | Complete | `supabase/schema.sql` — all tables + Sprint 01 patch (topics, service_type, venue) |
| Supabase client helpers | Complete | `src/lib/supabase/server.ts`, `client.ts` |
| Query layer | Complete | `src/lib/queries/` — sermons, events, announcements, groups, outreach |
| Seed import script | Complete | `scripts/seed-from-parsed.ts` — run `npm run seed` after applying schema |
| Design tokens | Complete | `tailwind.config.ts` brand/accent/neutral tokens + Fraunces/Inter fonts |
| UI primitives | Complete | `src/components/ui/` — Button, Card, Section, Container, Heading |
| GlobalNav + Footer | Complete | `src/components/layout/` — sticky navy nav, mobile drawer, brand-900 footer |
| Homepage | Complete | 7 Supabase-backed sections, ISR 60s |
| Sermons pages | Complete | `/sermons`, `/sermons/[slug]`, `/sermons/series`, `/sermons/series/[slug]` |
| Events pages | Complete | `/events`, `/events/[slug]` — one-time + recurring |
| Plan a Visit MDX | Complete | `/plan-a-visit` — next-mdx-remote v6, content from site audit |
| Admin middleware | Wired | `middleware.ts` protects `/admin/**`; auth handler is a stub |

### Still pending (Sprint 02 scope)

| Area | Status | Notes |
|------|--------|-------|
| Supabase project | Needs human | No `.env.local`; schema not applied to a live project |
| Generated DB types | Stub only | `src/lib/supabase/types.ts` is empty — run `supabase gen types` after applying schema |
| Admin auth | Stub | NextAuth `authorize()` always returns `null`; login form not built |

---

## Version scheme

| Level | Meaning | Example |
|-------|---------|---------|
| **Major (X.0.0)** | Major product phase or architectural shift | v2.0.0 = WordPress migration complete |
| **Minor (1.X.0)** | Feature or surface complete | v1.1.0 = Sermon archive live |
| **Patch (1.0.X)** | Small fixes, polish, docs, config tweaks | v1.0.1 = ISR revalidation tuned |

---

## Milestones and sprints

| Version | Milestone / sprint | Status | Completed | Remaining | Spec / plan | Summary / notes |
|---------|---|--------|-----------|-----------|---|---|
| **v0.1.0** | **Project scaffold + workflow setup** | Done | 2026-06-11 | 0 | `floorplan.md`, session notes | Architecture brainstorm complete; all docs + scaffold written |
| **v0.2.0** | **Supabase schema + initial data layer** | Done | 2026-06-20 | — | Sprint 01 Phase A | Schema patch, query layer, seed script |
| **v0.3.0** | **Homepage + public routes** | Done | 2026-06-20 | — | Sprint 01 Phase B–C | Design system, nav/footer, homepage, plan-a-visit |
| **v0.4.0** | **Sermon archive + watch page** | Done | 2026-06-20 | — | Ticket 08 | Sermons archive, detail, series pages |
| **v0.5.0** | **Events system** | Done | 2026-06-20 | — | Ticket 09 | Events listing + detail, one-time + recurring |
| **v0.6.0** | **Groups + ministries** | Not started | — | — | `docs/plans/specs/` (TBD) | Groups listing, individual group pages |
| **v0.7.0** | **Admin panel — core CRUD** | Not started | — | — | `docs/plans/specs/` (TBD) | Sermon, event, group, announcement management |
| **v0.8.0** | **Google Ads landing pages** | Not started | — | — | `docs/plans/specs/` (TBD) | `landing_pages` table + `/[slug]` catch-all |
| **v0.9.0** | **SEO + WordPress migration** | Not started | — | — | `docs/04-seo-url-migration-map.md` (TBD) | 301 redirects, meta tags, structured data, sitemap |
| **v1.0.0** | **Launch** | Not started | — | — | — | First public deployment |

---

## Patch-level completed work (non-sprint)

| Version | Patch work item | Completed | Area | Notes |
|---------|---|-----------|------|---|
| **v0.1.1** | Architecture docs (00, 03, 05, 06) written | 2026-06-11 | Docs | Project brief, IA, content models, integrations |
| **v0.1.2** | Workflow docs setup from workflow-core templates | 2026-06-11 | Workflow | CLAUDE.md, AGENTS.md, execution-rules, skill-map, task-type-reference-map, context-flow |
| **v0.1.3** | Next.js project scaffold and Supabase schema | 2026-06-11 | App | All route placeholders, config files, full `supabase/schema.sql` |
| **v0.1.4** | npm audit vulnerabilities documented | 2026-06-11 | Docs | `next-mdx-remote` upgrade path in PROGRESS backlog; notes in `06-integrations.md` |
| **v0.1.5** | Live WordPress site audit | 2026-06-20 | Docs | `01-current-site-audit.md`, draft `04-seo-url-migration-map.md`; integrations + IA updates |
| **v0.1.6** | Brand style subaudit + design revamp plan | 2026-06-20 | Docs | `07-design-system.md` — colors, typography, component plan |
| **v0.1.7** | WordPress XML parse (events + sermons) | 2026-06-20 | Migration | `parse-export.py`, `parsed/*.json`, `02-content-inventory.md` |
| **v0.2.1** | Schema patch: topics, service_type, venue columns added | 2026-06-20 | Schema | Sprint 01 T01; apply + regenerate types before seeding |
| **v0.2.2** | Design tokens, Fraunces+Inter fonts, base CSS | 2026-06-20 | Frontend | Sprint 01 T04; tailwind.config.ts + globals.css + layout.tsx |
| **v0.2.3** | Query layer: typed Supabase helpers in src/lib/queries/ | 2026-06-20 | Backend | Sprint 01 T02; 5 query files + index |
| **v0.2.4** | Core UI primitives: Button, Card, Section, Container, Heading | 2026-06-20 | Frontend | Sprint 01 T05; src/components/ui/ |
| **v0.2.5** | Seed import script: speakers, series, sermons, events, homepage data | 2026-06-20 | Data | Sprint 01 T03; run `npm run seed` after .env.local setup |
| **v0.2.6** | GlobalNav + Footer + root layout wired | 2026-06-20 | Frontend | Sprint 01 T06; sticky navy nav, mobile drawer, brand-900 footer |
| **v0.3.1** | Homepage: Hero, ServiceTimes, Announcement, Events, Sermon, Hubs, Newsletter | 2026-06-20 | Frontend | Sprint 01 T07; ISR 60s, all sections Supabase-backed |
| **v0.4.1** | Sermons: archive, detail, series list, series detail with YouTube | 2026-06-20 | Frontend | Sprint 01 T08; SermonCard, SermonPlayer, SermonMeta components |
| **v0.5.1** | Events: listing + detail for one-time and recurring events | 2026-06-20 | Frontend | Sprint 01 T09; EventCard, EventDetail components; past events excluded |
| **v0.3.2** | Plan a Visit MDX page: next-mdx-remote v6 upgrade + content from audit | 2026-06-20 | Frontend | Sprint 01 T10; human must run `npm install` after merge |
| **v0.5.2** | Sprint 01 final review fixes: SermonPlayer URL normalization, events query correctness, start_datetime null safety | 2026-06-20 | Bug fixes | SermonPlayer handles youtu.be/watch?v=/embed forms; occurrences limit post-filter; OneTimeEvent.start_datetime nullable |

---

## Planned / in-progress (backlog)

| Type | Item | Source / reference | Notes |
|------|---|---|---|
| **Future phase** | WordPress content import | `docs/02-content-inventory.md`, `migration-files/parsed/` | Events + sermons parsed to JSON; media + occurrences still needed |
| **Future phase** | Google Search Console SEO audit | `docs/04-seo-url-migration-map.md` | Draft redirect map written; needs Search Console data to finalize |
| **Future phase** | Design system implementation | `docs/07-design-system.md` | Brand audit done; tokens + components before v0.3.0 UI |
| **Future phase** | Newsletter signup integration | `docs/06-integrations.md` (future integrations) | Provider TBD (Mailchimp, Kit, etc.) |
| **Future phase** | Podcast RSS feed | `docs/06-integrations.md` (future integrations) | Auto-publish sermons |
| **Future phase** | Livestream embed | `docs/06-integrations.md` (future integrations) | YouTube Live / Vimeo embed on Watch page |
| **Deferred** | Full CMS for non-technical staff | — | Custom admin panel covers staff editing needs |
| ~~**Fix / patch**~~ | ~~Upgrade `next-mdx-remote` v5 → v6~~ | ~~`package.json`~~ | Done in v0.3.2 (T10). High-severity vuln GHSA-g4xw-jxrg-5f6m resolved. Run `npm install` to apply. |
| **Known / non-actionable** | `postcss`, `uuid` moderate vulns in Next.js / NextAuth internals | `package.json` | Not directly fixable without downgrading Next.js to v9. Will resolve when Next.js and NextAuth release dependency updates. Monitor with `npm audit`. |

---

## Index

### Architecture docs (`docs/`)

| Doc | Description |
|---|---|
| [00-project-brief.md](../00-project-brief.md) | Vision, goals, constraints, tech stack rationale |
| [01-current-site-audit.md](../01-current-site-audit.md) | Live WordPress site crawl — URLs, content, forms, integrations |
| [03-information-architecture.md](../03-information-architecture.md) | Full URL structure, page types, admin routes, homepage sections |
| [04-seo-url-migration-map.md](../04-seo-url-migration-map.md) | Draft WordPress → Next.js redirect map |
| [07-design-system.md](../07-design-system.md) | Brand audit + revamp plan (colors, type, components) |
| [05-content-models.md](../05-content-models.md) | All Supabase tables with fields, relationships, reserved slugs |
| [06-integrations.md](../06-integrations.md) | Supabase, NextAuth, ChurchSuite, Vercel, Google Ads |

### Session notes (`docs/superpowers/specs/`)

| Doc | Description |
|---|---|
| [2026-06-09-thrive-architecture-planning-session.md](../superpowers/specs/2026-06-09-thrive-architecture-planning-session.md) | Full brainstorm session — decisions, open questions answered, progress |
