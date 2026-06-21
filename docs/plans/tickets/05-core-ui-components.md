# Ticket: 05-core-ui-components

## Task
Create reusable UI primitives in `src/components/ui/` using design tokens — no page wiring yet.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Section.tsx`
- `src/components/ui/Container.tsx`
- `src/components/ui/Heading.tsx`
- `src/components/ui/index.ts`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/07-design-system.md` (Core components table)
- `tailwind.config.ts` (read-only)

### Optional read-only references
- `docs/plans/specs/sprint-01-demo-draft.md`

### Example files (read-only, optional)
- `src/app/globals.css`

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `tailwind-patterns`, `react-best-practices`
- Optional: `shadcn` (reference only — do not install full CLI unless already in project)

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- `Button`: variants `primary` | `secondary` | `ghost` | `accent`
- `Card`: optional image, title, description, footer slot
- `Section`: consistent vertical padding + optional `brand-800` / `neutral-100` backgrounds
- `Container`: max-width wrapper (`max-w-content` ~1152px)
- `Heading`: display font, levels h1–h4
- All use token classes — no hardcoded hex in components
- PROGRESS.md updated
