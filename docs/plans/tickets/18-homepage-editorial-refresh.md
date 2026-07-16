# Ticket: 18-homepage-editorial-refresh

## Task
Refine the existing homepage sections into a consistent warm-editorial hierarchy using only supplied dynamic data and approved shared primitives.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/components/home/HeroSection.tsx`
- `src/components/home/ServiceTimesSection.tsx`
- `src/components/home/FeaturedAnnouncement.tsx`
- `src/components/home/UpcomingEventsSection.tsx`
- `src/components/home/LatestSermonSection.tsx`
- `src/components/home/HubCardsSection.tsx`
- `src/components/home/NewsletterSection.tsx`
- `docs/plans/tickets/18-homepage-editorial-refresh.md`
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
- Homepage sections share a clear section-header and CTA hierarchy.
- Existing dynamic content, destination URLs, and ChurchSuite boundaries remain unchanged.
- No unapproved imagery or invented ministry copy is added.
- `docs/plans/PROGRESS.md` records the homepage polish pass.
