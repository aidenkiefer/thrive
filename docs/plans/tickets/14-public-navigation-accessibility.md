# Ticket: 14-public-navigation-accessibility

## Task
Make the public navigation keyboard-accessible, route-aware, and consistent with the updated design system.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/layout.tsx`
- `src/components/layout/GlobalNav.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/SiteShell.tsx`
- `src/app/globals.css`
- `docs/plans/tickets/14-public-navigation-accessibility.md`
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
- A skip link and main-content target support keyboard navigation.
- The active public route is announced in desktop and mobile navigation.
- Mobile navigation closes with Escape, restores focus to its trigger, and locks document scroll while open.
- Navigation and footer preserve the existing authorized destination list and use the new palette tokens.
- `docs/plans/PROGRESS.md` records the completed accessibility pass.
