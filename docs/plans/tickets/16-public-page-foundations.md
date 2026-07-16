# Ticket: 16-public-page-foundations

## Task
Bring the top-level public placeholder routes into the shared page layout without fabricating ministry content.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/(public)/about/page.tsx`
- `src/app/(public)/give/page.tsx`
- `src/app/(public)/kids-youth/page.tsx`
- `src/app/(public)/groups/page.tsx`
- `src/app/(public)/outreach/page.tsx`
- `src/app/(public)/ministries/[slug]/page.tsx`
- `docs/plans/tickets/16-public-page-foundations.md`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/03-information-architecture.md`

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
- Each route uses the shared `Section`, `Container`, and `PageHeader` primitives.
- Each temporary state is explicit without inventing ministry facts, dates, contacts, or descriptions.
- Dynamic ministry pages retain their existing route parameter behavior.
- `docs/plans/PROGRESS.md` records the public-page foundation pass.
