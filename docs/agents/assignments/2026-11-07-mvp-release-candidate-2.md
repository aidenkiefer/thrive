# Assignment draft: 2026-11-07-mvp-release-candidate-2

**Session goal:** Close the remaining staff-editing and visitor-path gaps and produce repeatable release-candidate evidence without changing the live database.
**Inputs:** launch-readiness-1 assignment; QA checkpoint `docs/agents/qa/2026-11-07-mvp-launch-readiness-1.md`; roadmap and PROGRESS; reviewed PRs #4-#8.
**Owner approval:** Draft prepared under delegated planning authority; NOT launched. Finalize only after #8 and #5 merge and the resulting main gate passes. Reconcile changes then; never duplicate open-PR work.

## Lane map

| Lane | Tool / role | Branch | Worktree | Tier |
|---|---|---|---|---|
| data | Claude / backend builder | `claude/data-release-candidate-2` | `../thrive-worktrees/claude-data-release-candidate-2` | T2 design, T1 implementation |
| experience | Cursor / visitor experience builder | `cursor/experience-release-candidate-2` | `../thrive-worktrees/cursor-experience-release-candidate-2` | T1 |
| ops | Codex / release verification builder | `codex/ops-release-candidate-2` | `../thrive-worktrees/codex-ops-release-candidate-2` | T1 |

## Ownership and hot files

- Data: `supabase/**`, `src/lib/**` except `src/lib/mdx.ts`; `src/app/admin/**`, `src/components/admin/**`; own session log. No parser/seed changes this session.
- Experience: `content/**`, `src/app/(public)/**`, `src/app/[slug]/**`, `src/app/{layout.tsx,globals.css,error.tsx,not-found.tsx}`, `src/components/**` except `src/components/admin/**`, `src/lib/mdx.ts`, `public/**`, `tailwind.config.ts`; own session log.
- Ops: `tests/**`, `e2e/**`, `scripts/agents/**`, `.github/**`, `.gitignore`, `package.json`, `package-lock.json`, `eslint.config.*`, `vitest.config.*`, `playwright.config.*`, `next.config.ts`, `src/app/{sitemap.ts,robots.ts}`, `docs/04-seo-url-migration-map.md`, `docs/10-launch-checklist.md`; own session log.
- Hot files: package/lock, Next config, test/lint config = ops; schema, Supabase types, query index = data; root layout/Tailwind = experience. PROGRESS and QA reports remain senior QA only; assignments remain PM only.

## Contract and merge order

| Contract | Provider / consumer | Shape | Lands by |
|---|---|---|---|
| C2 | data -> experience | Ministry rows expose nullable `schedule_description: string | null` and `churchsuite_form_url: string | null` through existing published ministry queries; source-approved HTTPS ChurchSuite form destinations only. Existing records remain valid with null values. | D1 small contract PR first |

Merge C2 first, remaining data next, then ops and experience (experience rebases after test/tooling changes). E1/E2 and ops O1/O2 have no dependency on C2. If C2 cannot land early, defer E3; do not stub provider files. No second data representation of ministry/event facts.

## Data lane

Read first: QA report, `src/lib/admin-form.ts`, current ministry schema/types/query. No live schema apply, seed, credentials or deployment changes. Use lane-builder and relevant backend/auth/Postgres guidance lazily.

**D1 - Nullable canonical ministry schedule/form contract** - M - T2 -> T1
- Task: Supply C2 through schema migration, types, query and protected ministry admin editor; use existing suitable fields instead if found at kickoff and document exact equivalent contract before implementation.
- Files: `supabase/schema.sql`, new `supabase/migrations/*_ministry_schedule_forms.sql`, `supabase/README.md`, `src/lib/supabase/types.ts`, `src/lib/queries/ministries.ts`, `src/app/admin/ministries/**`, `src/lib/admin-validation.ts`.
- Done when: null fields preserve existing records; guarded migration is repeatable in a disposable DB; server-side publish validation rejects unsafe/unapproved form destinations; no API sync, guessed schedules or inserted records. Open contract PR first.

**D2 - Preserve rejected admin form input** - M - T1
- Task: Keep submitted values and show actionable validation feedback for announcement, sermon, event and recurring-event editors after rejected saves.
- Files: `src/lib/admin-form.ts`, `src/app/admin/_components/**`, `src/app/admin/{announcements,sermons,events,recurring-events}/**`.
- Done when: invalid publish retains input and errors; correcting it succeeds in a disposable/mock environment; unauthorized actions still fail closed and drafts retain current behavior. Avoid query-string storage of submitted content.

