# Ticket: 10-mdx-plan-a-visit

## Task
Upgrade MDX dependency, add MDX renderer, and publish `/plan-a-visit` content from live site audit.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `package.json` (next-mdx-remote v6 only)
- `package-lock.json` (if npm install run by human — agent may update package.json only per no-verify rules; note in PROGRESS)
- `content/pages/plan-a-visit.mdx`
- `src/lib/mdx.ts` (serialize helper)
- `src/app/(public)/plan-a-visit/page.tsx`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/01-current-site-audit.md` (`/im-new/` section)
- `docs/06-integrations.md` (next-mdx-remote upgrade note)

### Optional read-only references
- `docs/plans/specs/sprint-01-demo-draft.md`
- `docs/03-information-architecture.md`

### Example files (read-only, optional)
- `src/components/ui/Section.tsx`

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `react-best-practices`
- Optional: —

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- `next-mdx-remote` upgraded to v6 in package.json
- MDX page includes: welcome intro, Express(o) vs Family Worship comparison, 5-step first-timer guide, kids check-in, greeter gift — sourced from audit (no invented facts)
- Server Component renders MDX via serialize/MDXRemote pattern
- CTA links to ChurchSuite visitor form URL if known from audit, else placeholder comment for staff to fill
- Page uses design system Section/Container/Heading
- PROGRESS.md updated

**Note:** Agent does not run `npm install` per project execution rules — document that human runs install after merge.
