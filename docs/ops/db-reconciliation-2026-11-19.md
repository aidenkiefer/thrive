# Live database reconciliation, 2026-11-19 (#101)

**Read-only.** Nothing was written. Sources: `npm run seed -- --dry-run` (publishable key; the public read policies are `published_at is not null`, and every live content row is published, so the dry run sees every row except cancelled occurrences, of which there are none) and Supabase MCP `SELECT count(*)` / slug queries per [the live-project rules](supabase-live-project.md). No personal data was selected: contact, leader, and speaker email columns were only counted.

Applied migrations: `20261107000000`, `20261107010000`, `20261107020000` (unchanged from the baseline).

## Seed tables: what `npm run seed` would do

| Table | Planned (export) | Live | Insert | Update | Unchanged | Live-only |
|---|---|---|---|---|---|---|
| speakers | 12 | 12 | 0 | 0 | 12 | 0 |
| sermon_series | 22 | 20 | 2 | 20 | 0 | 0 |
| sermons | 120 | 104 | 16 | 104 | 0 | 0 |
| recurring_events | 25 | 18 | 7 | 18 | 0 | 0 |
| one_time_events | 55 | 46 | 10 | 45 | 0 | 1 |
| event_occurrences | 56 | 8 | 56 | 0 | 0 | 8 |

**Columns that differ on rows to update** (number of rows):

- sermon_series: `published_at` (20)
- sermons: `published_at` (104)
- recurring_events: `recurrence_description` (18), `location` (18), `published_at` (18), `venue` (5), `description`, `short_summary`, `typical_time`, `featured_image_url`, `seo_description`, `name` (1 each)
- one_time_events: `published_at` (45), `seo_description` (45), `location` (39), `name` (13), `end_datetime` (14), `start_datetime` (13), `venue` (11), `description` (1)

Every live `published_at` differs from the export. The older import stamped its own times, so the seed resets them to the WordPress publish dates. This is safe now: no staff accounts exist and the `published_at` guard (`20261119010000`) is not applied. After the guard is live, the seed must not run again (the "Seeding" section #96 adds to `docs/admin-setup.md`).

**Rows to insert:**

- sermon_series: `entrusted`, `faithful-through-the-ages`
- sermons: 16 (slugs listed in the dry-run output)
- recurring_events: `apologetics-training-with-dan-seidman`, `young-adults-bible-study`, `beyond-the-text`, `rooted-study-group`, `discovery-bible-study`, `thrive-youth-thursday-nights`, **`expresso-service`**
- one_time_events: `pjs-pancakes-christmas-bash`, `the-great-work-discovering-gods-design-for-your-life`, `proverbs-pancakes`, `the-chosen-season-6-early-access-screening`, `holy-spirit-come-2`, `thrive-kids-walk-a-thon`, `national-night-out-with-palatine-police`, `baptism-sunday`, `joy-drop-dine-share`, `low-pressure-prophetic-training`
- event_occurrences: all 56 generated occurrences (13 of them Express(o), Sundays 8:30 AM America/Chicago)

**Live-only rows (the seed never deletes):**

- one_time_events `thrive-youth-thursday-nights` (published, start date in the past). The export has the same slug as a **recurring** event. The public event page reads one-time events first, so this stale row would hide the recurring one. The seed refuses to write while it stays published (decision card item 3).
- event_occurrences: 8 `family-worship-service` occurrences from 2026-06-28 to 2026-08-16 (all past). They do not conflict with the export.

**Columns the seed does not set:** on live rows, `seo_title`, `og_image_url`, `duration_seconds`, `leader`, `contact_email`, `contact_phone`, gallery/video arrays, speaker `email`, `photo_url`, `bio` are all empty (counted, not read). No stale values survive outside the seeded columns.

**Express(o) today:** there is **no** `expresso-service` recurring event live. The seed adds it as published, "Sundays" at "8:30 AM", with 13 Sunday 08:30 occurrences, matching the owner decision (#54).

## Tables outside the seed (hand-written in June 2026)

These came from the legacy `scripts/seed-from-parsed.ts`, not from the audited exports. Names and short summaries were written by hand. No description, schedule, leader or contact fields were filled.

| Table | Row (slug) | Published | Notes |
|---|---|---|---|
| announcements | "Express(o) Service Renovation Pause" | yes, homepage feature, no expiry | Says Express(o) is paused. Contradicts the confirmed Sunday 8:30 AM schedule |
| groups | `contend-prayer-group`, `alpha`, `marrieds-small-group` | yes | Not in any export; summaries unsourced |
| outreach | `joy-drop`, `pack-the-pantry` | yes | Not in any export; summaries unsourced |

The owner decides these (decision card on #101). Agents do not touch them.

## Verification after the seed

`npm run seed` re-reads every planned row and exits non-zero unless all of them match: 12 speakers, 22 series, 120 sermons, 25 recurring + 55 one-time events, 56 occurrences, and Express(o) published as Sundays 8:30 AM with every occurrence on a Sunday at 08:30 America/Chicago. The result goes into [the change ledger](supabase-change-ledger.md).