**D3 - Shared owner-confirmed service schedule** - S - T1
- Task: Correct stale Express(o) paused state in shared service-time data using the existing owner decision, preserving canonical schedule consumption.
- Files: `src/lib/constants/service-times.ts`.
- Done when: shared definition says weekly Sunday 8:30 AM America/Chicago in the cafe; no fabricated additional schedule facts; consuming public surfaces are listed for QA.

## Experience lane

Read first: merged C1/audit, design system, QA report. Use lane-builder; load frontend/mobile guidance only as needed. No data schema, new queries or invented contact/forms.

**E1 - Audited connection path** - M - T1
- Task: Produce useful Get Connected content from merged audit; reuse confirmed internal destinations and explicit unavailable-form states. Do not duplicate an existing route or already-merged #8 work.
- Files: `content/pages/get-connected.mdx`, `src/app/(public)/get-connected/**`, `src/components/layout/GlobalNav.tsx`, `src/components/layout/Footer.tsx`.
- Done when: content comments trace facts to audit; navigation resolves; no WordPress Gravity Forms action is treated as an embed; missing approved form URL is reported, with no guessed substitute.

**E2 - Public media and accessibility states** - M - T1
- Task: Verify sermon media absence and public image/keyboard states; fix only observed public-lane issues, including applicable lint warnings.
- Files: `src/app/(public)/sermons/**`, `src/app/(public)/{groups,outreach}/**`, `src/app/[slug]/**`, `src/components/{sermons,events,home}/**`.
- Done when: missing media produces useful intentional UI without dead player controls; 375px and keyboard evidence lists checked routes; changed links/images preserve working destinations. Do not invent replacement media.

**E3 - Render canonical ministry schedule/form fields** - M - T1 - consumes C2
- Task: Render C2 generically through the published ministry route with accessible form framing and intentional null states, replacing page-specific pending logic where applicable.
- Files: `src/app/(public)/ministries/[slug]/page.tsx`, `src/components/ministries/**`.
- Done when: approved populated and null-field fixtures render correctly; only confirmed form destinations embed; exact C1-backed Youth Alpha owner-entry fields and unresolved values are handed off in the session log. No record creation or guessed current dates.

## Ops lane

Read first: QA report, gate/CI, merged redirect map. Use lane-builder and test guidance lazily. App-code fixes are requests to owning lanes.

**O1 - Production-runtime smoke checks** - M - T1
- Task: Add bounded checks for unauthenticated admin rejection, public route/error states and representative redirect status/location behavior, running a built app without live writes.
- Files: `tests/**`, `e2e/**`, `playwright.config.*`, `package.json`, `package-lock.json`, `.github/**`, `scripts/agents/**`.
- Done when: tests fail for a bypass/broken redirect; setup uses disposable/mock data and explicit test credentials only; no private data enters output; real configured-Preview checks remain clearly distinct from local fixtures.

**O2 - URL and release-evidence reconciliation** - M - T1
- Task: Reconcile decided routes with the merged 985-URL audit and public pages; update implementation status and actionable owner checklist.
- Files: `docs/04-seo-url-migration-map.md`, `docs/10-launch-checklist.md`, `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `tests/**`.
- Done when: no loop/shadowing; existing taxonomy redirects stay temporary; undecided routes stay pending with rationale; absent Search Console/Ads inputs are not called verified. No automatic broad redirects from unapproved recommendations.

**O3 - Tooling hygiene and scoped follow-up** - S - T1
- Task: Ignore generated TypeScript build info, remove the config's own lint warning, and recheck the six development audit findings using compatible updates only.
- Files: `.gitignore`, `eslint.config.*`, `package.json`, `package-lock.json`, own session log.
- Done when: a gate leaves no new build-info artifact in status; no broad lint suppression or forced major upgrades; exact remaining findings and reason are recorded. Preserve warning-only policy until cross-lane warnings are intentionally addressed.

## QA and owner decisions

Cross-family auth/schema review, disposable migration repeatability, form URL/provenance checks, 375px/keyboard evidence, and full gate on each integrated branch are required. Run clean `npm ci` then production build before every push; distinguish warnings from failures.

Owner inputs remain: confirmed replacement form URLs, current Youth Alpha dates/record, giving approval, contact-column policy, Preview environment, reviewed schema/seed operation, Search Console/Ads exports and launch approval. No lane runs those live operations.

## Launch preparation (after draft is finalized and published on main)

Run `scripts/agents/worktree.sh new claude data-release-candidate-2`, `scripts/agents/worktree.sh new cursor experience-release-candidate-2`, and `scripts/agents/worktree.sh new codex ops-release-candidate-2`.

In each corresponding worktree: `Use the lane-builder skill. Assignment: docs/agents/assignments/2026-11-07-mvp-release-candidate-2.md. Lane: data.` Replace the lane with `experience` or `ops` for the other tools. These are prepared prompts, not instructions to start tonight.
