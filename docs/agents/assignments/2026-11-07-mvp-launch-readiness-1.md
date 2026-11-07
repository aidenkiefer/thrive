# Assignment: 2026-11-07-mvp-launch-readiness-1

**Session goal:** Make the merged MVP foundation (PR #2) launch-safe for Nov 13. Harden admin writes, prepare a reviewable schema/import path, capture a **fresh audit of the live site**, build the visitor-essential pages from that audit, and put real SEO and quality gates in place.
**Inputs read:** `docs/08-mvp-status-roadmap.md`, `docs/09-implementation-handoff.md`, `docs/plans/PROGRESS.md`, PR #1 + #2 bodies, `docs/04-seo-url-migration-map.md`, spot checks of `next.config.ts`, `src/middleware.ts`, `src/app/(public)/*`, `package-lock.json`.
**Owner approval:** approved 2026-11-07 (revision 2: Codex on the audit, ops split between Claude and Cursor)

## Lane map

| Lane | Tool | Branch | Worktree | Default tier | Tickets |
|---|---|---|---|---|---|
| data | claude | `claude/data-launch-hardening` | `../thrive-worktrees/claude-data-launch-hardening` | T2 design → T1 implement | D1–D5 |
| ops-quality | claude (2nd, after data PR opens) | `claude/ops-quality-gates` | `../thrive-worktrees/claude-ops-quality-gates` | T1 | Q1–Q3 |
| experience (+SEO) | cursor | `cursor/experience-visitor-pages` | `../thrive-worktrees/cursor-experience-visitor-pages` | T1 | E1–E6, R1 |
| audit | codex | `codex/audit-live-site` | `../thrive-worktrees/codex-audit-live-site` | T1 (T0 for write-ups) | A1–A5 |

Claude runs its two lanes **one after the other**, each in its own worktree and PR. It starts ops-quality only after the data PR is open.

## Ownership overrides (this session)

These replace the defaults in `roles-and-lanes.md` §2 for this session:

| Paths | Owner |
|---|---|
| `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `docs/04-seo-url-migration-map.md` | **experience** (cursor) |
| `package.json`, `package-lock.json`, `eslint.config.*`, `vitest.config.*`, `tests/**`, `scripts/agents/gate.sh`, `.github/**` | **ops-quality** (claude) |
| `docs/01-current-site-audit.md`, `docs/02-content-inventory.md`, `docs/audit/**`, `docs/10-launch-checklist.md`, `docs/INDEX.md` | **audit** (codex) |
| `supabase/**`, `src/lib/**` (except `mdx.ts`), `src/app/admin/**`, `src/app/api/**`, `src/middleware.ts`, `scripts/**` (except `scripts/agents/**`), `migration-files/**`, `docs/admin-setup.md` | **data** (claude) |
| `src/app/layout.tsx`, `tailwind.config.ts`, `src/lib/mdx.ts`, `content/**`, `src/components/**` (except admin), `src/app/(public)/**`, `src/app/[slug]/**` | **experience** (cursor) |

## Contracts

| ID | Provider → consumer | Shape | File | Lands by |
|---|---|---|---|---|
| C1 | audit → experience | Verbatim live copy for the visitor pages: headings, body, CTAs, links, embedded forms, image URLs, source URL, capture date | `docs/audit/2026-11/pages/{about,give,kids-youth,youth-alpha,plan-a-visit,get-connected}.md` | A1 `[contract]` PR, fast-merged |

Until C1 lands, Cursor works on E4, E5, and R1, and scaffolds E1–E3/E6 wiring with no copy.

## Merge order

1. **A1 contract** (`[contract]`, fast-merge as soon as it's green)
2. **data:** security hardening
3. **ops-quality:** lint/test/audit changes; other branches rebase onto the lint config
4. **experience:** pages + redirects
5. **audit (rest):** docs only

---

## Lane: data, launch hardening

**Tool:** claude · **Branch:** `claude/data-launch-hardening` · **Default tier:** T2 to design, T1 to implement (`opusplan` fits)
**Owned paths:** `supabase/**`, `src/lib/**` (except `src/lib/mdx.ts`), `src/app/admin/**`, `src/app/api/**`, `src/middleware.ts`, `scripts/**` (except `scripts/agents/**`), `migration-files/**`, `.env.local.example`, `docs/admin-setup.md`
**Read first (≤3):** `src/lib/admin-auth.ts`, `src/lib/admin-db.ts`, `docs/09-implementation-handoff.md`
**Out of scope:** new admin features, UI redesign of admin, running the seed or touching a live database

### Tickets

**D1 · Server-action auth defense-in-depth** · M · T2→T1
- Task: Every admin server action verifies the NextAuth session itself, not just middleware, because actions write with the service-role key.
- Files: `src/lib/admin-auth.ts` (add `requireAdmin()`), each `'use server'` file under `src/app/admin/**`
- Done when: every exported server action calls `requireAdmin()` before any read/write (grep shows full coverage); unauthorized calls fail closed (throw or redirect to `/admin/login`); middleware behavior unchanged.
- Skills: `nextjs-supabase-auth`, `backend-dev-guidelines`

**D2 · Publish-time validation for MVP content types** · M · T1
- Task: Server-side validation so announcements, sermons, one-time events, recurring events, and occurrences can't be **published** with missing required fields, invalid or reversed dates, or broken relationships. Show clear error feedback in the form.
- Files: the matching server actions/pages under `src/app/admin/{announcements,sermons,events,recurring-events}/**`, a shared validator in `src/lib/` if useful
- Done when: each type rejects incomplete publish attempts with a specific message; drafts can still be saved incomplete; no client-side-only validation.
- Skills: `backend-dev-guidelines`

**D3 · Reviewable schema apply path** · M · T2
- Task: Produce an **idempotent** SQL migration that brings a database created from the June schema (`git show cd012bd:supabase/schema.sql`) up to the current `supabase/schema.sql`, and review RLS on every table.
- Files: `supabase/migrations/20261107000000_mvp_foundation.sql`, `supabase/README.md` (apply steps + RLS review notes)
- Done when: the migration uses `IF NOT EXISTS` / guarded `ALTER`s and can run twice safely; README lists the apply order (fresh project → `schema.sql`; existing June DB → migration) and flags any table without RLS. **Nothing is run against a live DB.**
- Skills: `postgres-best-practices`

**D4 · Import readiness check + Express(o) schedule** · S · T1
- Task: Verify the current export pipeline before the owner seeds: Chicago DST handling (no fixed `-05:00`), slug uniqueness, published counts (120 sermons / 80 events), idempotent re-run behavior of `scripts/seed-current.ts`. **Resolve the Express(o) hold with the owner-provided schedule:** weekly, Sundays 8:30 AM America/Chicago, in the cafe (source: owner, 2026-11-07).
- Files: `migration-files/parse-current-exports.py`, `scripts/seed-current.ts` (fix clear bugs only), new `migration-files/parsed/import-readiness.md`
- Done when: the readiness doc states each check with evidence (counts, sample rows, DST examples around 2026-03-08 and 2026-11-01); any bug fixed is logged; Express(o) is a normal recurring event in the parsed outputs with its source noted, not an exception.
- Skills: none

**D5 · Middleware Edge Runtime warning** · S · T1 (escalate if the fix touches auth semantics)
- Task: Remove the Supabase `process.version` Edge Runtime warning from the middleware path without changing admin protection.
- Files: `src/middleware.ts`, `src/lib/supabase/middleware.ts`
- Done when: the build log no longer shows the warning; `/admin/**` (except `/admin/login`) still redirects without a NextAuth token. If you drop the Supabase session refresh from middleware, `scribe log decision:` says why it's unused.
- Skills: `nextjs-app-router-patterns`

**Lane done when:** D1–D5 done or parked with a reason · gate passes · PR open with scribe body · QA focus items below are easy to verify from the PR.

---

## Lane: ops-quality, lint, tests, dependency safety (Claude, 2nd branch)

**Tool:** claude · **Branch:** `claude/ops-quality-gates` (create after the data PR is open; rebase onto `main` once data merges) · **Default tier:** T1
**Owned paths:** see ownership overrides (ops-quality row)
**Out of scope:** fixing app code that tests or lint flag in other lanes (log requests instead)

**Q1 · ESLint flat config, non-blocking this session** · S · T1
- Task: Add `eslint.config.mjs` (Next core-web-vitals + TypeScript) and switch `npm run lint` to the ESLint CLI (`next lint` is deprecated in Next 15.5). Existing violations are **warnings** this session so every lane's gate stays green.
- Done when: `npm run lint` exits 0; warning counts per lane are in the session log for QA.

**Q2 · Test foundation + DST tests** · M · T1
- Task: Add Vitest. Unit-test the pure date/time-label and recurrence helpers in `src/lib/**`, including America/Chicago DST boundaries (2026-03-08, 2026-11-01) and the Express(o) weekly Sunday 8:30 rule. Add `npm test` to `scripts/agents/gate.sh` and CI.
- Done when: `npm test` runs in the gate and CI. Tests exposing real bugs in experience code are skipped with a `scribe log request`. Data-lane bugs you may fix on the data branch if it's still open; otherwise log them.
- Skills: `test-driven-development`

**Q3 · Dependency audit triage** · S · T1 (T2 if a fix needs a major upgrade)
- Task: Resolve the 2 critical / 7 high `npm audit` findings with non-breaking upgrades (no `--force`).
- Done when: the PR body lists before/after counts and every remaining finding with a reason.

---

## Lane: experience, visitor pages + redirects (Cursor)

**Tool:** cursor · **Branch:** `cursor/experience-visitor-pages` · **Default tier:** T1
**Owned paths:** see ownership overrides (both experience rows)
**Read first (≤3):** `src/app/(public)/plan-a-visit/page.tsx` + `content/pages/plan-a-visit.mdx` (MDX pattern), C1 audit pages (once merged), `docs/07-design-system.md`
**Out of scope:** the deferred full-site copy migration, new data queries, admin UI

**Content rule:** every sentence of page copy must trace to the C1 audit files (or, before they land, `docs/01-current-site-audit.md`) or to an existing canonical record. Add an MDX comment naming the source file and section. Missing facts render an intentional "contact us / coming soon" state and get a `scribe log blocker`. **Never invent.**

**Forms rule (owner, 2026-11-07):** signup forms are embedded ChurchSuite forms. For a form ChurchSuite doesn't provide, an embedded Google Form is allowed. Embed only form URLs that appear in the audit or that the owner confirms.

**E1 · About page from MDX** · M · T1
- Files: `content/pages/about.mdx`, `src/app/(public)/about/page.tsx`
- Done when: renders through `src/lib/mdx.ts`; all copy is C1-sourced with comments; links to `/about/team`; metadata set.
- Skills: `frontend-design`

**E2 · Give page from MDX** · S · T1
- Files: `content/pages/give.mdx`, `src/app/(public)/give/page.tsx`
- Done when: the giving CTA uses the giving URL/provider from C1 (A1 captures it), or shows a pending state plus a blocker log entry.

**E3 · Kids & Youth page from MDX** · S · T1
- Files: `content/pages/kids-youth.mdx`, `src/app/(public)/kids-youth/page.tsx`
- Done when: renders C1 copy; links to the Youth Alpha ministry page (E6).

**E4 · Global not-found + error states** · S · T1
- Files: `src/app/not-found.tsx`, `src/app/error.tsx`
- Done when: branded pages for unknown routes and thrown errors; client `error.tsx` has no Supabase; no fabricated content.

**E5 · Mobile + keyboard pass** · M · T1
- Task: homepage, `/events`, `/sermons`, and E1–E3/E6 pages at 375px and keyboard-only. Fix issues in lane files (focus order, visible focus, 44px targets, overflow).
- Done when: session log lists pages × issues found/fixed; no horizontal overflow at 375px. Use the browser tool or the Vercel preview.
- Skills: `mobile-design`

**E6 · Youth Alpha as its own ministry page** · S · T1
- Task: Youth Alpha is a separate ministry (owner). Its canonical home is the ministry record at `/ministries/youth-alpha`, rendered by the existing `ministries/[slug]` route. Make sure that route presents a ministry well (hero, description, schedule/CTA, form embed slot). The **owner** creates the record in `/admin/ministries` from the A1 copy; agents don't insert data.
- Files: `src/app/(public)/ministries/[slug]/page.tsx`, ministry components
- Done when: the route renders a complete ministry layout with intentional empty states for missing fields; the session log hands off the exact field values from C1 for the owner to enter.

**R1 · Redirects + sitemap** · M · T1
- Task: Implement every **decided** row in `docs/04-seo-url-migration-map.md` and add a status column (implemented / pending-audit / same-path). Decided now: `/youth-alpha/` → `/ministries/youth-alpha` (301). Taxonomy routes (`/topics/*`, `/book/*`, `/service-type/*`) → `/sermons` as **temporary** (`permanent: false`) until filters exist. Rows still undecided wait for A2's recommendations.
- Files: `next.config.ts`, `src/app/sitemap.ts`, `docs/04-seo-url-migration-map.md`
- Done when: no redirect loops; no redirect shadows a live route; new pages appear in the sitemap.
- Skills: `seo`

---

## Lane: audit, fresh live-site audit (Codex)

**Tool:** codex · **Branch:** `codex/audit-live-site` · **Default tier:** T1; T0 for write-ups
**Owned paths:** see ownership overrides (audit row)
**Source:** the public site at https://www.thrivevineyard.com/ (no logins). Fetch the pages (browser, web fetch, or `curl`) and also check the WordPress sitemap (`/wp-sitemap.xml` or `/sitemap_index.xml`). **Record only what the site shows**, with source URL and capture date. Mark anything unreachable or ambiguous; never fill gaps.
**Out of scope:** editing app code, MDX, or `next.config.ts`; your recommendations go in the audit files and other lanes act on them

**A1 · Visitor-page copy capture** · M · T1 · **contract C1, open as a `[contract]` PR first**
- Task: For About, Give, Kids & Youth, Youth Alpha, Plan a Visit (I'm New), and Get Connected, capture verbatim headings, body copy, CTAs and their link targets, embedded forms (provider + embed/form URL), giving provider + URL, and image URLs.
- Files: `docs/audit/2026-11/pages/<slug>.md` (one per page) + `docs/audit/2026-11/README.md`
- Done when: each file has source URL, capture date, and sections in page order; Plan a Visit notes differences from `content/pages/plan-a-visit.mdx`.

**A2 · Full URL + page inventory with redirect recommendations** · M · T1
- Task: Every public URL from the sitemap and nav: type (page/post/sermon/event/taxonomy), title, status, mapped new-site route, and a **recommended redirect** for every row `docs/04` marks TBD/Decide (`/get-connected/`, `/prayer/`, `/volunteering/`, `/expresso/`, taxonomy routes), with a one-line reason from the page's content.
- Files: `docs/audit/2026-11/url-inventory.md`
- Done when: every URL is accounted for; recommendations are ready for the owner to accept and for experience to implement.

**A3 · Forms, giving, embeds, tracking** · S · T1
- Task: Inventory every form (page, purpose, provider: ChurchSuite / Gravity Forms / other, embed URL), the giving provider, livestream/video embeds, podcast feed, newsletter signup, and tracking tags visible in page source (GTM / GA4 / Ads IDs).
- Files: `docs/audit/2026-11/integrations.md`
- Done when: each item has page + evidence; forms not on ChurchSuite are flagged as Google-Form candidates.

**A4 · Refresh the old audit docs** · S · T0
- Files: `docs/01-current-site-audit.md`, `docs/02-content-inventory.md`
- Done when: both point to the 2026-11 audit, stale facts are marked or updated, and nothing is duplicated wholesale.

**A5 · Launch checklist** · S · T0
- Task: `docs/10-launch-checklist.md`: every owner step for Nov 13: Supabase schema apply (D3) + seed (D4), Vercel **Preview** env vars (Production is already set; the owner fixes Preview), Search Console + active Ads URL review, forms (ChurchSuite / Google Forms), giving link, Youth Alpha + Express(o) records, church content approval, domain/DNS, rollback.
- Files: `docs/10-launch-checklist.md`, `docs/INDEX.md`
- Done when: each item has owner, source doc, and done-when; nothing invented.

---

## QA focus

- **D1 is a security fix:** *every* `'use server'` export under `src/app/admin/**` calls `requireAdmin()` first and fails closed. Get a cross-family second opinion (Codex `/review`) on D1 + D5.
- **D3 migration:** idempotent and non-destructive; RLS on every table.
- **Copy provenance:** spot-check 5 sentences per new page against the C1 audit files. Any un-sourced fact → FIX-FIRST.
- **R1 redirects:** no loops, no shadowing of `/sermons/:slug` or `/events/:slug`; taxonomy redirects are temporary.
- **Q1/Q2:** gate stays green on every rebased branch after ops-quality merges.

## Owner decisions

| # | Decision | Status |
|---|---|---|
| 1 | Giving link | A1/A3 capture it from the live site → owner confirms |
| 2 | Forms | **Decided:** ChurchSuite embeds; Google Forms embeds for forms ChurchSuite doesn't cover |
| 3 | Youth Alpha | **Decided:** own ministry page at `/ministries/youth-alpha`; `/youth-alpha/` 301s there; owner enters the record from A1 copy |
| 4 | Undecided redirects (`/get-connected/`, `/prayer/`, `/volunteering/`, `/expresso/`) | A2 recommends from the actual page content → owner accepts → experience implements (this session if time allows, else next) |
| 5 | Express(o) | **Decided:** weekly, Sundays 8:30 AM, in the cafe |
| 6 | Supabase/Vercel env | Production set; **owner** configures Preview env vars |
