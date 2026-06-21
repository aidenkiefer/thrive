# 02 — Content Inventory (Migration)

Parsed export of WordPress events (Modern Events Calendar) and sermons (Sermon Manager Pro) into Supabase-ready JSON.

**Source files:** `migration-files/events.xml`, `migration-files/sermons.xml`  
**Parser:** `migration-files/parse-export.py`  
**Parsed output:** `migration-files/parsed/`  
**Last run:** see `migration-report.json` → `generated_at`

Re-run after updating XML exports:

```bash
python3 migration-files/parse-export.py
```

---

## Export summary

| Entity | Count | Target table(s) |
|--------|------:|-----------------|
| Recurring events | 18 | `recurring_events` |
| One-time events | 46 | `one_time_events` |
| Sermons | 104 | `sermons` |
| Speakers | 12 | `speakers` |
| Sermon series | 20 | `sermon_series` |

| Quality signal | Events | Sermons |
|----------------|-------:|--------:|
| With ChurchSuite signup URL | 12 | — |
| With YouTube | — | 100 |
| With audio MP3 | — | 41 |
| With scripture refs | — | 81 |
| With topic tags | — | 91 |
| Past / archive flagged | 63 | — |
| Upcoming | 1 | — |

---

## Field mapping

### Events → `recurring_events`

| WordPress / MEC | Parsed JSON | Supabase column |
|-----------------|-------------|-----------------|
| `post/post_name` | `slug` | `slug` |
| `title` | `name` | `name` |
| `post/post_content` | `description` | `description` |
| auto-truncated | `short_summary` | `short_summary` |
| primary category | `category` | `category` |
| `mec_repeat_*` + `mec_advanced_days` | `recurrence_description` | `recurrence_description` |
| `time/start` | `typical_time` | `typical_time` |
| `locations/item/name` | `location` | `location` |
| `featured_image/full` | `featured_image_url` | `featured_image_url` |
| iframe in content | `churchsuite_form_url` | `churchsuite_form_url` |
| `permalink` | `legacy_permalink` | *(redirect map only)* |
| `post/post_date` | `published_at` | `published_at` |

**Split rule:** `mec_repeat_status == 1` → `recurring_events`; otherwise → `one_time_events`.

### Events → `one_time_events`

Same as above, plus:

| MEC meta | Parsed JSON | Supabase column |
|----------|-------------|-----------------|
| `mec_start_date` + time fields | `start_datetime` | `start_datetime` |
| `mec_end_date` + time fields | `end_datetime` | `end_datetime` |

Timezone assumed `America/Chicago` (`-05:00`) during parse — confirm for DST edges.

### Sermons → `sermons` + related

| WordPress / SMP | Parsed JSON | Supabase column |
|-----------------|-------------|-----------------|
| `wp:post_name` | `slug` | `slug` |
| `title` | `title` | `title` |
| `content:encoded` | `description` | `description` |
| `wpfc_preacher` taxonomy | `speaker_slug` → `speakers` | `speaker_id` |
| `wpfc_sermon_series` | `series_slug` → `sermon_series` | `series_id` |
| `wpfc_bible_book` | `scripture_references[]` | `scripture_references` |
| `wpfc_sermon_topics` | `topics[]` | *(see enhancements — not in schema yet)* |
| `wpfc_service_type` | `service_type` | *(see enhancements)* |
| `sermon_video` iframe | `youtube_url` | `youtube_url` |
| `sermon_audio` | `audio_url` | `audio_url` |
| `wp:post_date` | `preached_at` | `preached_at` |
| `link` | `legacy_permalink` | *(redirect map)* |

Excluded: `sample-sermon` test record.

---

## Parsed file reference

| File | Contents |
|------|----------|
| `parsed/recurring_events.json` | 18 canonical recurring entities |
| `parsed/one_time_events.json` | 46 dated events |
| `parsed/speakers.json` | 12 deduplicated speakers |
| `parsed/sermon_series.json` | 20 series |
| `parsed/sermons.json` | 104 sermon records (newest first) |
| `parsed/migration-report.json` | Stats, issues, recurring slug list |

---

## Data issues found

### Events

| Issue | Count | Action |
|-------|------:|--------|
| No category assigned | 16 | Manual review — assign normalized category |
| Past events in export | 63 | Decide archive policy (keep published vs hide) |
| ChurchSuite URL with embed params | 12 | Strip to canonical `/events/{id}` URL on import |
| Duplicate slug suffix (`-2`) | few | Merge or 301 redirect duplicates |
| `Family Worship Service` recurring + one-time Sunday entries | overlap | Consolidate under single `recurring_events` record |

### Sermons

