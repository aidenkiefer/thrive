# Thrive Vineyard Website — Progress

Tracks milestones, sprints, and completed work across the project lifespan.

---

## Current status (2026-11-22)

- Owner-approved Cursor redesign #144 is merged as `ab66c93`: brand palette/logos/icons, public polish, admin shell/dashboard/login and scoped form styling.
- Codex independent diff review and Node 20 full gate passed on reviewed head and merged main (510 tests, typecheck, lint, build); main CI succeeded. Real signed-in browser acceptance remains open.
- UI-dependent issues #37/#41/#42/#47/#49/#50/#56/#61/#67 now target this design; unfinished functionality and runtime checks remain open. QA report: [redesign #144](../agents/qa/2026-11-22-redesign-144.md).
- Wednesday Nov 25 targets approved/tested MVP readiness with native signup essentials; CMS preview/restore is deferred (#32/#33). Six detailed owner packages remain unanswered; DNS cutover requires separate owner go.

## Previous checkpoint (2026-11-20)

**Phase:** **Draft site, the Data stack, seed publishing, decided redirects, the church mark, and the prayer form are on `main`.** #137 makes generated seed SQL insert drafts and publish through `cms_set_published` as the seed actor. `supabase/ops/2026-11-20-seed.sql` is committed and has **not** been applied to the live database. #141 makes `scripts/seed-current.ts` skip a row that already has publication history. #140 adds the prayer form on `/get-connected#prayer`. It sends only when `FORMS_PRAYER_RECIPIENT` is set. Launch date: **owner to confirm** (see `docs/10-launch-checklist.md`).

**Active plan:** [`docs/agents/assignments/2026-11-19-batch-3.md`](../agents/assignments/2026-11-19-batch-3.md) (Batches 3-6 order: [`batches.md`](./batches.md); milestones M1-M5: [`roadmap-milestones.md`](./roadmap-milestones.md); lane backlogs: [`backlog/`](./backlog/)).
**Status sources:** GitHub Project 3 (Batch, Delivery stage, Milestone fields) · [`docs/08-mvp-status-roadmap.md`](../08-mvp-status-roadmap.md) · QA reports in [`docs/agents/qa/`](../agents/qa/).

**2026-11-22 QA:** Cursor #150 is merged as `51b7bcc`: light/dark theme, persistent/system preference and reduced-motion-aware theme/page transitions. QA fixed responsive toggle labels and blocked-storage fallback; full local/CI/browser verification is recorded in [the QA report](../agents/qa/2026-11-22-dark-mode-150.md). Media library #153 was independently merged during this review; the merged-main gate includes it (516 tests). Date-picker #147 was merged separately afterward.

### What's done (on `main`)

| Area | Status | Notes |
|------|--------|-------|
| Public site | Merged (#24) | About, About/Team, Plan a Visit, Kids & Youth, Give, Get Connected, ministries, events, sermons, groups, outreach from audited content; graceful empty states; `compilePageMdx` for MDX pages |
| Motion, SEO plumbing | Merged (#25, #27, #29) | Scroll-driven reveals and hover/press (reduced-motion gated); sitemap incl. `/get-connected` that degrades outside production; Church and Event JSON-LD |
| Tracking | Merged (#28) | GTM `GTM-PRJX6P9H` (owner choice) in production builds only; no consent notice yet; Ads `AW-16575196430` not loaded directly (owner to confirm it is inside the container) |
| Data RC2 | Merged (#12) | Form-URL allowlist, contact privacy migration, Express(o) un-paused |
| Tests and fixtures | Merged (#27, #85, #89) | 91 tests; colocated tests discovered; ministry fixtures and render tests |
| Docs and planning | Merged (#26, #86, #87, #88, #92, #93) | Live URL inventory and launch checklist (`docs/10`), architecture and onboarding, milestones M1-M5, 36 shaped issues, batch order, QA reports |
| Session 2 Experience | Merged (#106, #109, #116, #124) | Helpful 404 and error pages; sermon audio with a host-allowlisted YouTube parser; `GET /og` 1200×630 PNG; public Open Graph and Twitter metadata. `LatestSermonSection` still iframes `youtube_url` by string replace (E4) |
| Data stack | Merged 2026-11-20 (#15, #18, #23, #95, #114, #90, #96, #120, #122) | Staff code sign-in, form registry, Resend transport, shared limiter, admin role, attributed publishing, reserved slugs including `thrive-flames`, one revalidation helper. Live migrations applied first. |
| Session 2 Ops docs | Merged (#107, #110, #115) | Vercel env matrix and Preview smoke checklist; Supabase readiness and backup drill (plan tier, backups and RPO/RTO still owner-owned; #70 stays open); worktree hygiene log (#30 stays open) |

### Still open

| PR | What | Why it is still open |
|----|------|----------------------|
| #117 | Playwright smoke (#64) | Draft. Not this merge pass. |
| #105 | Root sender DNS runbook (#103) | Draft. Owner DNS setup is still pending. |

### Owner decisions on record

Full dated log: [owner-decisions.md](owner-decisions.md). 2026-11-19 additions: production Supabase used before launch (no Preview project; live data is an older import, reconcile and seed in #101); staff login sender `info@thrivevineyard.com` (DNS caveat in #103); staff-account control is admin-role only, owner the only admin (#102); Express(o) Sundays 8:30 AM. Current work plan: [session 2](../agents/assignments/2026-11-19-session-2.md).

Shared abuse limiter = Postgres. Announcements: newest featured wins, no priority or scheduling (staff guide `docs/staff/announcements.md`). GTM container `GTM-PRJX6P9H`; no consent notice for now. Native email forms replace Google Forms (`AGENTS.md` forms constraint, approved 2026-11-19). Automated publishing uses reserved system actor rows in `admin_staff_accounts` (#94, decided 2026-11-19). Redirects `/expresso` to `/plan-a-visit#services` (301) and `/prayer`, `/volunteering` to `/get-connected` (302) are on `main` (#138). The prayer form is on `/get-connected#prayer` (#140, #141): optional name, optional email or phone, required "How can we be praying for you". Delivery is only to `FORMS_PRAYER_RECIPIENT`, which production still needs set to info@thrivevineyard.com (owner, 2026-11-20).

### Still pending before launch

| Area | Status | Owner |
|------|--------|-------|
| Supabase for pre-launch use (decided 2026-11-19: the production project, no separate Preview project), env vars, staff sign-in email, form email, staff enrollment | Decided; owner provisioning (open: project state, sender address, Resend keys, Auth settings, account levels; see [owner-decisions.md](owner-decisions.md)) | Owner (#54); verification Ops (#41) |
| Ministry content, destinations, form URLs | Open decisions | Owner (#55) |
| Domain, DNS, cutover, rollback, social URLs, Ads in container | Open decisions | Owner (#57); runbook Ops (#69) |
| Photos still hot-link `thrivevineyard.com/wp-content/uploads` (P0) | Not re-hosted | Owner supplies or approves files; Experience (#59), Data (#49), guard Ops (#73) |
| Logo, favicon | Needed from owner | Owner; Experience (#56) |
| 301 redirect manifest and `/prayer`, `/expresso`, `/volunteering` rules | Decided rules are on `main` (#138). Remaining manifest rows stay pending (#55). | Ops (#62, #63) |
| End-to-end smoke tests, accessibility and performance passes | Not built | Ops (#64), Experience (#61, #67) |
| Dependency advisories | Re-triage needed: a lockfile `npm audit` on 2026-11-19 showed 6 moderate (dev-only), not the "2 critical / 7 high" recorded on 2026-11-07 | Ops (#71) |
| Seed run against the pre-launch Supabase project using audited data only | Not run; owner approval still open | Data (#39), owner approval (#54) |

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
| **v0.6.0** | **Groups + ministries** | Done (code) | 2026-11-07 | — | PR #2 | Group, outreach, ministry public routes backed by published records |
| **v0.7.0** | **Admin panel — core CRUD** | Done (code, runtime unverified) | 2026-11-07 | Server-action auth (D1), publish validation (D2) | PR #2 | Credential sign-in + CRUD for all MVP content types |
| **v0.8.0** | **Google Ads landing pages** | Done (code) | 2026-11-07 | Active Ads URL confirmation | PR #2 | `/[slug]` renders published landing-page records |
| **v0.9.0** | **SEO + WordPress migration** | In progress | — | Redirect coverage (O1), seed run, Search Console review | `docs/04-seo-url-migration-map.md` | 5 redirects + sitemap/robots done; exports parsed, not seeded |
| **v1.0.0** | **Launch** | Not started | — | — | — | First public deployment |

---

## Patch-level completed work (non-sprint)

| Version | Patch work item | Completed | Area | Notes |
|---------|---|-----------|------|---|
| **v0.1.1** | Architecture docs (00, 03, 05, 06) written | 2026-06-11 | Docs | Project brief, IA, content models, integrations |
| **v0.1.2** | Workflow docs setup from workflow-core templates | 2026-06-11 | Workflow | CLAUDE.md, AGENTS.md, execution-rules, skill-map, task-type-reference-map, context-flow |
| **v0.1.3** | Next.js project scaffold and Supabase schema | 2026-06-11 | App | All route placeholders, config files, full `supabase/schema.sql` |
| **v0.1.4** | npm audit vulnerabilities documented | 2026-06-11 | Docs | `next-mdx-remote` upgrade path in PROGRESS backlog; notes in `06-integrations.md` |
| **v0.9.1** | Draft-handoff public site, motion, sitemap, GTM, JSON-LD (#24, #25, #27, #28, #29) | 2026-11-19 | Experience/Ops | Merged to `main` after independent QA; QA caught and fixed a soft-404 regression from a route-group `loading.tsx` |
| **v0.9.2** | Carry-over PRs replaced and merged (#85, #86, #87, #89, #21); #5, #9, #14, #16, #20 closed as superseded | 2026-11-19 | Ops/Audit/PM | Senior QA review found stale or false statements in #9 (closed) and stacked-base problems in #20 |
| **v0.9.3** | Milestones M1-M5, 54 board issues, Batch field, roadmap and lane backlogs (#88, #92) | 2026-11-19 | PM | Draft cards converted to real issues; no due dates set |
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
| **v0.5.3** | CSS pipeline diagnosis | 2026-07-16 | Frontend | No active stylesheet-delivery fault found: `layout.tsx` imports `globals.css`, Tailwind 3/PostCSS config match, and the supplied button screenshot proves Tailwind output is applied. The perceived issue is the intentionally configured yellow-green `accent` palette; local dependencies are absent in the isolated worktree, so any future runtime diagnosis requires a user-run install and browser asset evidence. |
| **v0.5.4** | Dusty-rose accent palette | 2026-07-16 | Frontend | Replaced yellow-green accent tokens with `#c9828a` / `#fbf1f0`; updated the accent button hover treatment and design-system documentation. |
| **v0.5.5** | Shared UI primitives | 2026-07-16 | Frontend | Added reusable badge, input, page-header, and back-link components plus MDX-ready prose styles. |
| **v0.5.6** | Public navigation accessibility | 2026-07-16 | Frontend | Added a skip link, active-route states, mobile keyboard and scroll handling, reduced-motion styles, and an admin-safe public site shell. |
| **v0.5.7** | Content-card consistency | 2026-07-16 | Frontend | Standardized event, sermon, and series-card media hierarchy; replaced raw images with optimized image components and added YouTube thumbnail support. |
| **v0.5.8** | Public page foundations | 2026-07-16 | Frontend | Replaced unstyled top-level placeholder routes with shared page headers and intentional no-content states without fabricating ministry details. |
| **v0.5.9** | Public detail page foundations | 2026-07-16 | Frontend | Applied the shared page shell to team, group, outreach, and pending landing-page routes while preserving route safeguards and avoiding invented content. |
| **v0.6.0** | Homepage editorial refresh | 2026-07-16 | Frontend | Standardized editorial labels and event CTAs, and removed fabricated hub-card copy in favor of approved dynamic summaries or intentional temporary states. |
| **v0.6.1** | UI rollout governance | 2026-07-16 | Frontend | Applied shared MDX prose styling to Plan a Visit. No URLs changed, so no redirects were added; no build, dev, test, or compile command was run under project rules. |
| **v0.8.1** | MVP foundation (PR #2, Codex) | 2026-11-07 | Full stack | Migration prep, admin auth + CRUD, public record routes, event filters + iCal, redirects/sitemap/robots, roadmap + handoff docs (`docs/08`, `docs/09`). Seed not run; DB state unverified. |
| **v0.8.2** | Multi-agent workflow v2 (PR #1, Claude) | 2026-11-07 | Workflow | `.agents/skills` (product-manager, lane-builder, scribe, senior-qa), lanes + worktree rules, model routing, `scripts/agents/{worktree,gate}.sh`, CI gate, PR template. Gate-before-push replaces "no verification runs". |
| **v0.8.3** | Owner church photos and Thrive Flames (#125, #126) | 2026-11-19 | Experience | Local WebP set on the home hub, kids hero, and About gallery; `/thrive-flames` uses the live page's copy. Gate PASS at `ace6160`. |
| **v0.8.3** | Session 2 Experience and Ops docs | 2026-11-19 | Experience, Ops | Squash-merged #115, #110, #107, #106, #109, #116 after MERGE verdicts and green gates. Issues #34, #36, #38 and #68 closed. #30 and #70 stay open. Data stack, #101 seed, #103 DNS draft, and Ops #41/#62/#73 stay unmerged. |
| **v0.8.4** | Live database reconciliation and seed rails (#108; #101, absorbs #39) | 2026-11-19 | Data | `npm run seed -- --dry-run` reconciliation, host and fingerprint confirmations, post-write verification, generated seed SQL for the MCP. Seed and batch A were applied to live under the owner's go before merge; ledger row added. Three rounds of QA (GPT, Gemini, Claude). Gate PASS on `main` at `a8d8be0`. |
| **v0.8.5** | Data stack through the revalidation helper | 2026-11-20 | Data | Squash-merged #15, #18, #23, #95, #114, #90, #96, #120, #122 after rebases and full gates. Role, publication-event, and publish-guard migrations were already on the live project. |
| **v0.8.6** | Dependency triage and system actors (#132, #133) | 2026-11-20 | Ops, Data | Lockfile audit reports no vulnerabilities. Dependabot stays a written proposal. System actors and the INSERT guard are on `main`; the live migration `system_actors` was applied first. |
| **v0.8.7** | Seed publishing, reserved slugs, redirects, church mark (#137, #136, #138, #134) | 2026-11-20 | Data, Experience, Ops | Seed SQL publishes as the seed actor; the new SQL file is not applied live. Public landing pages use the shared reserved-slug list. Decided redirects are active. Nav mark and both pastors are on the home and About pages. |
| **v0.8.8** | Prayer form and seed publish skip (#141, #140) | 2026-11-20 | Data, Ops | Prayer requests use their own inbox env key. `seed-current` skips rows with publication history. `/prayer` redirects to `/get-connected#prayer`. |

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
