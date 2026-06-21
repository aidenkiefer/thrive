# 05 — Content Models

All dynamic content lives in Supabase. Static structural pages (About, Plan a Visit, Kids & Youth, Outreach hub, Give) live as MDX files in `/content/pages/` and are not in the database.

---

## Universal Fields

Every Supabase table includes:

| Field | Type | Purpose |
|---|---|---|
| `id` | `uuid` PK | Primary key |
| `slug` | `text UNIQUE NOT NULL` | Clean URL segment |
| `seo_title` | `text` | `<title>` tag (falls back to name/title if null) |
| `seo_description` | `text` | Meta description |
| `og_image_url` | `text` | Open Graph image for social sharing |
| `published_at` | `timestamptz` | Null = draft; set to publish |
| `created_at` | `timestamptz` | Auto-set to `now()` |

---

## Tables

### `sermons`

Individual sermon records.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | e.g., `hope-in-the-waiting-2026-05-18` |
| `title` | `text NOT NULL` | |
| `description` | `text` | Full sermon notes or summary |
| `speaker_id` | `uuid FK → speakers` | Required |
| `series_id` | `uuid FK → sermon_series` | Nullable — standalone sermons |
| `scripture_references` | `text[]` | e.g., `["Romans 8:28", "Psalm 23"]` |
| `audio_url` | `text` | Direct audio file URL |
| `video_url` | `text` | Direct video file URL |
| `youtube_url` | `text` | YouTube embed URL |
| `thumbnail_url` | `text` | |
| `duration_seconds` | `int` | For display (e.g., "42 min") |
| `preached_at` | `date NOT NULL` | Date the sermon was delivered |
| `location` | `text` | Override if not main venue |
| `topics` | `text[]` | e.g., `["faith", "healing", "prayer"]` |
| `service_type` | `text DEFAULT 'Sunday Service'` | e.g., "Sunday Service", "Special Service", "Conference" |
| + universal fields | | |

---

### `sermon_series`

A named series grouping multiple sermons.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | e.g., `greater-things-2026` |
| `title` | `text NOT NULL` | |
| `description` | `text` | |
| `thumbnail_url` | `text` | |
| `start_date` | `date` | First sermon in series |
| `end_date` | `date` | Nullable — ongoing series |
| + universal fields | | |

---

### `speakers`

Pastor and guest speaker profiles.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | e.g., `pastor-james-smith` |
| `name` | `text NOT NULL` | |
| `title` | `text` | e.g., "Lead Pastor" |
| `bio` | `text` | |
| `photo_url` | `text` | |
| `email` | `text` | |

No `published_at` — speakers are always visible or simply not linked.

---

### `recurring_events`

The canonical entity for anything that happens on a regular schedule. This is the source of truth — occurrences are generated from it.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | e.g., `holy-spirit-night` |
| `name` | `text NOT NULL` | e.g., "Holy Spirit Night" |
| `description` | `text` | Full description |
| `short_summary` | `text` | 1–2 sentence blurb for cards |
| `category` | `text` | e.g., "worship", "youth", "prayer" |
| `recurrence_description` | `text` | Human-readable: "First Saturday of the month" |
| `typical_time` | `text` | e.g., "7:00 PM" |
| `location` | `text` | |
| `venue` | `text` | Specific room/space, e.g., "Sanctuary", "Cafe" |
| `leader` | `text` | |
| `contact_email` | `text` | |
| `contact_phone` | `text` | |
| `featured_image_url` | `text` | |
| `gallery_urls` | `text[]` | |
| `video_urls` | `text[]` | |
| `churchsuite_form_url` | `text` | Signup form embed/redirect |
| + universal fields | | |

---

### `event_occurrences`

Specific dated instances of a recurring event. Generated and managed by staff in the admin panel; the recurring event is the canonical record.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `recurring_event_id` | `uuid FK → recurring_events NOT NULL` | |
| `start_datetime` | `timestamptz NOT NULL` | |
| `end_datetime` | `timestamptz` | |
| `location` | `text` | Overrides recurring_event.location if set |
| `notes` | `text` | e.g., "Special guest speaker this month" |
| `cancelled` | `bool DEFAULT false` | Soft cancel without deleting |
| `created_at` | `timestamptz` | |

No slug, SEO fields, or published_at — occurrences inherit everything from their parent recurring event.

---

### `one_time_events`

Standalone events that are not part of a recurring series.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | |
| `name` | `text NOT NULL` | |
| `description` | `text` | |
| `short_summary` | `text` | |
| `category` | `text` | |
| `start_datetime` | `timestamptz NOT NULL` | |
| `end_datetime` | `timestamptz` | |
| `location` | `text` | |
| `venue` | `text` | Specific room/space, e.g., "Sanctuary", "Cafe" |
| `leader` | `text` | |
| `contact_email` | `text` | |
| `featured_image_url` | `text` | |
| `churchsuite_form_url` | `text` | |
| + universal fields | | |

