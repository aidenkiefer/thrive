# Ticket: 17-public-detail-page-foundations

## Task
Bring remaining public placeholder detail routes into the shared page layout without fabricating canonical content.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/(public)/about/team/page.tsx`
- `src/app/(public)/groups/[slug]/page.tsx`
- `src/app/(public)/outreach/[slug]/page.tsx`
- `src/app/[slug]/page.tsx`
- `docs/plans/tickets/17-public-detail-page-foundations.md`
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
- Remaining placeholder public routes use the shared page shell.
- Detail and landing-page parameters remain asynchronous and route-safe.
- No ministry facts, staff details, or landing-page campaign claims are invented.
- `docs/plans/PROGRESS.md` records the detail-page foundation pass.
