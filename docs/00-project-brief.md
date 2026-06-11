# 00 — Project Brief

## Vision

Thrive Vineyard's new website is not a redesign. It is a migration from a collection of manually maintained WordPress pages to a **centralized ministry information platform**.

Every ministry, group, event, sermon series, announcement, and outreach initiative exists as a single canonical entity. The website generates multiple views of that entity — event calendar, homepage feature, landing page, search result, Google Ads destination — rather than requiring staff to maintain the same information in multiple places.

Updating one record updates everything.

---

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
| Phased launch | No hard deadline — ship core functionality first, layer in complexity |
| Developer-primary editing | Aiden is the primary content editor; staff get custom-built admin interfaces for time-sensitive content |
| Domain migration | Existing WordPress site lives on the same domain — URL structure changes require 301 redirects |
| SEO audit needed | Google Search Console data must be reviewed before URL structure is finalized |

---

## What Is Not in Scope (Yet)

- Design system / visual identity decisions
- Content migration from WordPress (a separate later phase)
- Full SEO URL mapping (depends on Search Console audit)
- ChurchSuite deep integration (forms only for now)

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
| Forms / signups | ChurchSuite (embed URLs only) | No sync needed; ChurchSuite owns registration data |
| Hosting | Vercel | Native Next.js support, free tier, ISR support |

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
