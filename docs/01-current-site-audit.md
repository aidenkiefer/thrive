# 01 — Current Site Audit

Audit of the live WordPress site at [thrivevineyard.com](https://www.thrivevineyard.com/) (2026-06-20). Use this doc for migration planning, MDX content sourcing, and SEO redirect mapping. Search Console data still needed before finalizing redirects — see [04-seo-url-migration-map.md](./04-seo-url-migration-map.md).

---

## Platform stack

| Layer | Detail |
|---|---|
| CMS | WordPress on GoDaddy WPaaS |
| Theme | Pro (Themeco/Cornerstone) + `pro-child` |
| Events | Modern Events Calendar (MEC) — URLs under `/upcoming-events/` |
| Sermons | Sermon Manager Pro — custom post type `wpfc_sermon` |
| Forms | **Gravity Forms** (primary) — not ChurchSuite |
| Email | Mailchimp embedded signup |
| SEO | Yoast SEO, Redirection plugin |
| Analytics | Google Tag Manager `GTM-NQV3Z3N7`; Google Ads conversion `AW-16575196430` |
| Hosting history | Migrated from WP Engine; stale staging URLs still appear in some nav links |

**Scale:** ~103 sermons, ~62 events, 20+ campaign/landing pages at root slugs.

---

## Contact & location constants

| Item | Value |
|---|---|
| General email | `info@thrivevineyard.com` |
| Giving email | `give@thrivevineyard.com` |
| Phone | `(847) 668-5622` |
| Worship address | 845 E Glencoe St, Palatine, IL 60074 |
| Giving mail address | 1273 N Jack Pine Ct, Palatine, IL 60067 |
| Google Maps | `maps.app.goo.gl/XyPTAnSmpk72uxZ96` |

---

## Social & media

| Platform | URL |
|---|---|
| YouTube | `@thrivevineyardchurchus` — sermon embeds on `/teaching/` and sermon pages |
| Facebook | `facebook.com/thrivevineyardchurch` |
| Instagram | `instagram.com/thrivevineyard/` |
| Podcast (RSS.com) | Feed: `thrivevineyard` ("Sunday Morning Messages") |
| Apple Podcasts | `id1764577277` |
| Amazon Music | Linked from `/teaching/` |
| La Viña Facebook | `@viñapalatine` |

No dedicated livestream page found (`/live/` 404). "Watch Now" routes to `/teaching/` or YouTube.

---

## Service schedule (live content)

Two Sunday services — **not yet captured in planned MDX/static docs:**

| Service | Time | Location | Notes |
|---|---|---|---|
| **Express(o)** | 8:30 AM | Thrive Cafe (downstairs) | ~40–45 min; coffee, muffins, message, communion, prayer; no worship band. **Currently paused for renovations** (homepage carousel, 2026). |
| **Family Worship** | 9:30 AM | Sanctuary (upstairs) | ~80–90 min; full worship service |
| **La Viña** (Spanish) | 4:00 PM Sundays | Thrive building | Pastor Nicko Silva; `(224) 425-0524` |

**Thrive Cafe:** Post-service cafe mentioned on homepage — not documented elsewhere in project docs.

---

## Site map (live URLs)

### Primary navigation (live)

Live nav differs from planned IA. Key pages:

| Live URL | Purpose | Planned new URL |
|---|---|---|
| `/` | Homepage | `/` |
| `/im-new/` | Plan Your Visit — 5-step guide, kids check-in, visitor RSVP | `/plan-a-visit` |
| `/teaching/` | Watch & Listen hub — YouTube, podcast player, sermon archive | `/sermons` (hub role may need `/teaching/` redirect) |
| `/sermons/` | Sermon archive (~103) | `/sermons` |
| `/sermons/[slug]/` | Individual sermon | `/sermons/[slug]` |
| `/events/` | Events calendar (month/year filter, list/tile) | `/events` |
| `/upcoming-events/[slug]/` | Event detail — countdown, iCal export, next occurrences | `/events/[slug]` |
| `/groups/` | Groups listing + interest form | `/groups` |
| `/kids/` | Kids ministry by age band | `/kids-youth` (split kids vs youth) |
| `/youth-alpha/` | Youth Alpha landing + interest form | Part of `/kids-youth` or standalone |
| `/about/` | Staff, beliefs, history, group leaders, prayer form | `/about` + `/about/team` |
| `/give/` | Giving — Time/Talent/Treasure, all payment methods | `/give` |
| `/get-connected/` | General contact hub + Mailchimp | No direct equivalent — consider footer/contact page |
| `/prayer/` | Prayer ministry + request form | No direct equivalent |
| `/volunteering/` | Volunteer teams + contact | Partially covered in `/give` (Time/Talent) |
| `/expresso/` | Express(o) service description | Section in `/plan-a-visit` or `/about` |

**404 on live site (planned routes that don't exist yet):** `/plan-a-visit/`, `/outreach/`, `/watch/`, `/contact/`, `/kids-youth/`.

**No `/outreach/` hub on live site.** Outreach is spread across standalone pages (see below).

### Sermon taxonomy URLs (live only — not in planned IA)

| Pattern | Example |
|---|---|
| `/series/[slug]/` | `/series/ephesians/` |
| `/speaker/[slug]/` | `/speaker/molly-kiefer/` |
| `/book/[slug]/` | Bible book/passage archive |
| `/topics/[slug]/` | Topic archive |
| `/service-type/[slug]/` | e.g. `/service-type/sunday-service/` |

Content model has `scripture_references` but no `topics` or `service_type` tables yet.

### Outreach & campaign pages (no hub — individual root slugs)

| URL | Description |
|---|---|
| `/joydrop/` | Joy Drop Collective outreach + signup |
| `/pantry/` | Pack the Pantry campaign + signup |
| `/plug/` | P.L.U.G. (Palatine LEGO Users Group) |
| `/la-vina/` | La Viña Spanish ministry |
| `/prayer-walk/` | Palatine Prayer Walk |
| `/greenthumbs/` | Grounds/volunteer campaign |
| `/sokm/` | School of Kingdom Ministry |
| `/feel-the-power/`, `/fuelthefire/`, `/fasting/`, `/easter/`, `/christmas-guide/` | Seasonal/campaign landing pages |

These map to planned `landing_pages` table and/or `outreach` / `ministries` entities.

### Internal / staff-only

| URL | Description |
|---|---|
| `/communications/` | Staff comms request form (newsletter, slides, calendar, print) — likely admin-only or deferred |
| `/news/` | WordPress placeholder only — not a real news section |

---

## Content inventory

### About page (`/about/`)

- **Staff:** Kevin & Molly Kiefer, Jjay Neumaier, Carley LaPointe
- **What We Believe:** Bible, Church, Kingdom, Trinity subsections
- **Ministry & Thrive Group Leaders:** Mike & Tami, Roy & Julie, Michi & Nathan, Jjay & Justin
- **Leadership Council:** Mary Sirois
- **Church history:** Planted 2009, building 2016
- **Prayer request form** (Gravity Forms)

Group leaders and leadership council are displayed on About but not modeled separately in the `staff` table schema.

### Plan Your Visit (`/im-new/`)

- 5-step first-timer guide
- Express(o) vs Family Worship comparison
- Kids check-in instructions (arrive 10–15 min early)
- Greeter gift for newcomers
- First-time visitor RSVP form (Gravity Forms)

### Kids (`/kids/`)

| Room | Ages |
|---|---|
| The Nest | 0–2 |
| Lil Buds | 2–Pre-K |
| Treehouse | K–5 |
| Thrive Youth Group | 6–12 (during service) |

Nursing room in sanctuary. Kids contact form (Gravity Forms).

### Groups (live listing vs form menu)

**Listed on `/groups/` page (5):** Youth Group, Married's Small Group, Contend Prayer Group, Spiritual Warfare, Alpha.

**Also in group-interest form checkboxes (not on listing page):** Joy Drop, The Village, Worship Room, Discovery!, Men's Ministry, Bible Study, Rooted, Apologetics, Alpha.

Canonical group list needs reconciliation during migration.

### Homepage

- **Announcement carousel** (multiple rotating items) — docs plan single `is_homepage_feature` announcement
- Service times block
- Hub cards to main sections
- "Why Thrive?" five value pillars
- Mailchimp signup embed
- Thrive Cafe mention

Current carousel items (2026): renovation pause, Free Movie Night, Alpha, P.L.U.G., Pack the Pantry.

### Events (MEC)

- Month/year filters, list and tile views
- Sub-locations: Sanctuary vs Cafe
- Countdown, next-occurrence table, iCal/Google Calendar export, share buttons
- Recurring examples: Family Worship Service, P.L.U.G.
- One-time examples: Pack the Pantry, Holy Spirit Come, Puerto Rico Mission

Event schema has no `venue`/sub-location field yet.

### Sermons

103 sermons with: title, date, description, scripture, YouTube embed, series, speaker(s), topic tags, service type. AddToAny share buttons on archive.

---

## Forms inventory (Gravity Forms)

Live site uses Gravity Forms for almost all signups — **not ChurchSuite** (ChurchSuite is used for online giving only).

| Form / page | Purpose |
|---|---|
| `/im-new/` | First-time visitor RSVP |
| `/about/`, `/teaching/`, `/prayer/`, `/expresso/` | Prayer request |
| `/groups/`, `/group-form-sign-up/` | Group interest (extended checkbox menu) |
| `/kids/` | Kids ministry contact |
| `/youth-alpha/` | Youth Alpha interest |
| `/joydrop/`, `/pantry/` | Program signup |
| `/get-connected/` | Routed contact (pastor connect, schedule visit, prayer, groups/events info) |
| `/communications/` | Internal staff workflow |

**Migration decision needed:** Keep Gravity Forms embeds, migrate to ChurchSuite URLs, or build custom form handlers. Project docs currently assume ChurchSuite URL fields only.

---

## Integrations (live vs planned)

| Integration | Live usage | Project docs assumption |
|---|---|---|
| **ChurchSuite** | Online giving at `thrivevineyard.churchsuite.com/donate/` | Signup forms via `churchsuite_form_url` fields |
| **Gravity Forms** | All signups and contact/prayer forms | Not documented |
| **Mailchimp** | Homepage + `/get-connected/` embed; `eepurl.com/iTHsnQ` | Listed as "provider TBD" |
| **RSS.com podcast** | Active on `/teaching/` with Apple + Amazon links | Listed as "future integration" |
| **YouTube** | Sermon embeds | Mentioned but not configured |
| **Zelle / Chase QuickPay** | `/give/` — `give@thrivevineyard.com` | Not documented |
| **Mail-in giving** | Separate address (see above) | Not documented |
| **Google Tag Manager** | `GTM-NQV3Z3N7` site-wide | Not documented |
| **Google Ads** | Conversion `AW-16575196430` — campaigns active | Brief mentions active ads, no IDs |

---

## Functionality to preserve or decide on

| Feature | Recommendation |
|---|---|
| Two-service Sunday model + Express(o) | Document in `/plan-a-visit` MDX; consider seasonal status flag |
| Thrive Cafe | Mention in plan-a-visit and homepage |
| La Viña ministry | Add as `ministries` entity or dedicated MDX section |
| Joy Drop Collective | `outreach` or `ministries` entity; linked to Pack the Pantry events |
| Podcast (RSS.com) | Promote from "future" to v1 scope or explicit defer with redirect |
| Mailchimp newsletter | Confirm as provider; embed on homepage |
| Multi-method giving | Full matrix in `/give` MDX |
| Prayer request workflow | Decide: email API, Supabase submissions, or external form embed |
| Get Connected routed contact | Footer/contact page or simplified form |
| Event calendar UX | Filters, views, iCal export — specify in v0.5.0 events spec |
| Sermon topics + service types | Extend content model or use tags array |
| Homepage carousel | Multiple announcements with sort order vs single featured |
| Event sub-venues (Sanctuary/Cafe) | Add `venue` field to events schema |
| Internal communications form | Defer to admin tooling |
| 103-sermon + 62-event migration | Separate content migration phase; taxonomy complexity noted |

---

## WordPress migration notes

- Event URLs use `/upcoming-events/` prefix — all need 301 redirects to `/events/[slug]`
- Sermon taxonomy paths (`/series/`, `/speaker/`, `/topics/`, `/book/`, `/service-type/`) need redirect strategy
- Stale staging URLs in nav (`rrtrinityhill.wpenginepowered.com`, `43k.f12.myftpupload.com`) — do not migrate
- Sitemap endpoints return 500 — use manual crawl + Search Console for redirect inventory
- `/news/` is empty — skip

---

## Related docs

| Doc | What to use this audit for |
|---|---|
| [03-information-architecture.md](./03-information-architecture.md) | Live → planned URL mapping |
| [04-seo-url-migration-map.md](./04-seo-url-migration-map.md) | Redirect table (populate from this audit + Search Console) |
| [05-content-models.md](./05-content-models.md) | Schema gaps (topics, venues, carousel, ministries) |
| [06-integrations.md](./06-integrations.md) | Live integration details |
| [02-content-inventory.md](./02-content-inventory.md) | Per-record export (to be written at migration time) |
