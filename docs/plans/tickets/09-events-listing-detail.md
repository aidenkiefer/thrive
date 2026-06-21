# Ticket: 09-events-listing-detail

## Task
Implement `/events` listing and `/events/[slug]` detail for one-time events and recurring events with ChurchSuite CTA.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/(public)/events/page.tsx`
- `src/app/(public)/events/[slug]/page.tsx`
- `src/components/events/EventCard.tsx`
- `src/components/events/EventDetail.tsx`
- `src/lib/queries/events.ts` (extend queries if needed for listing shape)
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/plans/specs/sprint-01-demo-draft.md` (Events section)
- `docs/05-content-models.md` (events tables)

### Optional read-only references
- `docs/06-integrations.md` (ChurchSuite)
- `migration-files/parsed/one_time_events.json` (read-only sample)

### Example files (read-only, optional)
- `src/components/sermons/SermonCard.tsx` (card pattern)

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `nextjs-app-router-patterns`, `backend-dev-guidelines`
- Optional: `seo`

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- Listing: upcoming one-time events + next occurrences from seed; group by month optional
- Detail: name, description, datetime, location/venue, featured image, ChurchSuite signup button when URL present
- Recurring event slug resolves to parent + next occurrence date
- Past events hidden from listing (or in separate "Past" section — pick one, document in PROGRESS)
- `revalidate = 60`; `generateMetadata` on detail
- PROGRESS.md updated
