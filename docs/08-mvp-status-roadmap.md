# Thrive Vineyard Website — MVP Status & Roadmap

**Assessment date:** November 6, 2026  
**MVP target:** November 13, 2026  
**Evidence reviewed:** repository source and docs, current migration outputs, and the two refreshed exports supplied for this review. No build, test, seed, database, or browser run was performed; statuses below describe inspected implementation, not runtime validation.

## Executive status

**Snapshot note:** The status table and roadmap below record the codebase as assessed on November 6, 2026. Implementation updates through November 7 are listed under [Progress since assessment](#progress-since-assessment).

The rebuild has a real Next.js/Supabase foundation and functioning-looking server-rendered paths for sermons, events, and homepage data. It is not launch-ready yet. Most urgent: the fresh exports are not connected to the existing importer, admin authentication cannot authenticate anyone, admin pages are placeholders, several public routes are placeholders, and the SEO redirect map is not implemented.

| Area | Status | Evidence / consequence |
|---|---|---|
| Next.js and Supabase foundation | **Implemented in code; runtime unverified** | App Router, server/client Supabase helpers, schema, query modules, and seed script exist. The progress log still lists a Supabase project/schema setup as a human prerequisite. |
| Canonical entity model | **Partially implemented** | Separate event, occurrence, sermon, group, outreach, announcement, and landing-page tables exist. Landing pages can refer to canonical entities. Content seeding and front-end cross-surface reuse are incomplete. |
| Sermon archive and series | **Implemented in code; data refresh pending** | Archive, detail, series list/detail, metadata, and YouTube player paths exist. No topic, speaker, Bible-book, or service-type archive routes/filters were found. |
| Event calendar and details | **Partially implemented** | Upcoming event and detail queries/components exist, including recurring occurrence support. Month/year filters, list/tile switching, calendar export, and share controls documented in the live-site audit are not represented in the inspected page implementation. |
| Homepage | **Partially implemented** | Hero, service times, featured announcement, events, latest sermon, hub cards, and newsletter components are wired to queries. Some sections are conditional or empty when the database has no records; live editorial content and multiple-item carousel behavior are not migrated. |
| Structural pages | **Partial** | `/plan-a-visit` is MDX-backed with one content file. About/team and several other public routes contain temporary copy or shells. |
| Admin and authentication | **Not usable** | Middleware redirects unauthenticated `/admin/**` requests, but the credentials provider always returns `null`; login UI and CRUD screens are TODO placeholders. This blocks staff editing and admin access. |
| Export/import coverage | **Stale; refreshed files not integrated** | The parser reads `migration-files/events.xml` and `sermons.xml`. Existing parsed JSON and inventory describe the older June exports. The fresh MEC export is JSON and the fresh WXR contains 120 published sermons; neither replaces the parser’s current inputs automatically. |
| SEO migration | **Not launch-ready** | `next.config.ts` has no redirects; `docs/04-seo-url-migration-map.md` is still a draft awaiting Search Console and Ads URL review. No sitemap or robots implementation was found. |
| Integrations and forms | **Partial / unresolved** | ChurchSuite URL fields exist, but the site audit says the current signup/contact forms use Gravity Forms; Mailchimp, podcast, GTM, and Ads preservation still need explicit implementation decisions and checks. |

## What the refreshed exports contain

These are observations from the supplied files in `C:\Users\Aiden\Desktop\church\migration-files`; they were inspected in place and were not copied over the repository’s older source files.

| Export | Observed coverage | Migration implication |
|---|---|---|
| `mec-events-20261107UTC0059.json` | 80 records; all have `post_status=publish`; 25 recurring and 55 non-recurring; no missing `mec_start_date`; 80 legacy permalinks; 73 featured-image URLs; 63 category-bearing records. Dates span May 2, 2024 to December 5, 2026. | Current parser does not read this JSON shape. Build a JSON adapter that preserves MEC dates, repeat settings, locations, categories, status, external signup/read-more URL, images, and source permalink. Distinguish event status from date-derived past/upcoming state. |
| `thrivevineyardchurch.wordpress.2026-11-07.xml` | WordPress WXR with 181 items: 122 `wpfc_sermon` records (120 published, one private sample, one draft) and 59 attachments. It contains no ordinary page or post records. | Sermon import must filter to published records and retain attachment/media references needed by sermons. This is not a full page-content export; the site audit remains the source for page inventory until a page export is supplied. |

The repo’s present parser consumes the older `migration-files/events.xml` and `migration-files/sermons.xml`; `docs/02-content-inventory.md` reports 64 events and 104 usable sermons. The checked-in parsed outputs and report are therefore a baseline, not evidence that the November exports have been imported. Do not seed from the stale outputs and call the data migration complete.

## Progress since assessment

As of November 7, 2026, the feature branch includes:

- Current export conversion, updated parsed outputs, 43 future occurrences across eight recurring events, and an exception report. Express(o) remains held for editorial schedule review.
- A guarded seed command for the reviewed export pair, with no hand-authored placeholder rows or duplicate-prone fallback inserts. It has not been run against Supabase; schema updates still need applying and shared database state remains unverified.
- Credential-based admin access plus create/edit/publish controls for announcements, sermons, one-time and recurring events, event occurrences, groups, outreach, staff profiles, and campaign landing pages.
- Public group and outreach routes backed by published canonical records; campaign routes render published landing page records.
- Confirmed legacy redirects, sitemap and robots routes, Chicago-local event display, month and grid/list event filters, and an iCalendar download.
- A clean install and production build passed before each feature-branch push. Vercel Preview deploys still need their environment variables configured.

Still open before a launch candidate: apply and review the database schema changes, run a safe data import, resolve the Express(o) schedule, complete visitor-facing content and forms, confirm Search Console and active Ads destinations, and review production configuration. The later copy/content migration remains a separate pass.

## Canonical architecture guardrails

- Keep each ministry, event, sermon, group, outreach initiative, and announcement as one canonical record. Homepage cards, archive rows, event detail pages, and campaign pages should read from that record.
- Keep one-time event dates distinct from recurring event definitions and their concrete `event_occurrences`.
- Root-level ad/campaign pages should link to a canonical event, group, or ministry when they represent one; avoid duplicating event facts into independent landing-page copy.
- ChurchSuite remains a forms-only destination per `AGENTS.md`; do not add API synchronization.
- Do not invent ministry content or contact details to fill missing export coverage.

## Prioritized implementation plan

Order is set to make a reviewable launch candidate by **Friday, November 13, 2026**. Each phase should end with a human-reviewed result before the next depends on it.

### P0 — Establish a trustworthy launch dataset (Nov 6–8)

1. Add a repeatable importer for the current MEC JSON and refreshed WXR. Make source paths/config explicit; keep original exports untouched. Filter WXR to published sermons and report excluded private/draft entries.
2. Map source IDs, slugs, publish dates, sermon speaker/series/scripture/topics/media fields, event recurrence, dates, venue/location, category, external signup links, legacy permalinks, and media references into the canonical schema. Record unmapped values and collisions in a migration report.
3. Reconcile the event schema and seed types against real MEC fields. Preserve Chicago-local wall time and handle daylight-saving offsets correctly; the older parser’s fixed `-05:00` offset is not safe year-round.
4. Compare imported totals and a representative record sample with both exports. Confirm the target Supabase project, apply the current schema, and import only after the mapping report is reviewed.

**Exit evidence:** a dated import report showing 120 published sermons and 80 events accounted for, each skipped/exception record explained, no unintended duplicate slugs, and media/link coverage summarized. No production data write is implied by this roadmap.

### P1 — Protect public URLs and essential page coverage (Nov 8–10)

1. Finalize redirects from the existing SEO map using current WordPress URLs, refreshed sermon/event slugs, Google Search Console exports, and active Google Ads destination URLs. Implement tested permanent redirects in `next.config.ts`, including `/upcoming-events/:slug`, `/im-new`, `/teaching`, taxonomy routes, and root campaign slugs as appropriate.
2. Add canonical metadata and social metadata for public routes; generate sitemap and robots behavior from the public routes and published canonical records.
3. Complete the minimum content for required visitor-facing pages: about/team, groups, kids/youth, give, outreach, and campaign/landing destinations. Choose explicit redirects or real route content for legacy pages with no direct replacement.
4. Restore the live signup paths with confirmed Gravity Forms destinations or another explicitly selected form path. Keep ChurchSuite links only where the source workflow actually uses ChurchSuite.

**Exit evidence:** a reviewed old→new URL table with no high-value live or Ads URL unaccounted for; required pages resolve to useful content; no active route ends in placeholder copy; sitemap includes intended public canonical pages.

### P2 — Make the minimum staff workflow usable and safe (Nov 10–12)

1. Implement a real NextAuth sign-in path with configured secrets and a verified admin identity policy. Keep middleware protection on every `/admin/**` route except login; verify unauthorized access redirects and authorized access works.
2. Build the smallest useful CRUD path for announcements, one-time/recurring events, and sermons, including publish state and required relationships. Reuse canonical records for public displays.
3. Add validation and clear success/error feedback. Prevent incomplete dates or broken relationships from publishing; preserve a safe path for correcting imported data.
4. Defer drag-reordering, richer dashboards, and nonessential admin sections if they threaten launch-critical CRUD and safety.

**Exit evidence:** an authorized editor can sign in, create/update/unpublish the MVP content types, see the change on the matching public view, and an unauthenticated visitor cannot enter admin pages.

### P3 — Release readiness (Nov 12–13)

1. Review the full public route list, redirect list, real mobile layouts, keyboard navigation, and empty/error states in a browser.
2. Verify service schedule, contact details, giving paths, forms, images, video/audio links, tracking IDs, and Ads conversions against approved live sources.
3. Confirm database access policies, production environment values, deployment/domain configuration, and rollback approach. Ensure no secrets are committed or exposed in client code.
4. Publish only after the church approves the content, redirect map, and launch checklist.

**Exit evidence:** reviewed launch checklist, successful production candidate review, known issues assigned or explicitly deferred, and a rollback path.

## MVP scope decisions

**Must ship:** refreshed sermon and event data; public sermon/event archives and details; core home/visitor/about/contact/giving paths; high-value redirects and active Ads URLs; metadata and sitemap; working protected admin access for the minimum time-sensitive content; verified forms and deployment configuration.

**Can follow after MVP if schedule is tight:** advanced calendar filter/view controls, calendar export/share, sermon taxonomy archive pages, full staff and outreach CRUD, drag-to-reorder, podcast RSS integration, multi-item announcement carousel, internal communications workflow, and media re-hosting beyond what is required for stable public media URLs.

## Open decisions and risks

- **Forms:** current WordPress uses Gravity Forms for most signup/contact flows, while the planned model often assumes ChurchSuite URLs. Confirm form destinations and ownership before copying links or rebuilding forms.
- **Page export:** the refreshed WXR has sermon posts and attachments only. Page content, root campaign pages, and some URL inventory still need a separate source review; the June site audit is not a substitute for current Search Console data.
- **Admin authentication:** selected provider and account policy are undecided in `docs/06-integrations.md`; this is a launch blocker if staff must manage content at launch.
- **Supabase state:** source docs say the project/schema/import still require setup. This assessment did not connect to Supabase or inspect environment secrets, so database readiness is unknown.
- **Time:** one week is tight for importing and reviewing data, finishing several public routes, SEO redirects, production setup, and secure CRUD. Keep the must-ship scope narrow and make explicit deferrals early.

## Source references

- Architecture and canonical entity principle: `docs/00-project-brief.md`, `docs/03-information-architecture.md`, `docs/05-content-models.md`
- Live site and integrations audit: `docs/01-current-site-audit.md`, `docs/06-integrations.md`
- SEO map: `docs/04-seo-url-migration-map.md`; current redirect stub: `next.config.ts`
- Existing importer and data baseline: `migration-files/parse-export.py`, `migration-files/parsed/`, `migration-files/README.md`, `docs/02-content-inventory.md`
- Public pages and data access: `src/app/(public)/`, `src/app/page.tsx`, `src/lib/queries/`
- Admin and access control: `src/app/admin/`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`
- Existing progress record: `docs/plans/PROGRESS.md` (contains earlier status claims and prerequisites; this assessment is based on current code inspection and the refreshed exports above).
