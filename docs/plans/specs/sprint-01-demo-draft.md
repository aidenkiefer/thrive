# Sprint 01 — Demo Draft (v0.2 → v0.4 slice)

**Goal:** A locally runnable, visually polished demo of the Thrive Vineyard redo — real migrated content, design system, homepage, sermons, events, and one MDX page.

**Target milestone overlap:** v0.2.0 (data layer) + v0.3.0 (public shell) + v0.4.0/v0.5.0 (sermons + events slice)

**Out of scope this sprint:** Admin CRUD, auth login UI, full WordPress migration, SEO redirects, landing pages, groups/ministries depth, podcast/Mailchimp embeds.

---

## Demo definition of done

A stakeholder can run `npm run dev` with `.env.local` configured and see:

1. **Branded shell** — navy/sage design tokens, Fraunces + Inter, sticky nav, footer with contact info
2. **Homepage** — hero, service times, latest sermon, upcoming events, announcement strip (from Supabase)
3. **Sermons** — `/sermons` archive + `/sermons/[slug]` detail with YouTube embed (104 imported sermons)
4. **Events** — `/events` listing + `/events/[slug]` detail for one-time events; recurring events show next occurrence
5. **Plan a Visit** — `/plan-a-visit` MDX page with content sourced from live `/im-new/` audit (no invented ministry data beyond audit)
6. **Data** — seed imported from `migration-files/parsed/*.json` into Supabase

---

## Human prerequisite (before agent tickets)

**Owner: Aiden** — cannot be done by agent without credentials.

1. Create Supabase project (or use existing)
2. Copy `.env.local.example` → `.env.local` with real keys
3. Apply `supabase/schema.sql` via dashboard SQL editor (re-apply after T01 schema patch)
4. Confirm `npm run dev` starts without env errors

Agent tickets assume `.env.local` exists. If not, stop at T01 and wait.

---

## Architecture invariants (do not violate)

| Rule | Source |
|------|--------|
| No Supabase client in React components | CLAUDE.md |
| Public data via Server Components + `src/lib/supabase/server.ts` | execution-rules |
| Admin writes use service role — never in browser | 06-integrations |
| Never invent ministry data — use parsed JSON or audit docs | floorplan.md |
| Edit only Allowed Files per ticket | ticket-template |
| ISR `revalidate = 60` on dynamic entity pages | 03-information-architecture |

---

## Sprint phases & ticket order

```
Phase A — Data foundation
  T01  Schema patch (topics, service_type, venue)
  T02  Query layer (src/lib/queries/)
  T03  Seed import script + sample announcements/groups

Phase B — Design system & shell
  T04  Tailwind tokens + fonts + globals.css
  T05  Core UI primitives (Button, Card, Section, Container, Heading)
  T06  GlobalNav + Footer + root layout

Phase C — Public demo pages
  T07  Homepage sections (Supabase-backed)
  T08  Sermons archive + detail
  T09  Events listing + detail
  T10  MDX renderer + plan-a-visit page
```

**Parallelization:** T04 can start after T01 is spec'd (no code dep). T05 depends on T04. T07–T10 depend on T02 + T03 + T06.

**Recommended agent sessions:**
- Session 1: T01 → T02 → T03 (data-agent / backend-agent)
- Session 2: T04 → T05 → T06 (frontend-agent)
- Session 3: T07 → T08 (frontend + backend)
- Session 4: T09 → T10 (frontend-agent)

---

## Schema changes (T01)

Add to `supabase/schema.sql`:

```sql
-- sermons
ALTER ... ADD topics text[];
ALTER ... ADD service_type text DEFAULT 'Sunday Service';

-- recurring_events + one_time_events
ALTER ... ADD venue text;  -- e.g. Sanctuary, Cafe
```

Regenerate `src/lib/supabase/types.ts` after apply.

---

## Seed strategy (T03)

| Source JSON | Target table | Notes |
|-------------|--------------|-------|
| `parsed/speakers.json` | `speakers` | 12 rows |
| `parsed/sermon_series.json` | `sermon_series` | 20 rows |
| `parsed/sermons.json` | `sermons` | 104 rows; map speaker/series slugs → UUIDs |
| `parsed/recurring_events.json` | `recurring_events` | 18 rows |
| `parsed/one_time_events.json` | `one_time_events` | 46 rows; only future or demo subset optional |
| Hand-written seed | `announcements`, `groups`, `outreach` | 2–3 rows each for homepage — from audit, not invented |

