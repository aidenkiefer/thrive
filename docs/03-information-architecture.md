# 03 — Information Architecture

## Primary Navigation

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

---

## Full URL Structure

### Public Routes

#### Homepage
```
/                           Homepage
```

#### Plan a Visit (MDX)
```
/plan-a-visit               Service times, what to expect, location
```

#### Watch & Listen (Sermons)
```
/sermons                    Sermon archive — latest + all series
/sermons/[slug]             Individual sermon
/sermons/series             All sermon series
/sermons/series/[slug]      Individual series + its sermons
/sermons/speakers/[slug]    Speaker archive (optional — can be omitted from nav)
```

#### Events
```
/events                     Events listing — upcoming recurring + one-time
/events/[slug]              Individual event page (works for both recurring and one-time)
```

#### Groups
```
/groups                     Groups listing
/groups/[slug]              Individual group page
```

#### Kids & Youth (MDX)
```
/kids-youth                 Kids & Youth hub
```

#### Outreach
```
/outreach                   Outreach hub (MDX — describes the mission)
/outreach/[slug]            Individual outreach initiative
```

#### About
```
/about                      About page (MDX)
/about/team                 Staff/team listing
/about/team/[slug]          Individual staff member (optional)
```

#### Give (MDX)
```
/give                       Giving page
```

#### Ministries (not in primary nav, but exist as canonical entities)
```
/ministries/[slug]          Ministry landing page
```

#### Google Ads Landing Pages
```
/[slug]                     Catch-all for landing pages — checked after all named routes
```

Landing pages live at the root level for clean, short URLs suitable for ad campaigns (e.g., `/holy-spirit-night`, `/youth-alpha`, `/connect`). Next.js resolves named routes first; the catch-all only fires if no named route matches.

---

### Admin Routes (protected by NextAuth)

```
/admin                          Dashboard — recent activity, quick stats
/admin/sermons                  Sermon list
/admin/sermons/new              New sermon form
/admin/sermons/[id]/edit        Edit sermon
/admin/series                   Series list
/admin/series/new               New series
/admin/series/[id]/edit         Edit series
/admin/events                   Events list (recurring + one-time tabs)
/admin/events/new               New event
/admin/events/[id]/edit         Edit event + manage occurrences
/admin/groups                   Groups list
/admin/groups/new               New group
/admin/groups/[id]/edit         Edit group
/admin/announcements            Announcements list
/admin/announcements/new        New announcement
/admin/announcements/[id]/edit  Edit announcement
/admin/staff                    Staff list + ordering
/admin/staff/[id]/edit          Edit staff member
/admin/landing-pages            Landing pages list
/admin/landing-pages/new        New landing page (for Google Ads)
/admin/landing-pages/[id]/edit  Edit landing page
/admin/outreach                 Outreach initiatives list
/admin/outreach/new
/admin/outreach/[id]/edit
```

---

## Page Type Classification

| Route pattern | Type | Source |
|---|---|---|
| `/` | Dynamic | Supabase (pulls announcements, events, latest sermon) |
| `/plan-a-visit` | MDX | `/content/pages/plan-a-visit.mdx` |
| `/sermons` | Dynamic | Supabase |
| `/sermons/[slug]` | Dynamic (ISR) | Supabase |
| `/sermons/series/[slug]` | Dynamic (ISR) | Supabase |
| `/events` | Dynamic | Supabase |
| `/events/[slug]` | Dynamic (ISR) | Supabase |
| `/groups` | Dynamic | Supabase |
| `/groups/[slug]` | Dynamic (ISR) | Supabase |
| `/kids-youth` | MDX | `/content/pages/kids-youth.mdx` |
| `/outreach` | MDX | `/content/pages/outreach.mdx` |
| `/outreach/[slug]` | Dynamic (ISR) | Supabase |
| `/about` | MDX | `/content/pages/about.mdx` |
| `/about/team` | Dynamic | Supabase |
| `/give` | MDX | `/content/pages/give.mdx` |
| `/ministries/[slug]` | Dynamic (ISR) | Supabase |
| `/[slug]` | Dynamic | Supabase (landing_pages table) |
| `/admin/**` | Server-rendered | Supabase, protected |

**ISR** (Incremental Static Regeneration): pages that don't change frequently are statically generated at build time and revalidated on a timer (e.g., every 60 seconds). This gives fast load times while keeping content fresh without a full deploy.

---

## Homepage Section Structure

```
1. Hero
   └── Full-width image/video, headline, primary CTA ("Plan a Visit")

2. Service Times
   └── Static — day, time, location

3. Plan Your Visit
   └── Brief intro + link to /plan-a-visit

4. Featured Announcement
   └── Pulled from announcements where is_homepage_feature = true and not expired

5. Upcoming Events
   └── Next 3–4 events from event_occurrences (ordered by start_datetime)

6. Latest Sermon
   └── Most recent published sermon from sermons table

7. Kids & Youth
   └── Static section with link to /kids-youth

8. Groups
   └── 3–4 highlighted groups from groups table, link to /groups

9. Outreach Opportunities
   └── Active outreach initiatives from outreach table

10. Newsletter Signup
    └── Email capture form (provider TBD)

11. Footer
    └── Nav links, social links, address, ChurchSuite links
```

---

## Live WordPress URL mapping

The live site at thrivevineyard.com uses different URLs than the planned structure above. Key differences:

| Planned route | Live WordPress URL | Notes |
|---|---|---|
| `/plan-a-visit` | `/im-new/` | Richer content — 5-step guide, RSVP form |
| `/sermons` (Watch hub) | `/teaching/` + `/sermons/` | Live splits hub (`/teaching/`) from archive |
| `/events/[slug]` | `/upcoming-events/[slug]/` | MEC event prefix |
| `/kids-youth` | `/kids/` + `/youth-alpha/` | Kids and youth are separate pages on live site |
| `/outreach` | *(no hub — 404)* | Outreach is standalone pages: `/joydrop/`, `/pantry/`, `/plug/`, etc. |
| `/sermons/series/[slug]` | `/series/[slug]/` | Singular path on live site |
| `/sermons/speakers/[slug]` | `/speaker/[slug]/` | Singular path on live site |

Full live site inventory: [01-current-site-audit.md](./01-current-site-audit.md). Redirect mapping: [04-seo-url-migration-map.md](./04-seo-url-migration-map.md).

---

## Notes

- **SEO note:** The final URL structure above is the proposed structure. Before committing to it, a Google Search Console audit should be run on the existing WordPress site to identify high-traffic URLs. Any URL that changes from the old structure needs a 301 redirect. See `04-seo-url-migration-map.md` (to be written after the audit).
- **Landing page slug conflicts:** If a landing page slug conflicts with a named route (e.g., someone creates a landing page with slug `sermons`), the named route wins. Admin should surface a warning when creating a landing page with a reserved slug.
