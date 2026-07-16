# Ticket: 12-dusty-rose-accent

## Task
Replace the yellow-green accent scale with a contrast-safe dusty-rose scale across the shared design system.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/components/ui/Button.tsx`
- `src/components/ui/Section.tsx`
- `src/components/layout/GlobalNav.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/FeaturedAnnouncement.tsx`
- `src/components/home/NewsletterSection.tsx`
- `src/components/sermons/SermonMeta.tsx`
- `docs/07-design-system.md`
- `docs/plans/tickets/12-dusty-rose-accent.md`
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
- `accent-400` and `accent-50` no longer use yellow-green values.
- Existing accent variants preserve readable foreground text and visible focus treatment.
- The design-system document identifies the dusty-rose scale and intended use.
- `docs/plans/PROGRESS.md` records the completed palette change.
