# Migration files

WordPress source exports and parsed JSON for the Supabase import.

## Current sources (November 2026)

| File | Source | Records |
|---|---|---:|
| `mec-events-20261107UTC0059.json` | Modern Events Calendar | 80 published events |
| `thrivevineyardchurch.wordpress.2026-11-07.xml` | WordPress WXR | 120 published sermons, 2 excluded sermons, 59 attachments |

The older `events.xml` and `sermons.xml` remain for historical comparison. `parse-export.py` reads those older files by default. The current export conversion uses `parse-current-exports.py`.

## Convert current exports

From the repository root:

```bash
python3 migration-files/parse-current-exports.py
```

The command writes `migration-files/parsed/` for the existing seed script. It accepts `--events`, `--sermons`, and `--out` to read a different source or write a review copy elsewhere. It does not connect to Supabase.

Review `parsed/migration-report.json` before any seed. The current output contains 25 recurring and 55 one-time events, 120 published sermons, 12 speakers, and 22 series. It also flags one external event action URL and nine sermons without detected media. External action URLs are retained in parsed JSON and imported into the `external_url` event columns. The public event detail page displays external action links alongside confirmed ChurchSuite links.

## Database handoff

`npm run seed` now runs `scripts/seed-current.ts`. It reads `migration-files/parsed/`, requires the Supabase URL and service role key in `.env.local`, and stops on missing or stale inputs and database errors. It imports source records and generated occurrences only; it does not write hand-authored homepage rows. Apply the schema first (fresh project: `supabase/schema.sql`; June database: `supabase/migrations/`). See `supabase/README.md`.

The parser uses each event's reported timezone (defaulting to `America/Chicago`) for one-time event timestamps, preserving daylight-saving offsets. Sermon `published_at` values get the Chicago offset too (WordPress `post_date` has none). The parser generates a 90-day occurrence window for supported weekly rules and the Sunday family service. Explicit `custom_days` dates are expanded. Owner-confirmed schedules live in `OWNER_SCHEDULES` (currently Express(o): weekly, Sundays 8:30 AM, cafe) and are recorded as `schedule_source` in the parsed row. Rerun the converter when refreshing the 90-day window.

**Before seeding, read `parsed/import-readiness.md`** (counts, slug, DST and re-run checks, owner notes).
