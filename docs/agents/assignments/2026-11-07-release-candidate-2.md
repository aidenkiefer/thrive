# Assignment: 2026-11-07-release-candidate-2

**Session goal:** Close every launch gap agents can close without new owner data (form-URL plumbing, Ads/GTM and newsletter parity, a Get Connected contact hub, admin error feedback, contact-field privacy, approved redirects) and produce repeatable release-candidate evidence, so only owner inputs stand between `main` and the Nov 13 launch.
**Inputs read:** `docs/workflow/roles-and-lanes.md`; QA checkpoint `docs/agents/qa/2026-11-07-mvp-launch-readiness-1.md` and QA's draft `2026-11-07-mvp-release-candidate-2.md` (both on PR #9); `docs/08-mvp-status-roadmap.md`; `docs/plans/PROGRESS.md`; open PRs #5, #8, #9; session logs from #4/#6/#7/#8; `docs/audit/2026-11/{integrations,url-inventory}.md` (PR #5); spot checks of `supabase/schema.sql`, `src/lib/constants/service-times.ts`, `src/components/home/NewsletterSection.tsx`.
**Supersedes:** QA's draft `docs/agents/assignments/2026-11-07-mvp-release-candidate-2.md`. QA drops that file from #9 before merging. Its lanes are kept here and revised: C2 also covers Google Forms, and tracking, newsletter, forms register and privacy tickets are added.
**Owner approval:** approved 2026-11-07 · **Owner decisions 1–4: all accepted as recommended (2026-11-07)**. D1 contract merged as #11.

## Start conditions (carry-over first, never re-assigned)

| Lane | Starts when | Why |
|---|---|---|
| data | **Now**, once this file is on `main` | No path overlap with #8 or #5 |
| experience | #8 merged | Same Cursor lane; E2 edits `GlobalNav.tsx`/`Footer.tsx`, which #8 changes |
| ops | #8 **and** #5 merged, main gate green, #9 merged | Codex finishes QA carry-over first; O2 edits `next.config.ts`, `sitemap.ts`, `docs/04` (#8) and `docs/10` (#5) |

## Lane map

| Lane | Tool | Branch | Worktree | Default tier | Tickets |
|---|---|---|---|---|---|
| data | claude | `claude/data-release-candidate-2` | `../thrive-worktrees/claude-data-release-candidate-2` | T2 design → T1 implement | D1–D5 |
| experience | cursor | `cursor/experience-release-candidate-2` | `../thrive-worktrees/cursor-experience-release-candidate-2` | T1 | E1–E5 |
| ops | codex | `codex/ops-release-candidate-2` | `../thrive-worktrees/codex-ops-release-candidate-2` | T1 (T0 for docs) | O1–O4 |

Defaults from roles-and-lanes §2 apply, with one change: `next.config.ts`, `sitemap.ts`, `robots.ts` and `docs/04` go back to **ops** (experience held them last session).

## Hot-file owners (this session)

| File | Owner lane |
|---|---|
| `package.json`, `package-lock.json`, `eslint.config.*`, `vitest.config.*`, `playwright.config.*`, `.gitignore` | ops |
| `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts` | ops |
| `supabase/schema.sql`, `supabase/migrations/**`, `src/lib/supabase/types.ts`, `src/lib/queries/**` | data |
| `src/app/layout.tsx`, `tailwind.config.ts`, `src/components/layout/{GlobalNav,Footer,SiteShell}.tsx` | experience |
| `docs/04-seo-url-migration-map.md`, `docs/10-launch-checklist.md`, `docs/audit/**` | ops |

## Contracts