| Issue | Count | Action |
|-------|------:|--------|
| Missing media (no YouTube or audio) | 4 | Add YouTube links manually or hide until ready |
| Stale WP Engine audio URLs | ~41 | Re-host MP3s to Supabase Storage or verify live URLs |
| Missing thumbnails | 104 | Export media library or pull from YouTube oEmbed |
| Empty descriptions | many recent | Acceptable if video carries content; optional backfill |
| Bible book taxonomy over-granular | 201 terms | Already mapped to `scripture_references`; no separate book archive needed unless desired |

---

## Recurring events (canonical list)

These should become `recurring_events` + generated `event_occurrences`:

1. `joy-drop-outreach` — 1st & 3rd Wed, 4:30 PM
2. `palatine-lego-users-group` — monthly (2nd Friday)
3. `youth-alpha` — weekly
4. `family-worship-service` — weekly Sunday
5. `contend-prayer-group`, `worship-night`, `rooted-small-group`, etc.

Full slug list: `migration-report.json` → `recurring_event_slugs`.

**Not yet generated:** `event_occurrences` rows — requires recurrence expansion script (next step).

---

## Suggested schema enhancements

Based on what the WordPress system actually uses vs our current `supabase/schema.sql`:

| Enhancement | Why | Recommendation |
|-------------|-----|----------------|
| **`sermons.topics text[]`** | 426 topic terms used on live site; 91% of sermons tagged | Add column — powers filtering without 426-row taxonomy table |
| **`sermons.service_type text`** | Live site has `/service-type/` archives | Add column; default `Sunday Service` |
| **`events.venue text`** or split `location` | MEC uses "Sanctuary" vs "Cafe" sub-locations | Parse location name before colon → `venue` + `location` |
| **`recurring_events.tags text[]`** | MEC tags (Outreach, Free Event, etc.) | Optional — useful for homepage/calendar filters |
| **`recurring_events.wp_legacy_id int`** | Traceability during migration | Temporary import column; drop after cutover |
| **`event_occurrences` generator** | MEC stored recurrence rules, not individual rows | Admin tool or import script to expand 6–12 months forward |
| **Link events ↔ groups/ministries** | P.L.U.G., Joy Drop, Youth Alpha exist as events AND landing pages | Add optional `linked_group_id` / `linked_ministry_id` FKs |
| **Normalize categories** | 20+ MEC categories with overlap (Meal vs Community Event) | Map to ~8 canonical categories in import script |
| **YouTube URL normalization** | Export has `/embed/` URLs | Convert to `watch?v=` or store embed + video ID |
| **Audio hosting** | 41 MP3s on old WP Engine paths | Bulk upload to Supabase Storage; update `audio_url` |

---

## Suggested process improvements (vs WordPress)

| WordPress pattern | New system improvement |
|-------------------|------------------------|
| Event + ChurchSuite iframe duplicated in post body | Store `churchsuite_form_url` only; render CTA button in template |
| Same ministry as event, group, and landing page | Single canonical entity (group/outreach) referenced by event cards |
| 201 bible-book taxonomy terms (many passage-level) | Flat `scripture_references[]` only — simpler, sufficient |
| 426 sermon topic tags (uncontrolled vocabulary) | Curated `topics[]` — merge synonyms on import (e.g. "Holy Spirit" variants) |
| Recurring rules buried in MEC meta | Explicit `recurrence_description` + admin occurrence manager |
| Past events stay published forever | `published_at` + optional `expires_at` or admin "archive" toggle |
| No `short_summary` — cards pull full HTML | Auto-generate `short_summary` (parser already does 200-char truncation) |
| Slug collisions (`panera-lunch-meet-up-2`) | Unique slug constraint catches duplicates at import time |

---

## Import sequence (when Supabase is ready)

1. Apply `supabase/schema.sql` (+ any enhancement migrations)
2. Insert `speakers` from `speakers.json`
3. Insert `sermon_series` from `sermon_series.json`
4. Insert `sermons` — resolve FK slugs → UUIDs
5. Insert `recurring_events` → expand → insert `event_occurrences`
6. Insert `one_time_events`
7. Add 301 redirects from `legacy_permalink` fields → `04-seo-url-migration-map.md`
8. Re-host media (images, audio) — update URLs
9. Manual review queue: 16 uncategorized events, 4 sermons without media

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [01-current-site-audit.md](./01-current-site-audit.md) | Live site context |
| [04-seo-url-migration-map.md](./04-seo-url-migration-map.md) | Redirect planning |
| [05-content-models.md](./05-content-models.md) | Target schema |
| [migration-files/README.md](../migration-files/README.md) | Parser usage |
