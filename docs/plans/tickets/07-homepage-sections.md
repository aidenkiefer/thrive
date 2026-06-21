# Ticket: 07-homepage-sections

## Task
Replace homepage placeholder with Supabase-backed sections per IA and sprint spec.

## Scope boundaries

### Allowed files (ONLY these — edit nothing else)
- `src/app/page.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/ServiceTimesSection.tsx`
- `src/components/home/FeaturedAnnouncement.tsx`
- `src/components/home/UpcomingEventsSection.tsx`
- `src/components/home/LatestSermonSection.tsx`
- `src/components/home/HubCardsSection.tsx`
- `src/components/home/NewsletterSection.tsx`
- `src/lib/constants/service-times.ts` (static service schedule from audit)
- `docs/plans/PROGRESS.md`

### Required read-only references
- `docs/plans/specs/sprint-01-demo-draft.md` (Homepage section table)
- `docs/03-information-architecture.md` (Homepage Section Structure)

### Optional read-only references
- `docs/01-current-site-audit.md`
- `src/lib/queries/index.ts` (read-only)

### Example files (read-only, optional)
- `src/components/ui/Card.tsx`

## Agent type
`frontend-agent`

## Skill pack
- Required: `executing-plans`, `frontend-design`, `nextjs-app-router-patterns`, `react-best-practices`
- Optional: `seo` (default metadata only)

## Context + tool budget
- Max file reads: 8
- Max grep/glob operations: 6
- Max total tool calls: 12

## Done criteria
- `page.tsx` is async Server Component fetching via query helpers
- Hero: tagline "Spirit Filled. Down to Earth." + CTA to `/plan-a-visit`
- Service times: 8:30 Express(o) + 9:30 Family Worship + renovation note from audit
- Featured announcement, upcoming events (4), latest sermon from Supabase
- Hub cards: Kids & Youth, Groups, Outreach with links
- Newsletter: external link to Mailchimp URL from audit (no embed)
- Graceful empty states if DB empty
- `export const revalidate = 60` on page
- PROGRESS.md updated