| ID | Provider → consumer | Signature / shape | File | Lands by |
|---|---|---|---|---|
| C2 | data → experience | Ministry row type gains `schedule_description: string \| null` and `churchsuite_form_url: string \| null`. The column name matches the existing `churchsuite_form_url` on `recurring_events`, `one_time_events`, `groups` and `outreach`; per the forms decision it may hold a ChurchSuite **or** Google Forms URL. The existing published-ministry query in `src/lib/queries/ministries.ts` returns both fields. | `supabase/schema.sql`, `src/lib/supabase/types.ts`, `src/lib/queries/ministries.ts` | D1 `[contract]` PR, fast-merged |
| C3 | data → experience | `export function isApprovedFormUrl(url: string \| null \| undefined): url is string`. A pure function with no Next or Supabase imports. True only for `https:` URLs whose host is `churchsuite.com` or a subdomain of it, `docs.google.com` with path starting `/forms/`, or `forms.gle`. | `src/lib/form-urls.ts` (new) | same D1 `[contract]` PR |

Experience may **import** from `src/lib/form-urls.ts` and the ministry query. It never edits them. Until C2/C3 land, Cursor works on E1–E3.

## Merge order

1. **D1 contract** (`[contract]`, fast-merge once green)
2. **data:** schema migration + column grants (riskiest; others rebase after)
3. **ops:** tests/tooling/redirects (experience rebases onto any lint/test config changes)
4. **experience:** visitor pages + tags

---

## Lane: data, form plumbing, admin feedback, privacy

**Tool:** claude · **Branch:** `claude/data-release-candidate-2` · **Default tier:** T2 design → T1 implement (`opusplan` fits)
**Owned paths:** `supabase/**`, `src/lib/**` (except `src/lib/mdx.ts`), `src/app/admin/**`, `src/components/admin/**`, `src/app/api/**`, `src/middleware.ts`, own session log
**Read first (≤3):** `src/lib/admin-validation.ts`, `src/lib/admin-form.ts`, `supabase/README.md`
**Out of scope:** parser/seed changes, running migrations or seed against any live DB, new admin sections, renaming `churchsuite_form_url` columns

### Tickets

**D1 · Ministry schedule/form fields + form-URL allowlist** · M · T2→T1 · contracts C2 + C3
- Task: Add nullable `schedule_description` and `churchsuite_form_url` to `ministries`, expose them via types, the published query and the protected ministry editor, and add `isApprovedFormUrl()`. Open the `[contract]` PR as soon as types, query and `form-urls.ts` are in. The editor UI can follow in the same branch.
- Files: `supabase/schema.sql`, new `supabase/migrations/20261107010000_ministry_schedule_forms.sql`, `supabase/README.md`, `src/lib/supabase/types.ts`, `src/lib/queries/ministries.ts`, `src/lib/form-urls.ts`, `src/app/admin/ministries/**`
- Done when: the migration is guarded (`add column if not exists`) and runs twice in a disposable DB; existing rows stay valid with nulls; `isApprovedFormUrl` rejects `http:`, lookalike hosts (`churchsuite.com.evil.io`), and non-`/forms/` Google URLs; no inserted records.
- Skills: `postgres-best-practices`

**D2 · Enforce the allowlist at publish on every form field** · S · T1
- Task: Publish validation rejects any `churchsuite_form_url` that fails `isApprovedFormUrl()` on recurring events, one-time events, groups, outreach and ministries, with a specific message. Drafts still save.
- Files: `src/lib/admin-validation.ts`, matching admin actions under `src/app/admin/{recurring-events,events,groups,outreach,ministries}/**`
- Done when: each type's publish path calls the check (grep shows coverage); `requireAdmin()` remains first in every action.

**D3 · Preserve rejected admin input** · M · T1
- Task: After a rejected save, announcement, sermon, event and recurring-event editors redisplay the submitted values with field-level errors.
- Files: `src/lib/admin-form.ts`, `src/app/admin/_components/**`, `src/app/admin/{announcements,sermons,events,recurring-events}/**`
- Done when: an invalid publish keeps the input and shows errors, and correcting it succeeds; submitted content is never put in a query string; unauthorized calls still fail closed.

