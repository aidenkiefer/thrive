# Ticket: 13-shared-ui-primitives

## Task
Add the small reusable primitives needed to make public-page hierarchy, metadata, and forms visually consistent.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/components/ui/index.ts`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/BackLink.tsx`
- `src/components/ui/Heading.tsx`
- `src/app/globals.css`
- `docs/plans/tickets/13-shared-ui-primitives.md`
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
- Metadata badges, form inputs, page headers, and back navigation are exported from the UI barrel.
- The primitives use existing Tailwind tokens and have visible keyboard focus treatment.
- Global prose styles give MDX content coherent typography without an additional dependency.
- `docs/plans/PROGRESS.md` records the completed component layer.
