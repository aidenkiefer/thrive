# Thrive Vineyard Website — Architecture Planning Session

**Date:** 2026-06-09 (updated 2026-06-11)
**Status:** In Progress — content model presented, pending confirmation before writing spec

---

## What We're Building

A new website for Thrive Vineyard church. The goal is not a redesign — it's a **migration to a centralized content platform** where every ministry, group, event, sermon series, and announcement exists as a single canonical entity that is referenced everywhere, rather than duplicated across pages.

The source of truth for the overall vision is `floorplan.md` at the root of this project.

---

## Core Architectural Principle

Every church activity lives once in the system. A single record for, say, "Holy Spirit Night" automatically generates:

- An event calendar entry
- A homepage announcement
- A groups page card
- An SEO landing page
- A Google Ads destination
- A signup form destination

Updating one record updates all views.

---

## Decided: Technology Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Static pages | MDX files in `/content/pages` |
| Dynamic content | Supabase (Postgres) |
| Admin panel | Custom `/admin` routes in Next.js, protected by NextAuth |
| External integration | ChurchSuite (forms/signups only — not a data source) |
| Hosting | Vercel (free tier) |
| Database | Supabase (free tier) |

**Key decisions and reasons:**

- No headless CMS (Sanity, Keystatic, Payload) — the developer (Aiden) is the primary editor, and he wants to build custom admin interfaces anyway. A pre-built CMS would be overhead around constraints rather than a benefit.
- Supabase chosen over repo-based data files because content (especially sermons and events) needs to update without a deploy. File-based saves trigger a 30–60s Vercel build; Supabase is instant.
- ChurchSuite is forms/signups only. No data sync needed — when an entity needs a signup form, it embeds a ChurchSuite URL.
- Active Google Ads campaigns mean landing pages need to be creatable by staff quickly — confirmed when asked.

---

## Decided: Site Structure

### Primary Navigation

```
Plan a Visit
Watch & Listen
Events
Groups
Kids & Youth
Outreach
About
Give
```

### Homepage Sections

```
Hero
Service Times
Plan Your Visit
Current Featured Announcement
Upcoming Events
Latest Sermon
Kids & Youth
Groups
Outreach Opportunities
Newsletter Signup
Footer
```

---

## Content Model (Supabase Tables) — Presented, Pending Confirmation

### Sermon system

```
sermons         — individual sermon records
sermon_series   — named series (one series → many sermons)
speakers        — pastor/guest speaker profiles
```

### Events

```
recurring_events    — canonical entity (Holy Spirit Night, Youth Alpha, etc.)
event_occurrences   — specific dated instances generated from a recurring event
one_time_events     — standalone events not part of a series
```

### Groups & Ministries

```
groups       — small groups, connect groups, etc.
ministries   — ministry teams (worship, children's, etc.)
```

### Other dynamic content

```
announcements   — time-bounded site-wide notices
staff           — staff/team member profiles
landing_pages   — custom pages for Google Ads or campaigns
outreach        — outreach initiatives and volunteer opportunities
```

### Universal fields on every table

`slug`, `seo_title`, `seo_description`, `og_image_url`, `published_at` (drafts stay unpublished), `created_at`

### Key relationships

- `sermons` → belongs to a `speaker`, optionally belongs to a `sermon_series`
- `event_occurrences` → belong to a `recurring_event` (recurring event is the source of truth)
- `landing_pages` → can reference any entity (group, event, sermon series) as its subject

### What stays as MDX (not in Supabase)

Pages that rarely change and benefit from git tracking: About, Plan a Visit, Kids & Youth, Outreach hub, Give

---

## Planned Docs Directory

The floorplan calls for a `/docs` directory with these files:

```
docs/
  00-project-brief.md
  01-current-site-audit.md
  02-content-inventory.md
  03-information-architecture.md
  04-seo-url-migration-map.md
  05-content-models.md
  06-integrations.md
  07-design-system.md
  08-ai-agent-rules.md
```

None of these are written yet — they come after the brainstorm is complete.

---

## Session Progress

Brainstorming sections being walked through:

- [x] Section 1 — Tech Stack & Architecture (confirmed by user)
- [x] Section 2 — Content Model (presented, awaiting confirmation)
- [ ] Section 3 — URL Structure & Routing
- [ ] Section 4 — Admin Panel design
- [ ] Section 5 — SEO migration approach
- [ ] Section 6 — Google Ads landing page strategy

After all sections confirmed:
- [ ] Write design spec doc
- [ ] Self-review spec
- [ ] User reviews spec
- [ ] Transition to `superpowers:writing-plans` for implementation plan

---

## Answered: Clarifying Questions

1. **Who edits content?** → Mix — staff + developer. Developer (Aiden) is primary, but wants staff admin interfaces.
2. **ChurchSuite depth?** → Forms/signups only. Not a data source.
3. **WordPress export?** → Not yet, but admin access exists. Will pull during migration phase.
4. **SEO priority?** → Not sure which URLs matter most. Need Google Search Console audit before finalizing URL structure.
5. **Launch deadline?** → Phased rollout — get something live, improve over time.
6. **Google Ads?** → Active campaigns, need landing pages ready.

---

## SEO Notes

- Domain authority and backlinks stay with the domain when migrating
- Page-level SEO (meta titles, descriptions, ranked URLs) does NOT transfer automatically
- Need Google Search Console report to identify high-traffic URLs before finalizing URL structure
- `04-seo-url-migration-map.md` will track old URL → new URL mappings and redirect needs
- 301 redirects are the mitigation for any URL structure changes
