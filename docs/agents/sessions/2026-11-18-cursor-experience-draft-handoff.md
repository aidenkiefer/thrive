# Session log: `cursor/experience-draft-handoff`

**Assignment:** owner request 2026-11-18 (draft handoff for pastors; no separate assignment file) · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-18

## Status
Frontend content and design pass complete and gated. Branch integrates experience PRs #8, #19, #17 and #22 (all experience-lane) and adds the content kit, redesigned pages, nav and footer. Not merged. Needs Data PR #12 first so Express(o) shows the owner-confirmed schedule.

## Entries
- `21:55` **decision**: integrate #8 (visitor pages), #19 (ministry display), #17 (feedback form) and #22 (footer/slug wiring) into one branch so the pastors' draft is a single merge. Merging this PR supersedes those four; each remains reviewable on its own commits.
- `22:00` **change**: new content kit in `src/components/content/` (PageHero, Band, SectionIntro, FeatureSplit, StepList, PersonCard, CardGrid/InfoCard, PullQuote, MapEmbed, PendingNote, CtaBand, icons), `site-info.ts` (audited church facts), `photos.ts` (audited live-site photos with alt text checked by viewing the files), `safe-data.ts` (`safely()` fallback), `compile-page.tsx` (MDX helper). (T1)
- `22:05` **change**: pages redesigned with audited content only: home, plan-a-visit, about, about/team, kids-youth, give, new get-connected; events, sermons (+series), groups, outreach, ministries detail restyled with intentional empty states. Nav rebuilt (Give + Plan a Visit actions, Get Connected link, lg breakpoint); footer rebuilt from `SERVICE_TIMES` and `SITE`. (T1, parallel subagents per page group)
- `22:10` **decision**: removed unaudited claims from the old `plan-a-visit.mdx` (age bands per room, "valid photo ID for pickup", on-site parking, ChurchSuite visitor URL). The audit says none appear on the live site. Replaced with the audited five steps.
- `22:15` **decision**: MDX compiled with `blockJS: false` (`blockDangerousJS` stays on) via `src/components/content/compile-page.tsx`. Why: next-mdx-remote v6 silently drops JSX expressions by default, which blanked contact details and component props. Safe only because these files are repo-authored; MDX must never be compiled from user, staff or DB input.
- `22:20` **change**: public data pages wrapped in `safely()`. With no Supabase configured every public route returns 200 with empty states and unknown detail slugs return 404 (verified on a production build with `NEXT_PUBLIC_SUPABASE_URL` unset). Previously these pages threw.
- `22:25` **change**: event, group and outreach signup links now render only when they pass `isApprovedFormUrl` (previously any stored URL linked). Matches the forms rule in AGENTS.md. Event `external_url` links unchanged.
- `22:30` **change**: staff guide for announcements at `docs/staff/announcements.md`, per owner decision to accept "newest featured announcement wins". Docs paths are ops-owned; written at the owner's direct request.
- `22:35` **note**: verification: gate PASS (typecheck, 50 tests on the tree integrated with #12, lint 4 warnings 0 errors, build). All 13 public routes measured at 375px with no horizontal overflow. Desktop screenshots reviewed for home, plan-a-visit, about, team, kids-youth, give, get-connected, events, sermons. Not verified: real Supabase data, Preview deployment, screen reader pass.

- `23:20` **note**: independent senior QA review (generalPurpose subagent, skill procedure, scratch worktree, read-only). Verdict #12 MERGE, #24 FIX-FIRST, no blockers; #12 then #24 merge with no conflicts; integrated gate PASS (50 tests). Fixed in this branch: unknown top-level URLs 500 without a database (`[slug]` now uses `safely()`, `get-connected` reserved); footer `/feedback` link hidden until Data PR #15 provides `/api/forms/feedback`; `safely()` logs with `console.error` when `VERCEL_ENV=production`; primary buttons, map link and nav links now 44px with a focus ring; mobile drawer closes when the window is widened; staff doc expiry rule corrected; Hub cards use fixed neutral text; Give mailto links use `SITE.email`; photo alts no longer infer relationships or ages; `getMdxContent` takes a basename only; `site-info.ts` header now says where the social URLs come from.
- `23:20` **note**: QA items deliberately not fixed here: `/sitemap.xml` returns 500 without a database (ops-owned `src/app/sitemap.ts`, same request as the `/get-connected` entry); `docs/04-seo-url-migration-map.md` row for `/get-connected` still says "TBD" (ops); `EventDetail` hides an `external_url` that equals an unapproved signup URL (nit).

## Copy edits for pastor review (audited wording changed)
- about: "What if took" corrected to "What if we took"; "Then August of 2009" to "In August of 2009".
- about: Molly's living-room quote merged into one quote (comma to period; "Molly told them" removed; attributed to Molly Kiefer). Words unchanged.
- about: 2016 sentence ended "downstairs..." in the capture; ended with a period.
- about: Kevin's quote marks made consistent curly quotes.
- about: team bios moved to `/about/team`; `/about` keeps the history and a pastors teaser.
- plan-a-visit/home/get-connected: "programing" corrected to "programming"; step 3 on the homepage teaser is shortened.
- team: role "Co-Pastor" (from the history text) and "Children's Ministry & Youth Group" for Jjay (from the bio wording). Staff portraits are matched to people by file name and audit image order.

## Requests and blockers
- `22:40` **request**: ops: add `/get-connected` to `src/app/sitemap.ts` (route is new; same path as the legacy URL, no redirect needed).
- `22:40` **request**: data: add a `/feedback` link to the admin layout nav (admin chrome is data-owned). The public footer link is hidden until PR #15 lands the API route; restore it in `Footer.tsx` then.
- `23:20` **request**: ops: `src/app/sitemap.ts` must not throw when Supabase is unset (it 500s today) and needs `/get-connected`; update the `docs/04` row for `/get-connected` to same-path.
- `22:40` **blocker**: Data PR #12 must merge first. `SERVICE_TIMES` on `main` still marks Express(o) paused; every service-time surface (home, plan-a-visit, footer, get-connected) reads that constant, so the draft would show "Currently paused for building renovations" against the owner's 2026-11-07 decision.
- `22:40` **blocker**: owner inputs still missing, shown as "Coming soon" notes: visit and contact forms (approved ChurchSuite or Google Form URLs), The Nest and Youth Group descriptions, Give on Sunday text, What We Believe, prayer request form, Youth Alpha schedule and signup.
- `22:40` **note**: photos load from `thrivevineyard.com/wp-content/uploads` (allowed in `next.config.ts` already). Re-host in Supabase Storage or `/public` before the WordPress site is retired, then drop that remote pattern.
- `22:40` **note**: sermons, events, groups and outreach show empty states until the owner applies the schema and runs the seed (supabase/README.md, migration-files/parsed/import-readiness.md). Seeding a Preview database is the biggest remaining step for a convincing draft.
- `22:40` **note**: GTM/Ads tags (RC2 E1) and the dedicated `/get-connected` contact form are not part of this pass.
