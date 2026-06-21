# Ticket: 01-schema-patch-topics-venue

## Task
Add migration-discovered columns (`topics`, `service_type` on sermons; `venue` on events) to `supabase/schema.sql` and document apply/regenerate-types steps.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `supabase/schema.sql`
- `docs/05-content-models.md` (add new fields to table docs only)
- `docs/plans/PROGRESS.md` (completion note)

### Required read-only references
- `docs/plans/specs/sprint-01-demo-draft.md` (Schema changes section)
- `docs/02-content-inventory.md` (Suggested schema enhancements)

### Optional read-only references
- `migration-files/parsed/migration-report.json`

### Example files (read-only, optional)
- `supabase/schema.sql` (existing RLS patterns)

## Agent type
`data-agent`

## Skill pack
- Required: `executing-plans`, `postgres-best-practices`
- Optional: —

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- `sermons` table includes `topics text[]` and `service_type text DEFAULT 'Sunday Service'`
- `recurring_events` and `one_time_events` include optional `venue text`
- RLS policies unchanged in behavior
- `05-content-models.md` documents new fields
- Comment in schema: run apply + `npx supabase gen types typescript --local > src/lib/supabase/types.ts`
- PROGRESS.md patch note added