---

### `groups`

Small groups, connect groups, and other ongoing community gatherings.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | |
| `name` | `text NOT NULL` | |
| `description` | `text` | |
| `short_summary` | `text` | |
| `category` | `text` | e.g., "small-group", "connect-group", "youth" |
| `meeting_schedule` | `text` | Human-readable: "Tuesdays at 7 PM" |
| `location` | `text` | Address or "Online" |
| `leader` | `text` | |
| `contact_email` | `text` | |
| `contact_phone` | `text` | |
| `featured_image_url` | `text` | |
| `churchsuite_form_url` | `text` | |
| `is_open` | `bool DEFAULT true` | Whether accepting new members |
| + universal fields | | |

---

### `ministries`

Ministry teams (worship, children's, production, etc.).

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | e.g., `worship-team` |
| `name` | `text NOT NULL` | |
| `description` | `text` | |
| `short_summary` | `text` | |
| `leader` | `text` | |
| `contact_email` | `text` | |
| `featured_image_url` | `text` | |
| + universal fields | | |

---

### `announcements`

Time-bounded notices displayed on the homepage and/or across the site.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `title` | `text NOT NULL` | |
| `body` | `text` | Rich text or plain |
| `cta_text` | `text` | Button label, e.g., "Sign Up" |
| `cta_url` | `text` | Where the CTA points |
| `featured_image_url` | `text` | |
| `is_homepage_feature` | `bool DEFAULT false` | Surfaces in homepage featured block |
| `expires_at` | `timestamptz` | Auto-hides after this date |
| + universal fields | | |

No slug by default — announcements don't have canonical URL pages unless explicitly needed.

---

### `staff`

Staff and team member profiles.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | |
| `name` | `text NOT NULL` | |
| `title` | `text` | e.g., "Worship Director" |
| `bio` | `text` | |
| `photo_url` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `display_order` | `int` | Controls sort order on team page |
| `created_at` | `timestamptz` | |

No `published_at` — controlled by presence in the table.

---

### `landing_pages`

Custom pages for Google Ads campaigns or other marketing purposes. Can reference a canonical entity to pull its data.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE NOT NULL` | Root-level URL: `/[slug]` |
| `title` | `text NOT NULL` | Internal name |
| `hero_heading` | `text` | |
| `hero_subheading` | `text` | |
| `hero_image_url` | `text` | |
| `body_content` | `text` | Rich text / markdown body |
| `cta_text` | `text` | |
| `cta_url` | `text` | Usually a ChurchSuite form URL |
| `linked_entity_type` | `text` | `recurring_event`, `group`, `ministry`, `one_time_event` |
| `linked_entity_id` | `uuid` | References the canonical entity |
| + universal fields | | |

When a `linked_entity_type` and `linked_entity_id` are set, the landing page template can automatically pull the entity's description, image, contact info, and ChurchSuite form URL — reducing duplicate data entry.

---

### `outreach`

Outreach initiatives and volunteer opportunities.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `slug` | `text UNIQUE` | |
| `name` | `text NOT NULL` | |
| `description` | `text` | |
| `short_summary` | `text` | |
| `featured_image_url` | `text` | |
| `contact_email` | `text` | |
| `volunteer_signup_url` | `text` | External link or ChurchSuite |
| `is_ongoing` | `bool DEFAULT false` | Ongoing vs. time-bounded |
| `start_date` | `date` | |
| `end_date` | `date` | Nullable |
| + universal fields | | |

---

## Relationships Summary

```
sermon_series ──< sermons >── speakers
                        │
                   (optional)

recurring_events ──< event_occurrences

landing_pages ──> [recurring_events | one_time_events | groups | ministries]
                  (optional linked entity)
```

---

## MDX Pages (not in Supabase)

These pages change rarely and are version-controlled in git:

| File | Route |
|---|---|
| `/content/pages/plan-a-visit.mdx` | `/plan-a-visit` |
| `/content/pages/kids-youth.mdx` | `/kids-youth` |
| `/content/pages/outreach.mdx` | `/outreach` |
| `/content/pages/about.mdx` | `/about` |
| `/content/pages/give.mdx` | `/give` |

---

## Admin Warning: Reserved Slugs

Landing pages use root-level slugs (`/[slug]`). The following slugs are reserved and must not be used for landing pages:

```
plan-a-visit, sermons, events, groups, kids-youth, outreach, about, give, ministries, admin
```

The admin landing page creation form should validate against this list.
