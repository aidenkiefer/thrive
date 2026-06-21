# Migration files

WordPress XML exports and parsed JSON for Supabase import.

## Source exports (manual)

| File | Plugin | Records |
|------|--------|--------:|
| `events.xml` | Modern Events Calendar | 64 |
| `sermons.xml` | Sermon Manager Pro (WXR) | 106 posts → 104 usable |

Re-export from WordPress when content changes, then re-run the parser.

## Parse into JSON

```bash
python3 migration-files/parse-export.py
```

Outputs to `parsed/`:

- `recurring_events.json` — maps to `recurring_events` table
- `one_time_events.json` — maps to `one_time_events` table
- `speakers.json`, `sermon_series.json`, `sermons.json`
- `migration-report.json` — stats and data quality issues

## Documentation

Full field mapping, issues, and enhancement recommendations: [docs/02-content-inventory.md](../docs/02-content-inventory.md).

## Running the seed script

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

After applying `supabase/schema.sql` to your Supabase project:

```bash
npm run seed
```

The script is idempotent — safe to re-run. It will upsert all records on slug conflict.

## Next steps

1. Schema tweaks (`topics`, `service_type`, `venue`) — see content inventory doc
2. `event_occurrences` expansion script for recurring events
3. Media re-hosting (audio MP3s, featured images)
4. ~~Supabase seed/import script~~ — done; see `scripts/seed-from-parsed.ts`
