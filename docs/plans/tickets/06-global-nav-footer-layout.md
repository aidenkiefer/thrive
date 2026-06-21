# Ticket: 06-global-nav-footer-layout

## Task
Build GlobalNav and Footer components; wire into root layout replacing TODO placeholders.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/components/layout/GlobalNav.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/index.ts`
- `src/app/layout.tsx`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/03-information-architecture.md` (Primary Navigation)
- `docs/01-current-site-audit.md` (Contact constants)

### Optional read-only references
- `docs/07-design-system.md`
- `src/components/ui/*` (read-only)

### Example files (read-only, optional)
- `src/components/ui/Button.tsx`

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `mobile-design`, `nextjs-app-router-patterns`
- Optional: `react-best-practices`

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- Nav links match IA: Plan a Visit, Watch & Listen (`/sermons`), Events, Groups, Kids & Youth, Outreach, About, Give
- Sticky navy header (`brand-800`); mobile hamburger drawer (navy, not black)
- Footer: service times summary, address, phone, email, social links from audit
- Logo: text wordmark "Thrive Vineyard" until SVG asset exists (no broken image)
- `<main>` wraps `{children}` with consistent top spacing
- PROGRESS.md updated
