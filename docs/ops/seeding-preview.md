# Seeding the live project (before launch)

`npm run seed` (`scripts/seed-current.ts`) imports the reviewed November exports in `migration-files/parsed/` into the project named by `NEXT_PUBLIC_SUPABASE_URL`. There is no separate Preview database: this is the production project, used for verification until launch ([rules](supabase-live-project.md)). **Seed once, early, before staff edit anything.**

What it writes: speakers, sermon series, sermons, recurring and one-time events, and generated occurrences, as upserts keyed by `slug` (occurrences by recurring event and start time). It never deletes, never touches groups, outreach, announcements or staff tables, and never inserts placeholder rows.

## 1. Dry run (anyone, read-only)

Needs only the public values, never the service-role key:

```bash
NEXT_PUBLIC_SUPABASE_URL=<project URL> \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key> \
npm run seed -- --dry-run
```

It prints, per table, the planned and live row counts and how many rows would be inserted, updated or left unchanged, plus the rows only the database has. It then lists every slug to insert, the columns that would change on each updated row, any slug that would end up in both event tables, and whether Express(o) is live as Sundays 8:30 AM. The publishable key can only read published rows (every content row today). It cannot see unpublished rows, and nothing is written.

## 2. Write (owner, or the Data lane after the owner's go)

Preconditions ([rule 3](supabase-live-project.md#rules)): the owner's "go" on #101 naming this script at a commit, a backup or recovery point confirmed, one executor, and a ledger row afterwards. The `published_at` guard (`20261119010000`) must **not** be applied yet. After it is, a re-run aborts (`P0001`) at the first row staff changed.

```bash
NEXT_PUBLIC_SUPABASE_URL=<project URL> \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
SEED_CONFIRM_SUPABASE_HOST=<host of the project URL, e.g. abcd.supabase.co> \
npm run seed
```

The script refuses (exit 2, nothing written) when:

- the service-role key is missing;
- `SEED_CONFIRM_SUPABASE_HOST` does not equal the host of `NEXT_PUBLIC_SUPABASE_URL` (so a stray `.env.local` cannot point the write at the wrong project);
- a planned event slug is live in the other event table (the public event page reads one-time events first, so the stale row would hide the new one).

It also stops before connecting if the exports are not the reviewed November set or fail their checks: counts 12 / 22 / 120 / 25 / 55 / 56, unique slugs, known speakers, series and recurring events, and Express(o) on Sundays at 08:30 America/Chicago.

## 3. Verification (automatic)

After writing, the script re-reads every planned row with the service-role client and exits **1** unless all of them exist with the planned values, and Express(o) is published as "Sundays" at "8:30 AM" with every occurrence on a Sunday at 08:30 Chicago time. Rows only the database has are reported, not counted as failures. Paste the final table and the "Verification passed" line into the ledger row.

To re-check later without writing, run the dry run: "already applied, nothing to write" means every planned row matches.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Dry run finished, or write and verification passed |
| 1 | Write error or verification mismatch |
| 2 | Refused: configuration or safety rail; nothing written |

`scripts/seed-from-parsed.ts` is a legacy script with hand-written rows. Never run it against this project.
