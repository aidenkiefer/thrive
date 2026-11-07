# Assignment: 2026-11-07-mvp-launch-readiness-1

**Session goal:** Make the merged MVP foundation (PR #2) launch-safe for Nov 13: harden admin writes, prepare a reviewable schema/import path, fill the visitor-essential pages from approved sources, and put real SEO + quality gates in place.
**Inputs read:** `docs/08-mvp-status-roadmap.md`, `docs/09-implementation-handoff.md`, `docs/plans/PROGRESS.md`, PR #1 + #2 bodies, `docs/04-seo-url-migration-map.md` (head), spot checks of `next.config.ts`, `src/middleware.ts`, `src/app/(public)/*`, `package-lock.json`.
**Owner approval:** pending

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| data | claude | `claude/data-launch-hardening` | `../thrive-worktrees/claude-data-launch-hardening` | T2 design → T1 implement |
| experience | cursor | `cursor/experience-visitor-pages` | `../thrive-worktrees/cursor-experience-visitor-pages` | T1 |
| ops | codex | `codex/ops-seo-quality` | `../thrive-worktrees/codex-ops-seo-quality` | T1 |

## Hot-file owners (this session)

| File | Owner lane |
|---|---|
| `package.json`, `package-lock.json`, `eslint.config.*`, test config | ops |
| `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts` | ops |
| `supabase/schema.sql`, `supabase/migrations/**`, `src/lib/supabase/types.ts` | data |
| `src/middleware.ts`, `src/lib/admin-auth.ts` | data |
| `src/app/layout.tsx`, `tailwind.config.ts`, `src/lib/mdx.ts` | experience |
| `scripts/agents/gate.sh`, `.github/**` | ops |

## Contracts

| ID | Provider → consumer | Shape | File | Lands by |
|---|---|---|---|---|
| C1 | data → ops | **Signature freeze:** date/time and recurrence helpers in `src/lib/**` keep their exported names and signatures this session (behavior fixes are fine). Ops writes tests against them | `src/lib/**` (whatever O3 targets) | Session start (no PR needed) |

If data must change a frozen signature, it logs `scribe log request: ops …` and QA reconciles at merge.

## Merge order

1. **data:** security hardening first; ops tests rebase onto it
2. **ops:** package/lint/test changes; experience rebases onto the lint config
3. **experience:** lowest risk; final rebase picks up everything

---

## Lane: data, launch hardening

**Tool:** claude · **Branch:** `claude/data-launch-hardening` · **Default tier:** T2 to design, T1 to implement (`opusplan` fits)
**Owned paths:** `supabase/**`, `src/lib/**` (except `src/lib/mdx.ts`), `src/app/admin/**`, `src/app/api/**`, `src/middleware.ts`, `scripts/**` (except `scripts/agents/**`), `migration-files/**`, `.env.local.example`, `docs/admin-setup.md`
**Read first (≤3):** `src/lib/admin-auth.ts`, `src/lib/admin-db.ts`, `docs/09-implementation-handoff.md`
**Out of scope:** new admin features, UI redesign of admin, running the seed or touching a live database, Express(o) schedule (owner decision)

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

**D4 · Import readiness check** · S · T1
- Task: Verify the current export pipeline before the owner seeds: Chicago DST handling (no fixed `-05:00`), slug uniqueness, published counts (120 sermons / 80 events), idempotent re-run behavior of `scripts/seed-current.ts`.
- Files: `migration-files/parse-current-exports.py`, `scripts/seed-current.ts` (fix clear bugs only), new `migration-files/parsed/import-readiness.md`
- Done when: the readiness doc states each check with evidence (counts, sample rows, DST examples around 2026-03-08 and 2026-11-01); any bug fixed is logged; Express(o) is listed as an owner decision.
- Skills: none

**D5 · Middleware Edge Runtime warning** · S · T1 (escalate if the fix touches auth semantics)
- Task: Remove the Supabase `process.version` Edge Runtime warning from the middleware path without changing admin protection.
- Files: `src/middleware.ts`, `src/lib/supabase/middleware.ts`
- Done when: the build log no longer shows the warning; `/admin/**` (except `/admin/login`) still redirects without a NextAuth token. If you drop the Supabase session refresh from middleware, `scribe log decision:` says why it's unused.
- Skills: `nextjs-app-router-patterns`

**Lane done when:** D1–D5 done or parked with a reason · gate passes · PR open with scribe body · QA focus items below are easy to verify from the PR.

---

## Lane: experience, visitor-essential pages

**Tool:** cursor · **Branch:** `cursor/experience-visitor-pages` · **Default tier:** T1
**Owned paths:** `src/app/(public)/**`, `src/app/page.tsx`, `src/app/[slug]/**`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/components/**` (except `src/components/admin/**`), `content/**`, `src/lib/mdx.ts`, `public/**`, `tailwind.config.ts`
**Read first (≤3):** `src/app/(public)/plan-a-visit/page.tsx` + `content/pages/plan-a-visit.mdx` (the MDX pattern to copy), `docs/01-current-site-audit.md` (the **only** copy source), `docs/07-design-system.md`
**Out of scope:** the deferred full copy/content migration, new data queries, admin UI, redirects (ops owns `next.config.ts`; request them)

**Content rule:** every sentence of page copy must trace to `docs/01-current-site-audit.md` or an existing canonical record. Put an MDX comment with the audit section it came from. Missing facts (URLs, times, names) render an intentional "coming soon / contact us" state and go into the owner-decisions list. **Never invent.**

### Tickets

**E1 · About page from MDX** · M · T1
- Task: Replace the `/about` shell with an MDX-backed page (`content/pages/about.mdx`) following the plan-a-visit pattern; link to `/about/team` (staff records).
- Files: `content/pages/about.mdx`, `src/app/(public)/about/page.tsx`
- Done when: page renders MDX through `src/lib/mdx.ts`; all copy is audit-sourced with section comments; metadata (title/description) set.
- Skills: `frontend-design`

**E2 · Give page from MDX** · S · T1
- Task: `/give` explains giving paths using audit-sourced copy and links to the existing giving destination **only if** its URL appears in the audit.
- Files: `content/pages/give.mdx`, `src/app/(public)/give/page.tsx`
- Done when: the giving CTA uses an audited URL, or shows a pending state plus an owner-decision log entry.

**E3 · Kids & Youth page from MDX** · S · T1
- Task: `/kids-youth` from audit-sourced copy, including a `#youth-alpha` section anchor (the redirect map's recommended target for `/youth-alpha/`).
- Files: `content/pages/kids-youth.mdx`, `src/app/(public)/kids-youth/page.tsx`
- Done when: the page renders and the `id="youth-alpha"` anchor exists; `scribe log request: ops add /youth-alpha → /kids-youth#youth-alpha redirect` if ops hasn't already.

**E4 · Global not-found + error states** · S · T1
- Task: Branded `not-found.tsx` and `error.tsx` (client component, no Supabase), consistent with the page shell; helpful links (Plan a Visit, Sermons, Events).
- Files: `src/app/not-found.tsx`, `src/app/error.tsx`
- Done when: unknown routes and thrown errors render branded pages with no fabricated content.

**E5 · Mobile + keyboard pass** · M · T1
- Task: Check homepage, `/events`, `/sermons`, and E1–E3 pages at 375px and with keyboard only. Fix issues in lane files: focus order, visible focus, 44px targets, overflow.
- Files: lane files as needed (log each fix)
- Done when: session log lists checked pages × issues found/fixed; no horizontal overflow at 375px on the checked pages. Use the browser tool or the Vercel preview URL.
- Skills: `mobile-design`

**Lane done when:** E1–E5 done or parked · gate passes · PR open with screenshots or preview links in the body.

---

## Lane: ops, SEO + quality gates

**Tool:** codex · **Branch:** `codex/ops-seo-quality` · **Default tier:** T1
**Owned paths:** `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `.github/**`, `scripts/agents/**`, test files (`**/*.test.ts`, `tests/**`), test + lint config, `package.json`, `package-lock.json`, `tsconfig.json`, `docs/**` (except `docs/agents/sessions/*`, `docs/plans/PROGRESS.md`, `docs/admin-setup.md`)
**Read first (≤3):** `docs/04-seo-url-migration-map.md`, `next.config.ts`, `docs/09-implementation-handoff.md`
**Out of scope:** changing app behavior in data/experience files (tests that find bugs → cross-lane request), running the seed, Vercel dashboard changes

### Tickets

**O1 · Redirect coverage from the approved map** · M · T1
- Task: Implement every redirect in `docs/04-seo-url-migration-map.md` whose destination is decided (High first). Add a status column to the map: implemented / owner-decision / no-op (same path).
- Files: `next.config.ts`, `docs/04-seo-url-migration-map.md`
- Done when: every decided row has a 301 in `next.config.ts`; TBD rows (e.g. `/prayer/`, `/get-connected/`) are listed as owner decisions with a recommended destination; `/youth-alpha/` → `/kids-youth#youth-alpha` included.
- Skills: `seo`

**O2 · ESLint flat config, non-blocking this session** · S · T1
- Task: Add `eslint.config.mjs` (Next core-web-vitals + TypeScript) and switch `npm run lint` to the ESLint CLI (`next lint` is deprecated in Next 15.5). Existing violations are **warnings** this session so other lanes' gates stay green.
- Files: `eslint.config.mjs`, `package.json`, `package-lock.json`
- Done when: `npm run lint` exits 0 on `main`'s code; warning counts per lane are recorded in the session log for QA so the next session can tighten.

**O3 · Test foundation + DST tests** · M · T1
- Task: Add Vitest; write unit tests for pure date/time-label and recurrence helpers in `src/lib/**` (respect contract C1), including America/Chicago DST boundaries (2026-03-08, 2026-11-01). Add `npm test` to `scripts/agents/gate.sh` and CI.
- Files: `vitest.config.ts`, `tests/**`, `package.json`, `package-lock.json`, `scripts/agents/gate.sh`, `.github/workflows/ci.yml`
- Done when: `npm test` runs in the gate and CI; failing tests that reveal real bugs are marked `it.todo`/`skip` with a `scribe log request: data …` naming the bug (don't fix data-lane code).
- Skills: `test-driven-development`

**O4 · Dependency audit triage** · S · T1 (escalate to T2 if a fix needs a major upgrade)
- Task: Resolve the 2 critical / 7 high `npm audit` findings with non-breaking upgrades (`npm audit fix`, no `--force`; targeted minor/patch bumps).
- Files: `package.json`, `package-lock.json`
- Done when: the PR body lists before/after counts and every remaining finding with a reason (transitive, no fix, needs major).

**O5 · Launch checklist** · S · T0
- Task: `docs/10-launch-checklist.md`: every owner-run step for Nov 13 (Supabase project + schema apply via D3, seed via D4, Vercel Preview/Production env vars, Search Console + active Ads URL exports, forms ownership, giving URL, church content approval, domain/DNS, rollback). Built only from docs 06/08/09 and this assignment.
- Files: `docs/10-launch-checklist.md`, `docs/INDEX.md`
- Done when: each item has owner, source doc, and "done when"; nothing invented.

**Lane done when:** O1–O5 done or parked · gate (now with lint + tests) passes · PR open.

---

## QA focus

- **D1 is a security fix:** verify *every* `'use server'` export under `src/app/admin/**` calls `requireAdmin()` first, and that unauthorized calls fail closed. Get a cross-family second opinion (Codex `/review`) on D1 + D5.
- **D3 migration:** idempotent and non-destructive (no `DROP`, no data-rewriting `UPDATE` without review); RLS enabled on every table.
- **Experience copy provenance:** spot-check 5 sentences per new page against `docs/01-current-site-audit.md`. Any un-sourced fact → FIX-FIRST.
- **O1 redirects:** no redirect loops; no redirect shadows a live route (`/sermons/:slug`, `/events/:slug`); all `permanent: true`.
- **O2/O3:** gate stays green on all three rebased branches after ops merges.

## Owner decisions needed

1. **Giving destination URL** (blocks E2's final CTA). Recommended: whatever the live site links to today, confirmed by you.
2. **Visitor/signup form destinations:** Gravity Forms replacement vs ChurchSuite links (blocks post-session forms work). Recommended: ChurchSuite links where those forms already exist; list the rest.
3. **`/youth-alpha/` target:** recommended `/kids-youth#youth-alpha`.
4. **TBD redirects** (`/prayer/`, `/get-connected/`, others O1 surfaces). Recommended: `/plan-a-visit` for get-connected; prayer → `/about` until a page exists.
5. **Express(o) schedule:** needs an authoritative source before seeding.
6. **Supabase + Vercel env** (human-only): confirm the project, apply schema using D3's README, and set Preview env vars from `docs/admin-setup.md`.
