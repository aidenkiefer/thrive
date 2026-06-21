# Ticket: 04-design-tokens-fonts

## Task
Implement design tokens from `07-design-system.md` in Tailwind config, load Fraunces + Inter fonts, and set base styles in `globals.css`.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx` (font imports + body classes only)
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/07-design-system.md` (Part 2 — Proposed color system, typography, Tailwind sketch)

### Optional read-only references
- `docs/plans/specs/sprint-01-demo-draft.md`

### Example files (read-only, optional)
- —

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `tailwind-patterns`
- Optional: —

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- `tailwind.config.ts` extends `brand`, `accent`, `neutral` color scales per spec
- `fontFamily.display` and `fontFamily.sans` wired via CSS variables from `next/font`
- `globals.css`: warm off-white body bg (`neutral-100`), text `neutral-950`, focus ring styles
- Root layout applies font classes; no component work yet
- PROGRESS.md updated
