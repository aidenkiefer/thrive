# Ticket: 03-seed-import-script

## Task
Write an idempotent seed script that imports parsed JSON into Supabase and adds minimal homepage seed rows (announcements, groups, outreach) from audit docs.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `supabase/seed.sql`
- `scripts/seed-from-parsed.ts` (or `migration-files/import-to-supabase.ts`)
- `package.json` (add `"seed": "..."` script only)
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/02-content-inventory.md`
- `docs/plans/specs/sprint-01-demo-draft.md` (Seed strategy)
- `migration-files/parsed/migration-report.json`

### Optional read-only references
- `docs/01-current-site-audit.md` (announcement/group copy)
- `migration-files/parse-export.py`

### Example files (read-only, optional)
- `migration-files/parsed/sermons.json` (first 2 records)

## Agent type
`data-agent`

## Skill pack
- Required: `executing-plans`, `postgres-best-practices`, `backend-dev-guidelines`
- Optional: —

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- Script reads `migration-files/parsed/*.json`
- Inserts speakers → series → sermons (FK resolution by slug)
- Inserts recurring + one_time events; strips ChurchSuite embed params to canonical URL
- Generates `event_occurrences` for `family-worship-service` (Sundays, 8 weeks forward) minimum
- Adds 1 featured announcement, 3 groups, 2 outreach rows from audit content (no fabricated names/dates)
- Idempotent: safe to re-run (upsert on slug or delete+insert documented)
- README note in `migration-files/README.md` for run command
- PROGRESS.md updated

**Note:** Script may fail without `.env.local` — document that; do not invent Supabase credentials.
