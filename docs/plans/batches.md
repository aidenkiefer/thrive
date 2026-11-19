# Delivery batches (2026-11-19)

Project 3 field **Batch** orders the open issues into sessions. Within a batch, lanes work in parallel on disjoint files; a batch starts when its gate (below) is met, not on a date (no dates are set). Batches 1-2 are the earlier kickoff and RC2/draft-handoff sessions. Sources: `docs/plans/roadmap-milestones.md`, `docs/plans/backlog/*.md`.

## Batch 3: unblocked now
Gate: none. Start immediately.

| Lane (tool) | Order | Issues | Notes |
|---|---|---|---|
| Experience (Cursor) | 1 to 4 | #34 error pages, #36 sermon media, #38 `/og` image, #47 mobile QA | #47 last: it owns `globals.css` this batch (broadest). Confirm `src/app/(public)/og/route.tsx` is in lane (#38 says so) |
| Ops | 1 to 3 | #62 redirect manifest harness, #73 `wp-content` guard, #30 hygiene | Ops is sole owner of `package.json`/lockfile this batch. #62 does not touch `next.config.ts` (that is #63, Batch 4) |
| Data (Claude) | n/a | #60 disposable-Postgres migration rehearsal; finish R2 (#80, #32) | #60 validates the #15/#18/#23 migration chain |
| Senior QA (Cursor/Claude) | n/a | QA and merge the Data stack (#15, #18, #23) | Retarget #18 and #23 to `main` after #15 squash-merges |

## Batch 4: after the Data stack lands
Gate: #15, #18, #23 merged (and R2 merged for the CMS rows).

| Lane | Issues | Notes |
|---|---|---|
| Data | #39 seed safety, #40 reserved slugs, #44 revalidation helper, #45 RLS matrix tests, #48 API route and limiter inventory | #39 appends to `supabase/README.md` (also edited by #23): rebase after #23. #40 needs a cross-lane edit to `src/app/[slug]/page.tsx` (Experience owns it): file it as a cross-lane request |
| CMS | #33 restore previous version, #42 series and speakers editors | Start only after R2 (#80) merges: same admin files |
| Experience | #43 OG/Twitter metadata, #61 accessibility pass, #37 and #51 feedback link | #43 after #38. #61 after #47 (`globals.css`). #51 needs #15's `/api/forms/feedback`; owner must say whether the link may go live before form email is provisioned |
| Ops | #62-follow-up #63 activate redirects, #64 Playwright smoke tests, #68 Vercel/Preview audit | #63 needs #62 and the disposition spec (merged in #85). `next.config.ts` has Ops as sole owner. #64 owns `package.json` |

## Batch 5: needs Preview and owner
Gate: the pre-launch Supabase project (the production project; see [owner-decisions.md](owner-decisions.md)) prepared and seeded (#54 answered, #41 done); owner inputs for photos and branding.

#41 migration rehearsal on Preview, #46 verify announcements, #31 and #35 verify staff accounts and form email on Preview (built in #15/#18), #49 admin image handling (storage decision), #59 re-host photos (P0), #56 favicon/logo, #67 performance pass (after #59).

## Batch 6: launch readiness and cutover
Gate: Batches 4-5 mostly done; owner launch decisions (#57) answered.

#52 verify release URLs and media, #69 cutover runbook, #70 Supabase production readiness, #72 monitoring, #74 go/no-go, #75 PROGRESS hygiene (senior QA only), #66 e2e CI (M4).

## Owner track (parallel, whole time)
#54 Preview provisioning, #55 ministry content and destinations, #57 launch decisions. Answers unlock Batch 5 and 6; none gate Batch 3 or 4.

## Post-MVP
#50 form submission storage and admin view, #53 admin activity log, #71 dependency hygiene, #76 sermon search, #78 month view.

## Rules
- A ticket moves up a batch only when its gate is met; update the Batch field, not the milestone.
- Hot files stay single-owner per batch (`package.json`, `next.config.ts`, `globals.css`, `supabase/schema.sql`).
- Closed duplicates: #65 (see #54), #77 (see #55, #57), #84 (see #63).
