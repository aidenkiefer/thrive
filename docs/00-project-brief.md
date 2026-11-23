# 00 — Project Brief

## Vision

Thrive Vineyard's new website is not a redesign. It is a migration from a collection of manually maintained WordPress pages to a **centralized ministry information platform**.

Every ministry, group, event, sermon series, announcement, and outreach initiative exists as a single canonical entity. The website generates multiple views of that entity — event calendar, homepage feature, landing page, search result, Google Ads destination — rather than requiring staff to maintain the same information in multiple places.

Updating one record updates everything.

---

## Current owner direction (2026-11-22)

Use managed/hosted services to reduce application runtime, bespoke code and ongoing maintenance. Favor suitable free allowances until a paid option is justified; do not accept a large custom maintenance burden merely to avoid a modest necessary service cost. Major technical/design/product changes and paid commitments go to the owner.

Design and verify for **more than 1,000 concurrent website visitors**, primarily a regional audience within about 60 miles. Define realistic browsing, signup and cache assumptions; geography and account quotas alone do not demonstrate capacity. Preserve the current stack and accepted #144 redesign.

Google Forms/Sheets owns signup collection/review for MVP; Thrive links to the provider rather than duplicating responses. Native feedback/prayer remain email-only. Keep committed media plus dashboard-managed Supabase Storage images; no custom uploader for MVP. Weekly encrypted GitHub Actions -> private R2 backups retain ten verified snapshots with restore and freshness checks. See the [dated decision/tradeoff record](plans/specs/2026-11-22-managed-services-tradeoffs.md) for evidence and remaining configuration checks.

## Goals

- Eliminate duplicated content across the site
- Reduce manual maintenance workload for staff
- Preserve domain authority and existing SEO equity
- Enable staff to manage time-sensitive content (events, announcements) without a deployment
- Support Google Ads campaigns with staff-creatable landing pages
- Create a codebase that a single developer can maintain and extend

---

## Constraints

| Constraint | Detail |
|---|---|
| Active Google Ads | Campaigns are live and pointing to pages that must exist on the new site |
| Phased launch | Approved/tested MVP readiness target Wednesday November 25; domain cutover requires a separate owner go |
| Developer-primary editing | Aiden is the primary content editor; staff get custom-built admin interfaces for time-sensitive content |
| Domain migration | Existing WordPress site lives on the same domain — URL structure changes require 301 redirects |
| SEO audit needed | Google Search Console data must be reviewed before URL structure is finalized — draft redirect map started in `04-seo-url-migration-map.md` |
| Live site audit done | WordPress crawl complete (2026-06-20) — see `01-current-site-audit.md`; ~103 sermons, ~62 events to migrate |
| Active Google Ads | Campaigns live with conversion ID `AW-16575196430`; landing page URLs must be preserved through migration |

---

## Deferred from MVP

- Custom native signup builder, in-app signup response dashboard, response synchronization and custom detailed-email/export-control automation.
- Custom staff media upload interface (use dashboard-managed storage initially).
- CMS draft/version preview and previous-version restore (#32/#33); secure core editing and database recovery remain required.
- Podcast integration while paused; advanced sermon search/calendar month-grid remains post-launch.
- A stack rewrite or another redesign. The existing implementation and accepted #144 design are the baseline.

---

## Tech Stack Summary

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js App Router + TypeScript | SEO-first, full-stack, Vercel native |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Database | Supabase (Postgres) | Free tier, TypeScript SDK, instant updates without deploys |
| Static pages | MDX files in `/content/pages` | Structural pages change rarely, benefit from git tracking |
| Admin panel | Custom `/admin` Next.js routes | No CMS overhead; full control over staff interfaces |
| Auth | NextAuth.js | Admin panel protection |
| Forms / signups | Google Forms/Sheets (approved hosted links/embeds) | Provider owns collection and response review; no custom signup subsystem or response sync for MVP. ChurchSuite giving remains unchanged. |
| Hosting | Vercel | Retain existing deployment; verify actual plan/quotas and measured cache/load behavior instead of assuming a free capacity guarantee |

**Why no headless CMS (Sanity, Keystatic, Payload):**
The developer is the primary editor and is building custom staff admin interfaces anyway. A pre-built CMS adds cost, constraints, and complexity without meaningful benefit at this scale. Supabase gives instant updates, full schema control, and $0 to start.

---

## Architectural Principle

Every entity has one canonical record. Display locations (calendar, homepage, landing page, Google Ads destination) are generated views of that record — not separate content entries.

```
Holy Spirit Night (recurring_event record)
├── /events/holy-spirit-night         ← canonical event page
├── Homepage → Upcoming Events block  ← pulled from same record
├── /events calendar                  ← pulled from event_occurrences
└── /holy-spirit-night                ← Google Ads landing page referencing same record
```

---

## Source of Truth

- **Architecture decisions:** this docs folder
- **Vision and AI rules:** `floorplan.md` at the project root
- **URL migration:** `04-seo-url-migration-map.md` (written after Search Console audit)
