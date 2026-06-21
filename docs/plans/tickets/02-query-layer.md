# Ticket: 02-query-layer

## Task
Create typed Supabase query helpers in `src/lib/queries/` for sermons, events, announcements, groups, and outreach used by demo pages.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/lib/queries/sermons.ts`
- `src/lib/queries/events.ts`
- `src/lib/queries/announcements.ts`
- `src/lib/queries/groups.ts`
- `src/lib/queries/outreach.ts`
- `src/lib/queries/index.ts`
- `src/lib/supabase/types.ts` (only if T01 types already regenerated; otherwise use minimal inline types with TODO)

### Required read-only references
- `docs/05-content-models.md`
- `docs/plans/specs/sprint-01-demo-draft.md`

### Optional read-only references
- `src/lib/supabase/server.ts`

### Example files (read-only, optional)
- `src/app/(public)/sermons/page.tsx` (consumer stub)

## Agent type
`data-agent`

## Skill pack
- Required: `executing-plans`, `backend-dev-guidelines`, `postgres-best-practices`
- Optional: `typescript-pro`

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- Exported functions (minimum):
  - `getLatestSermon()`, `getSermons(limit?)`, `getSermonBySlug(slug)`, `getSermonSeries()`, `getSermonsBySeriesSlug(slug)`
  - `getUpcomingEvents(limit?)`, `getEventBySlug(slug)` (checks one_time + recurring)
  - `getFeaturedAnnouncement()`, `getHighlightedGroups(limit)`, `getActiveOutreach(limit)`
- All queries filter `published_at IS NOT NULL` where applicable
- Announcements respect `expires_at`
- Uses `createClient()` from server.ts — no browser client
- PROGRESS.md updated