**D4 · Express(o) shared schedule** · S · T1
- Task: Replace the stale paused state with the owner-confirmed schedule: weekly, Sundays 8:30 AM America/Chicago, in the cafe (owner, 2026-11-07).
- Files: `src/lib/constants/service-times.ts`
- Done when: `isPaused` is false or removed; no new schedule facts were added; the public files that consume it are listed in the session log for experience/QA.

**D5 · Contact-column privacy** · S · T2 · owner decision 3: **yes, revoke**
- Task: Apply the owner's choice for `speakers.email`, `staff.email`, `staff.phone`, which anon can read today. Recommended: revoke anon `SELECT` on those columns via a guarded migration.
- Files: new `supabase/migrations/20261107020000_contact_column_privacy.sql`, `supabase/README.md`, `src/lib/queries/{staff,speakers,sermons}.ts` (explicit column lists)
- Done when: no public query on `staff`/`speakers` uses `select('*')` or a join star (column revokes make those error); admin (service role) still reads all columns; no public page loses data. A PM spot check found none of these fields rendered publicly. Re-confirm.
- Skills: `postgres-best-practices`

**Lane done when:** D1–D5 done or parked with a reason · gate passes · PR open with scribe body · cross-family `/review` (Codex) requested on D1/D2/D5.

---

## Lane: experience, contact hub, tags, newsletter, ministry pages

**Tool:** cursor · **Branch:** `cursor/experience-release-candidate-2` · **Default tier:** T1
**Owned paths:** `src/app/(public)/**`, `src/app/page.tsx`, `src/app/[slug]/**`, `src/app/{layout.tsx,globals.css,not-found.tsx,error.tsx}`, `src/components/**` (except `src/components/admin/**`), `content/**`, `src/lib/mdx.ts`, `public/**`, `tailwind.config.ts`, own session log
**Read first (≤3):** `docs/audit/2026-11/pages/get-connected.md`, `docs/audit/2026-11/integrations.md`, `docs/07-design-system.md`
**Out of scope:** redirects/sitemap (ops), new queries or schema (data), rebuilding Gravity Forms, any form URL not approved by the owner

**Content rule (unchanged):** every fact traces to a `docs/audit/2026-11/**` file or a canonical record, with an MDX/JSX comment naming the source. Missing facts get an intentional pending state plus a `scribe log blocker`. **Never invent.**

### Tickets

**E1 · Preserve GTM + Google Ads tags** · S · T1 · owner decision 1: **yes**
- Task: Load `GTM-NQV3Z3N7`, plus `AW-16575196430` if the live site loads it separately (check `integrations.md`), from the root layout with `next/script`. Load them in production only.
- Files: `src/app/layout.tsx`, optionally `src/components/analytics/**`
- Done when: IDs match the audit exactly; tags render only when `VERCEL_ENV === 'production'` (none on Preview or dev); GTM `noscript` iframe included; no new npm dependency.

**E2 · Get Connected contact hub** · M · T1
- Task: Build `/get-connected` (same path as the legacy URL, so no redirect is needed) from the audit capture: service, location and contact details exactly as captured, the newsletter signup (E3), and an intentional "form coming soon" slot in place of the Gravity Form. Link it from nav and footer.
- Files: `content/pages/get-connected.mdx`, `src/app/(public)/get-connected/page.tsx`, `src/components/layout/GlobalNav.tsx`, `src/components/layout/Footer.tsx`
- Done when: every fact has a source comment; the WordPress Gravity Forms action is not used as an embed; metadata is set; the session log tells ops to add the route to the sitemap.

**E3 · Mailchimp newsletter signup** · S · T1 · owner decision 2: **yes**
- Task: Replace the "Mailchimp embed coming" placeholder with a shared signup component that does a plain HTML form `POST` to the audited `list-manage.com` action URL. No API calls or keys. Use it on the homepage and Get Connected.
- Files: `src/components/home/NewsletterSection.tsx`, new `src/components/forms/NewsletterSignup.tsx`
- Done when: the action URL matches `integrations.md` exactly, including the honeypot field Mailchimp expects; the form has a label and works with the keyboard; it has no Supabase dependency.