**Occurrences:** Generate next 8 weeks of `event_occurrences` for `family-worship-service` and 1–2 other recurring events only (not all 18 in demo).

**Media URLs:** Keep WordPress/YouTube URLs as-is for demo; re-hosting is a later sprint.

---

## Design system (T04–T05)

Implement tokens from `docs/07-design-system.md`:

- Colors: `brand-800` `#183d59`, `accent-400`, `neutral-*`
- Fonts: Fraunces (display) + Inter (sans) via `next/font`
- Components: minimal set — no shadcn install unless T05 ticket explicitly adds it

**Motion:** Subtle only — `transition-colors` on buttons/links; optional fade-in on hero (CSS, no heavy animation libs).

---

## Page specs

### Homepage (T07)

| Section | Data source |
|---------|-------------|
| Hero | Static copy from audit tagline + CTA → `/plan-a-visit` |
| Service times | Static MDX/constants (8:30 Express(o), 9:30 Family Worship — note renovation pause) |
| Featured announcement | `announcements` where `is_homepage_feature = true` |
| Upcoming events | Next 4 from `one_time_events` + `event_occurrences` |
| Latest sermon | Most recent `sermons.preached_at` |
| Kids & Youth / Groups / Outreach | 3–4 cards from seed tables |
| Newsletter | Placeholder block linking to Mailchimp URL from audit (link only, no embed yet) |

### Sermons (T08)

- `/sermons` — grid of sermon cards, filter by series (client filter OK in small client component)
- `/sermons/[slug]` — title, speaker, date, scripture, topics, YouTube embed
- `/sermons/series` — list series with sermon counts (simple)

### Events (T09)

- `/events` — upcoming one-time + next occurrences grouped by month
- `/events/[slug]` — resolve one-time OR recurring by slug; show ChurchSuite CTA if URL present

### Plan a Visit (T10)

- Upgrade `next-mdx-remote` v5 → v6 before MDX render
- Content from `01-current-site-audit.md` `/im-new/` section — 5 steps, service comparison, kids check-in
- ChurchSuite visitor form → link/button to external URL (not iframe in v1 demo)

---

## Skill packs by phase

| Phase | Layer 1 | Layer 3 |
|-------|---------|---------|
| A | `executing-plans` | `postgres-best-practices`, `backend-dev-guidelines` |
| B | `executing-plans` | `frontend-design`, `tailwind-patterns`, `react-best-practices` |
| C | `executing-plans`, `verification-before-completion` | `nextjs-app-router-patterns`, `frontend-design`, `seo` (metadata only) |

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| No Supabase project yet | Human prerequisite block; T03 documents manual apply steps |
| 41 stale audio URLs | Demo uses YouTube only; audio optional |
| Empty descriptions on recent sermons | Cards show title/date/speaker; video embed is primary |
| 16 uncategorized events | Import with `category: null`; display "Event" fallback |
| Slug collisions | Seed script uses `ON CONFLICT` or skips duplicates |

---

## Post-sprint (Sprint 02 backlog)

- Admin login + dashboard stub (v0.7.0 slice)
- Full recurring occurrence expansion
- Groups + outreach detail pages
- Media re-host to Supabase Storage
- 301 redirects from `legacy_permalink` fields
- Mailchimp embed on homepage

---

## Ticket index

| ID | File | Phase |
|----|------|-------|
| T01 | `tickets/01-schema-patch-topics-venue.md` | A |
| T02 | `tickets/02-query-layer.md` | A |
| T03 | `tickets/03-seed-import-script.md` | A |
| T04 | `tickets/04-design-tokens-fonts.md` | B |
| T05 | `tickets/05-core-ui-components.md` | B |
| T06 | `tickets/06-global-nav-footer-layout.md` | B |
| T07 | `tickets/07-homepage-sections.md` | C |
| T08 | `tickets/08-sermons-archive-detail.md` | C |
| T09 | `tickets/09-events-listing-detail.md` | C |
| T10 | `tickets/10-mdx-plan-a-visit.md` | C |

---

## Spec summary (for agent sessions — copy at session start)

Thrive demo sprint: Supabase-backed Next.js 15 site with navy/sage design system, migrated sermons (104) and events (64 parsed), homepage pulling announcements/events/latest sermon, sermons archive+detail with YouTube, events list+detail, plan-a-visit MDX. Schema adds `topics`, `service_type`, `venue`. Seed from `migration-files/parsed/`. No Supabase in client components; ISR 60s; never invent ministry data. Human must provision Supabase + `.env.local` first.
