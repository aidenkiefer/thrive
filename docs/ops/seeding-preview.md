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

It prints, per table, the planned and live row counts and how many rows would be inserted, updated or left unchanged, plus the rows only the database has. It then lists every slug to insert, the columns that would change on each updated row, any slug that would end up in both event tables, whether Express(o) is live as Sundays 8:30 AM, and a **fingerprint**: a short hash of every row it would insert and every value it would overwrite. The publishable key can only read published rows (every content row today). It cannot see unpublished rows, and nothing is written.

## 2. Write (owner, or the Data lane after the owner's go)

Preconditions ([rule 3](supabase-live-project.md#rules)): the owner's "go" on #101 naming this script at a commit and the dry-run fingerprint, a backup or recovery point confirmed, one executor, and a ledger row afterwards. The `published_at` guard (`20261119010000`) must **not** be applied yet. After it is, a re-run aborts (`P0001`) at the first row staff changed.

```bash
NEXT_PUBLIC_SUPABASE_URL=<project URL> \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
SEED_CONFIRM_SUPABASE_HOST=<host of the project URL, e.g. abcd.supabase.co> \
SEED_EXPECT_FINGERPRINT=<fingerprint from the approved dry run> \
npm run seed
```

The script refuses (exit 2, nothing written) when:

- the service-role key, the host confirmation or the expected fingerprint is missing (checked before connecting);
- `SEED_CONFIRM_SUPABASE_HOST` does not equal the host of `NEXT_PUBLIC_SUPABASE_URL` (so a stray `.env.local` cannot point the write at the wrong project). Both confirmations are read only from the command line, never from `.env.local`;
- a planned event slug is live and published in the other event table (the public event page reads one-time events first, so the stale row would hide the new one);
- the fingerprint it computes just before writing differs from `SEED_EXPECT_FINGERPRINT`. It covers the live values the seed would overwrite, the keys it would insert, and every planned row it would send. Any change since the approved dry run changes it: a staff edit to a title, schedule or URL, or an edited file in `migration-files/parsed/`. Nothing is written without a fresh, approved dry run. Still run from a clean checkout of the approved commit. If a planned row is unpublished in the database, the publishable-key dry run cannot see it and the fingerprints differ; the write then refuses (safe), and the row needs a look before going on.

It also stops before connecting if the exports are not the reviewed November set or fail their checks: counts 12 / 22 / 120 / 25 / 55 / 56, unique slugs, known speakers, series and recurring events, and Express(o) on Sundays at 08:30 America/Chicago.

## 3. Verification (automatic)

After writing, the script re-reads every planned row with the service-role client and exits **1** unless all of them exist with the planned values, and Express(o) is published as "Sundays" at "8:30 AM" with every occurrence on a Sunday at 08:30 Chicago time. Rows only the database has are reported, not counted as failures. Paste the final table and the "Verification passed" line into the ledger row.

To re-check later without writing, run the dry run: "already applied, nothing to write" means every planned row matches.

**Not all-or-nothing.** Each upsert commits on its own. If a write fails part way (exit 1), the rows before the failure are already written. Re-running the dry run shows exactly what is left, and its new fingerprint needs a fresh approval. The backup taken before the write is the rollback.

**One writer at a time.** The fingerprint check happens once, before writing. The script reads the six tables one after another, then sends about 290 separate upserts (roughly 15 to 45 seconds) with no transaction and no per-row check at write time. An edit made in that window, through `/admin` or SQL, can be overwritten without a refusal. Run the seed only when nobody else is writing to the content tables. That holds today, since no staff accounts exist yet. Once staff are editing, schedule the run and pause edits for it.

## Applying as SQL (no service-role key)

For #101 the owner chose to apply the seed as SQL through the Supabase MCP, since agents never hold the service-role key. `npx tsx scripts/seed-sql.ts` writes [`supabase/ops/2026-11-19-seed.sql`](../../supabase/ops/2026-11-19-seed.sql) from the same plan (`src/lib/seed/sql.ts`), and a unit test fails if the committed file no longer matches the exports. The file is one transaction of upserts that never deletes. It refuses while a planned event slug is published in the other event table, so run batch A first. The fingerprint does not apply to this path: the go names the file at a commit instead. Afterwards, the dry run should report 0 to insert and 0 to update. Every planned row is published, so the publishable key sees all of them.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Dry run finished, or write and verification passed |
| 1 | Write error or verification mismatch |
| 2 | Refused: configuration or safety rail; nothing written |

`scripts/seed-from-parsed.ts` is a legacy script with hand-written rows. Never run it against this project.