**E4 · Render ministry schedule + form** · M · T1 · consumes C2 + C3
- Task: The ministry route renders `schedule_description` and embeds `churchsuite_form_url` only when `isApprovedFormUrl()` passes, with an accessible title and an intentional null state. Replace the Youth Alpha-specific pending logic from #8 with this generic path.
- Files: `src/app/(public)/ministries/[slug]/page.tsx`, `src/components/ministries/**`
- Done when: populated, null, and unapproved-URL fixtures each render correctly; the session log hands the owner the exact C1-backed Youth Alpha fields to enter and lists those still unknown (current dates, form URL).

**E5 · Public media + accessibility states** · M · T1 · lowest priority (park if short on time)
- Task: Sermons with no media show an intentional state with no dead player controls. Do a 375px and keyboard pass on `/sermons/**`, `/groups/**`, `/outreach/**`, `/[slug]`, `/get-connected`, and fix applicable lint warnings in lane files.
- Files: `src/app/(public)/{sermons,groups,outreach}/**`, `src/app/[slug]/**`, `src/components/{sermons,events,home}/**`
- Done when: the session log lists route × issue found/fixed; no horizontal overflow at 375px; no invented replacement media.

**Lane done when:** E1–E4 done or parked (E5 optional) · gate passes · PR open with scribe body.

---

## Lane: ops, forms register, redirects, release evidence

**Tool:** codex · **Branch:** `codex/ops-release-candidate-2` · **Default tier:** T1 (T0 for docs)
**Owned paths:** `next.config.ts`, `src/app/{sitemap.ts,robots.ts}`, `.github/**`, `scripts/agents/**`, `tests/**`, `e2e/**`, test/lint/playwright config, `.gitignore`, `package.json`, `package-lock.json`, `docs/**` (except `docs/agents/**` and `docs/plans/PROGRESS.md`), own session log
**Read first (≤3):** `docs/audit/2026-11/integrations.md`, `docs/audit/2026-11/url-inventory.md`, `scripts/agents/gate.sh`
**Out of scope:** app-code fixes in other lanes (log requests), redirects the owner hasn't approved, Search Console/Ads claims without exports

### Tickets

**O1 · Forms replacement register** · S · T0 · do first, since it unblocks the owner's biggest input
- Task: One row per live form in `integrations.md` (about 20 Gravity Forms plus Mailchimp). Columns: legacy page, purpose (from audit), new-site home (route or canonical entity), launch priority (must / should / after-launch, with a one-line reason from the audit), replacement provider and approved URL (left **blank** for the owner), status. Link it from the launch checklist as an owner step.
- Files: new `docs/audit/2026-11/forms-register.md`, `docs/10-launch-checklist.md`
- Done when: every form in `integrations.md` has a row; nothing is invented in the provider/URL columns; must-launch rows are at the top.

