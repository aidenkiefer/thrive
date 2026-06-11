# Thrive Vineyard Website — Progress

Tracks milestones, sprints, and completed work across the project lifespan.

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
| **v0.2.0** | **Supabase schema + initial data layer** | Not started | — | — | `docs/05-content-models.md` | Schema → TypeScript types → seed data |
| **v0.3.0** | **Homepage + public routes** | Not started | — | — | `docs/03-information-architecture.md` | Static shell with placeholder sections |
| **v0.4.0** | **Sermon archive + watch page** | Not started | — | — | `docs/plans/specs/` (TBD) | `/sermons`, `/sermons/[slug]`, series pages |
| **v0.5.0** | **Events system** | Not started | — | — | `docs/plans/specs/` (TBD) | Recurring events, occurrences, event detail pages |
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
| **v0.1.3** | Next.js project scaffold and Supabase schema placeholder | 2026-06-11 | App | All route placeholders, config files, supabase/schema.sql |

---

## Planned / in-progress (backlog)

| Type | Item | Source / reference | Notes |
|------|---|---|---|
| **Future phase** | WordPress content import | `docs/05-content-models.md` | Needs WordPress export + admin access |
| **Future phase** | Google Search Console SEO audit | `docs/04-seo-url-migration-map.md` (TBD) | Required before finalizing URL structure |
| **Future phase** | Design system | `docs/07-design-system.md` (TBD) | Brand colors, typography, component tokens |
| **Future phase** | Newsletter signup integration | `docs/06-integrations.md` (future integrations) | Provider TBD (Mailchimp, Kit, etc.) |
| **Future phase** | Podcast RSS feed | `docs/06-integrations.md` (future integrations) | Auto-publish sermons |
| **Future phase** | Livestream embed | `docs/06-integrations.md` (future integrations) | YouTube Live / Vimeo embed on Watch page |
| **Deferred** | Full CMS for non-technical staff | — | Custom admin panel covers staff editing needs |
| **Fix / patch** | Upgrade `next-mdx-remote` v5 → v6 | `package.json` | High-severity vuln (GHSA-g4xw-jxrg-5f6m): arbitrary code execution via untrusted MDX in SSR. Safe until MDX rendering is implemented; upgrade before writing MDX pages. |
| **Known / non-actionable** | `postcss`, `uuid` moderate vulns in Next.js / NextAuth internals | `package.json` | Not directly fixable without downgrading Next.js to v9. Will resolve when Next.js and NextAuth release dependency updates. Monitor with `npm audit`. |

---

## Index

### Architecture docs (`docs/`)

| Doc | Description |
|---|---|
| [00-project-brief.md](../00-project-brief.md) | Vision, goals, constraints, tech stack rationale |
| [03-information-architecture.md](../03-information-architecture.md) | Full URL structure, page types, admin routes, homepage sections |
| [05-content-models.md](../05-content-models.md) | All Supabase tables with fields, relationships, reserved slugs |
| [06-integrations.md](../06-integrations.md) | Supabase, NextAuth, ChurchSuite, Vercel, Google Ads |

### Session notes (`docs/superpowers/specs/`)

| Doc | Description |
|---|---|
| [2026-06-09-thrive-architecture-planning-session.md](../superpowers/specs/2026-06-09-thrive-architecture-planning-session.md) | Full brainstorm session — decisions, open questions answered, progress |
