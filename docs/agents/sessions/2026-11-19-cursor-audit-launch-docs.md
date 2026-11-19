# Session log: `cursor/audit-launch-docs`

**Assignment:** carry-over replacement for PR #5 (`[audit] Live URL inventory and launch checklist`, originally by Codex, branch `codex/audit-launch-docs`) · **Lane:** audit · **Tool:** cursor (standing in for the idle Codex audit lane; owner approved) · **Started:** 2026-11-19 · **Milestone:** M3

## Status
Replaces PR #5. Docs only. Source files taken from `origin/codex/audit-launch-docs`, then QA fixes applied. No changes to `src/**` or `next.config.ts`.

## Entries
- **note:** Sanity check: merge-base of `origin/main` and `origin/codex/audit-launch-docs` is `ceb39e0` (#6). Since then main changed only `docs/04-seo-url-migration-map.md` and the RC2 assignment among the paths in question. None of the 8 files carried over changed on main, so a straight checkout was safe. The branch's large raw diff against main is only because it predates main's later PRs; I did not carry any of that.
- **change:** Carried over unchanged from #5 and then edited: `docs/01-current-site-audit.md`, `docs/02-content-inventory.md` (historical banners), `docs/10-launch-checklist.md`, `docs/audit/2026-11/integrations.md`, `docs/audit/2026-11/url-inventory.md`, `docs/audit/2026-11/pages/plan-a-visit.md`, `docs/INDEX.md`, and the original Codex session log `2026-11-07-codex-audit-launch-docs.md` (kept as history).
- **QA 6 applied (`docs/10-launch-checklist.md`):**
  - Title no longer states "November 13". `docs/plans/specs/2026-11-18-mvp-preparation.md` is not on `main`, so the line reads "Target date: owner to confirm" and notes the spec path to link once it lands.
  - "Verify tracking" row lists `GTM-PRJX6P9H` (new site, owner choice 2026-11-18) next to `GTM-NQV3Z3N7` (live WordPress), says `AW-16575196430` is not loaded directly and the owner must confirm it lives inside the new container, and notes no cookie/consent notice for now.
  - Anon-readable contact-fields row marked done, resolved by #12's `contact_column_privacy` migration (verified the migration revokes anon select on `speakers`/`staff`); the remaining owner step is confirming it is applied to the target project.
  - Forms row rewritten: native email forms (Resend) plus hosted ChurchSuite/Mailchimp links.
- **QA 7 applied:**
  - `integrations.md` "Migration action": Google Form candidate line replaced with the native-form (Resend) decision; Mailchimp and ChurchSuite sign-ups remain hosted links.
  - `url-inventory.md` "Redirect decisions needing review": `/prayer/`, `/volunteering/`, `/expresso/` marked decided in the RC2 assignment (decision 4) but not yet implemented in `docs/04` or `next.config.ts`; `/get-connected/` marked built.
  - `pages/plan-a-visit.md`: last sentence of the Express(o) paragraph now says the MDX pause statement is "resolved on main in #24".
  - `docs/INDEX.md`: started from main's version (keeps the `plans/PROGRESS.md` link that #5 dropped, and main's phase line) and only added the new docs (audit README, url-inventory, integrations, launch checklist, no date). The June block is relabelled historical.
- **QA 12 (nit) applied:** `/sample-page/`, `/hello-world/`, `/portfolio-item/`, `/portfolio-item/demo-sermon/`, `/category/uncategorized/`, `/author/admin/` now read "no route proposed; redirect or 410 to decide". The 985-URL count and 985 table rows are intact, and the archive-row correction (`/upcoming-events/` -> `/events`) is untouched.
- **not applied (deliberate):** Form-only pages such as `/group-form-sign-up/` and `/updated-contact-info/` keep Codex's proposed routes; they are real pages, not junk, and were not listed in the findings. The second paragraph of `pages/plan-a-visit.md` still mentions the old MDX ChurchSuite visitor URL; main's MDX comment says it was removed, but that sentence was out of scope and is left for the owner/audit lane.
- **cannot verify:** The target date (spec file absent from `main`). Whether `contact_column_privacy` is applied to the real Supabase project. Whether Ads `AW-16575196430` is configured in `GTM-PRJX6P9H`.