**O2 · URL reconciliation + approved redirects** · M · T1 · owner decision 4: **yes** (see table)
- Task: Reconcile `docs/04` with the 985-URL inventory and the merged routes; implement the redirects the owner approves in decision 4; add `/get-connected` to the sitemap once E2 lands (or log it as a follow-up).
- Files: `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `docs/04-seo-url-migration-map.md`, `docs/10-launch-checklist.md`
- Done when: no loops; no rule shadows a live route (`/get-connected`, `/sermons/:slug`, `/events/:slug`); taxonomy redirects stay temporary; unapproved rows stay `pending` with a reason; Search Console/Ads review is listed as an owner step, not marked verified.
- Skills: `seo`

**O3 · Production-runtime smoke tests** · M · T1
- Task: Bounded checks against a built app with no live writes: `/admin/**` redirects unauthenticated users, public routes and 404/error states resolve, and a sample of redirects returns the expected status and `Location`.
- Files: `tests/**`, `e2e/**`, `playwright.config.*`, `package.json`, `package-lock.json`, `.github/**`, `scripts/agents/gate.sh`
- Done when: deliberately breaking a redirect or the admin guard makes the check fail; fixtures/mocks only, no credentials in output; local-fixture results are reported separately from configured-Preview checks. If the suite is slow, it runs in CI and is optional in the local gate.

**O4 · Tooling hygiene** · S · T1
- Task: Ignore `tsconfig.tsbuildinfo`; remove the lint config's own warning; recheck the 6 moderate dev-dependency findings using compatible upgrades only.
- Files: `.gitignore`, `eslint.config.*`, `package.json`, `package-lock.json`
- Done when: running the gate leaves `git status` clean; no blanket lint suppressions or `--force`; remaining findings are listed with reasons; lint stays warning-only.

**Lane done when:** O1–O4 done or parked · gate passes · PR open with scribe body.

---

## QA focus

- **D5 grants:** column revokes break `select('*')` for anon. Confirm every public staff/speaker/sermon-speaker query lists explicit columns, and that the service-role admin path still works. Get a cross-family (Codex) `/review` on D1/D2/D5.
- **Form allowlist:** `isApprovedFormUrl` is enforced at publish (D2) **and** at render (E4). Test lookalike hosts, `http:`, and non-form Google URLs.
- **D1 migration:** guarded and non-destructive; runs twice in a disposable DB; RLS unchanged on `ministries`.
- **E1 tags:** IDs exactly `GTM-NQV3Z3N7` / `AW-16575196430`; nothing loads on Preview.
- **E3 Mailchimp:** the action URL is copied exactly from the audit; no API key anywhere.
- **O2 redirects:** only owner-approved rows; no shadowing of `/get-connected`.
- **Copy provenance:** spot-check 5 facts on `/get-connected` against the audit. An unsourced fact means FIX-FIRST.

## Owner decisions needed

All four were answered **yes** (accept the recommendation) by the owner on 2026-11-07.

| # | Decision | Answer | Blocks |
|---|---|---|---|
| 1 | Keep the live tracking tags `GTM-NQV3Z3N7` + `AW-16575196430` on the new site? | **Decided: yes**, as observed, production only. | E1 |
| 2 | Keep the live Mailchimp list (`thrivevineyard.us14.list-manage.com`, from the audit) as the newsletter destination? | **Decided: yes** | E3 |
| 3 | `speakers.email`, `staff.email`, `staff.phone` are readable by anyone today. | **Decided: revoke anon read.** Done in #12 (D5). | D5 |
| 4 | Undecided legacy URLs (audit A2 recommendations) | **Decided:** `/expresso/` → `/plan-a-visit#services` **301**. `/prayer/` and `/volunteering/` → `/get-connected` **302 (temporary)** until dedicated pages exist. `/get-connected/` is the same path, so no redirect. | O2 |
| 5 | Replacement forms (ChurchSuite first, else Google Forms) | The owner fills the URLs into O1's register, must-launch rows first. Agents never guess. | E2/E4 embeds (not ticket completion) |

Owner steps unchanged (not agent work): apply schema + migrations per `supabase/README.md`, seed per `import-readiness.md`, Vercel Preview env vars, giving-link approval, Youth Alpha current dates + record entry, Search Console/Ads export review, church content approval, domain/DNS, rollback plan.

## Launch commands

```bash
# data (now, after this file is on main), run from any worktree that has scripts/agents/
scripts/agents/worktree.sh new claude data-release-candidate-2
# experience (after #8 merges)
scripts/agents/worktree.sh new cursor experience-release-candidate-2
# ops (after #8, #5, #9 merge)
scripts/agents/worktree.sh new codex ops-release-candidate-2
```

Prompt in each tool, inside its worktree:
`Use the lane-builder skill. Assignment: docs/agents/assignments/2026-11-07-release-candidate-2.md. Lane: <data|experience|ops>.`
