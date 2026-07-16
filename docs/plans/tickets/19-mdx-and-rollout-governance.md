# Ticket: 19-mdx-and-rollout-governance

## Task
Apply the shared prose treatment to the existing MDX page and document the UI-overhaul rollout constraints.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/(public)/plan-a-visit/page.tsx`
- `docs/plans/tickets/19-mdx-and-rollout-governance.md`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/04-seo-url-migration-map.md`

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
- Existing MDX content receives the shared `prose-content` treatment without content alteration.
- No route or URL changes are introduced, so no redirect entry is required.
- The completion log records the verification boundary: no build/dev/test/compile run under project rules.
