# Ticket: 15-content-card-consistency

## Task
Normalize event, sermon, and series-card presentation around the shared visual system and optimized media component.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `next.config.ts`
- `src/components/events/EventCard.tsx`
- `src/components/sermons/SermonCard.tsx`
- `src/app/(public)/sermons/series/page.tsx`
- `src/components/ui/Badge.tsx`
- `docs/plans/tickets/15-content-card-consistency.md`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/07-design-system.md`

## Agent type
`frontend-agent`

## Skill pack
- Required: `frontend-design`
- Optional: —

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- Event, sermon, and series-list cards share title, metadata, media, and CTA hierarchy.
- New or retained media uses `next/image` instead of raw image elements.
- Card metadata uses shared UI primitives where its data shape permits.
- `docs/plans/PROGRESS.md` records the content-card consistency pass.
