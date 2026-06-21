# Ticket: 08-sermons-archive-detail

## Task
Implement `/sermons`, `/sermons/[slug]`, and `/sermons/series` pages with real Supabase data and YouTube embeds.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/(public)/sermons/page.tsx`
- `src/app/(public)/sermons/[slug]/page.tsx`
- `src/app/(public)/sermons/series/page.tsx`
- `src/app/(public)/sermons/series/[slug]/page.tsx`
- `src/components/sermons/SermonCard.tsx`
- `src/components/sermons/SermonPlayer.tsx`
- `src/components/sermons/SermonMeta.tsx`
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/plans/specs/sprint-01-demo-draft.md` (Sermons section)
- `docs/03-information-architecture.md` (Watch & Listen routes)

### Optional read-only references
- `src/lib/queries/sermons.ts` (read-only)
- `docs/06-integrations.md` (YouTube)

### Example files (read-only, optional)
- `src/components/ui/Card.tsx`

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `nextjs-app-router-patterns`, `react-best-practices`
- Optional: `seo`

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- Archive: grid of `SermonCard` sorted by `preached_at` desc
- Detail: title, speaker, date, scripture refs, topics badges, `SermonPlayer` YouTube embed
- Series list + series detail with sermons in that series
- `generateMetadata` on detail using sermon title + seo fields
- `revalidate = 60` on pages
- `notFound()` for missing slug
- No Supabase client in client components — pass data as props
- PROGRESS.md updated
