# Ticket: 11-css-pipeline-diagnosis

## Task
Identify and correct the proven cause of the public CSS pipeline failure without changing visual design tokens.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `package.json`
- `package-lock.json`
- `postcss.config.js`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `docs/plans/tickets/11-css-pipeline-diagnosis.md`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/workflow/execution-rules.md`

### Optional read-only references
- `docs/07-design-system.md`

## Agent type
`debugging-agent`

## Skill pack
- Required: `systematic-debugging`
- Optional: —

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- The CSS failure is traced to a specific configuration, dependency, or generated-asset cause.
- Only the file(s) responsible for the proven fault are changed.
- The diagnosis and user-run verification steps are recorded in `docs/plans/PROGRESS.md`.
