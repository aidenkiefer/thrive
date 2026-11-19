# Backlog: Data, CMS and Owner decisions (batch 3)

**Date:** 2026-11-19 · **Author:** PM (Cursor session) · **Board:** GitHub Project 3

**Scope:** gaps in the Data lane (`supabase/**`, `src/lib/**`, `src/app/admin/**`, `src/components/admin/**`, `src/app/api/**`, `src/middleware.ts`, `scripts/**` except `scripts/agents/**`, `.env.local.example`) and the owner decisions that gate them. Ownership was verified in `docs/workflow/roles-and-lanes.md`. Every Data ticket below lists Allowed Files inside those paths. Anything outside them (`src/app/[slug]/**`, `next.config.ts`, `docs/**`, `content/**`, `package.json`) is a cross-lane request.

**Not duplicated (existing board cards):** CMS restore previous version, CMS draft preview + attributed publishing (and R2, its first slice), Email form submissions, Individual staff accounts, Add public/admin feedback, D1L-C migration rehearsal, Announcements verification, [Ops] Rehearse database migration. Claude's R1/R2 and PRs #15, #18, #23 are untouched.

## Issues created

| # | Title | Milestone | Lane | Tool | Size | Priority | Stage | Depends on |
|---|---|---|---|---|---|---|---|---|
| [#39](https://github.com/aidenkiefer/thrive/issues/39) | [Data] Seed safety rails: dry run, target guard, verification report | M2 | Data | Codex | S | P0 | Ready | none |
| [#40](https://github.com/aidenkiefer/thrive/issues/40) | [Data] Shared reserved-slug list for landing pages | M2 | Data | Cursor | S | P1 | Backlog | R2 (check overlap) |
| [#42](https://github.com/aidenkiefer/thrive/issues/42) | [CMS] Admin editors for sermon series and speakers | M2 | CMS | Cursor | M | P1 | Backlog | R2, #15 |
| [#44](https://github.com/aidenkiefer/thrive/issues/44) | [Data] One revalidation helper so published edits show immediately | M2 | Data | Claude Code | S | P1 | Backlog | R2, #15 |
| [#45](https://github.com/aidenkiefer/thrive/issues/45) | [Data] RLS matrix and admin-guard coverage tests | M3 | Data | Claude Code | M | P1 | Backlog | D1L-C, #15 |
| [#48](https://github.com/aidenkiefer/thrive/issues/48) | [Data] API route inventory and abuse-limiter coverage check | M3 | Data | Codex | S | P1 | Backlog | #23 |
| [#49](https://github.com/aidenkiefer/thrive/issues/49) | [Data] Admin image handling and media re-hosting | M3 | Data | Claude Code | M | P1 | Waiting on owner | owner decision (phase 1: #15) |
| [#50](https://github.com/aidenkiefer/thrive/issues/50) | [Data] Form submission storage, retention and admin view | M5 | Data | Claude Code | M | P2 | Waiting on owner | #15, #18, owner decision |
| [#53](https://github.com/aidenkiefer/thrive/issues/53) | [CMS] Admin activity log (who edited, unpublished, deleted) | M5 | CMS | Claude Code | M | P2 | Backlog | #15, R2 |
| [#54](https://github.com/aidenkiefer/thrive/issues/54) | [Owner] Preview provisioning decisions: Supabase, staff sign-in email, form email | M2 | Owner | Owner | M | P0 | Waiting on owner | none |
| [#55](https://github.com/aidenkiefer/thrive/issues/55) | [Owner] Ministry content and destinations checklist | M1 | Owner | Owner | M | P0 | Waiting on owner | none |
| [#57](https://github.com/aidenkiefer/thrive/issues/57) | [Owner] Launch decisions: domain, tracking, social, URL dispositions, media | M3 | Owner | Owner | M | P0 | Waiting on owner | none |

All Data issues carry `lane:data`, owner issues `lane:owner`, plus `size:*` and `priority:*` labels; all are on Project 3 with Delivery stage, Lane, Agent, Priority, Size, Release and Next action set.

## What the repo and docs showed (grounding)

| Area | Finding | Ticket |
|---|---|---|
| Admin editing coverage | Editors exist for announcements, one-time and recurring events (and occurrences), groups, ministries, outreach, sermons, staff and landing pages. **None for `sermon_series` or `speakers`.** The sermon form only offers existing speakers and *published* series, so new series and guest speakers need a seed or SQL. | #42 |
| Images | All admin image fields are plain HTTPS URL inputs. No upload path, no storage bucket in `supabase/**`, although docs/06 describes media in Supabase Storage. Public photos hot-link `thrivevineyard.com/wp-content/uploads`. | #49 |
| Form submissions | Native forms validate and email only; nothing is persisted, so a mail failure loses the message. Hosted ChurchSuite/Google forms store their own data. | #50 |
| Seeding | `npm run seed` (`scripts/seed-current.ts`) has a reviewed-export check and no placeholder rows, but **no dry run and no target guard**: it writes to whatever service-role URL is in `.env.local`. | #39 |
| Reserved slugs | Public `src/app/[slug]/page.tsx` reserves `feedback` and `get-connected`; the admin landing-page form (and docs/05) does not. A landing page with those slugs could be saved and never render. | #40 |
| Revalidation | Public pages use `revalidate = 60`; each admin action lists `revalidatePath` by hand. Only ministries and landing pages revalidate the sitemap; slug changes revalidate only the new path. | #44 |
| RLS / admin guards | RLS is enabled on all 12 tables with published-only reads and column grants for contact fields. There is no automated check that every admin page calls `requireAdmin()` or that anon cannot read drafts. | #45 |
| API abuse coverage | Today only `api/auth/[...nextauth]` is on main; `request-code` and `forms/[formId]` arrive with #15, with the shared limiter in #23. No manifest ensures new routes are classified. | #48 |
| Audit trail | No `updated_by`, `published_by` or log table exists. R2 adds publisher attribution on publish only. | #53 |
| Content model vs schema | Tables and fields in docs/05 match `supabase/schema.sql` (12 tables). Differences are by design (extra `external_url`, `topics`, `service_type`, `ministries.schedule_description`/`churchsuite_form_url`). No schema ticket needed beyond the above. | none |

### Considered and not created (cap or insufficient evidence)

- **Admin accessibility pass:** `admin-form.tsx` has one label/aria hook; `form-feedback.tsx` and the login page have none. Worth a small S ticket in M3 (labels, error association, focus on feedback) after #15 changes the login page, so it was held rather than created now. Candidate for the next PM pass.
- **Sermon intake from YouTube/RSS:** an owner decision first (see the ministry content checklist); create the ticket only after the answer.
- **Public speaker pages:** `/speaker/[slug]/` is a TBD redirect row in docs/04; covered as an owner question in #57.

## Ordering rationale

1. **M1/M2 unblockers first.** #54 (Preview provisioning) and #39 (seed rails) gate every Preview verification card. #39 is the only issue here that is genuinely Ready: it needs no other PR and no owner input to build.
2. **CMS completeness before launch.** #42, #40 and #44 touch the same admin actions Claude is editing in R2, so they sit in Backlog until R2 merges; this avoids conflicts rather than adding risk. #42 is the one real editing gap staff will hit.
3. **Safety nets in M3.** #45 and #48 lock in guarantees (draft privacy, guard coverage, limiter coverage) once #15, #23 and the D1L-C harness exist.
4. **Media decision is on the cutover critical path.** #49 is in M3 because WordPress cannot be retired while photos hot-link it. Phase 1 (validation and a warning) does not need the owner.
5. **Post-launch last.** #50 and #53 are P2; neither blocks the MVP (email already works once provisioned; R2 covers publish attribution).

## Cross-lane contracts

| Contract | Provider | Consumer | Where |
|---|---|---|---|
| `isReservedSlug()` and `RESERVED_SLUGS` | Data #40 (`src/lib/reserved-slugs.ts`) | Experience: `src/app/[slug]/page.tsx` imports it | Experience request after #40 merges (contract PR, fast-merge) |
| `revalidateEntity(...)` helper | Data #44 (`src/lib/revalidate.ts`) | Data admin actions only | internal |
| Upload API and image field control | Data #49 | Experience re-points hot-linked photos in `src/components/content/photos.ts` and `content/**` | Experience ticket after #49 phase 2 |
| Staff actor + publisher fields | Data #15 and R2 | #42, #44, #53 reuse them | no second mechanism |
| New remote image host | Data #49 (decision) | Ops: `next.config.ts` `images.remotePatterns` | cross-lane request |
| Docs fixes (reserved list in docs/05, ISR wording and GTM container in docs/06) | Data tickets note them | Ops | cross-lane request via `scribe` |

## Owner decisions needed (digest)

Each item is a question with a recommended default taken from the docs. Defaults are suggestions, not decisions. Full checklists are in the three owner issues.

### Preview provisioning ([#54](https://github.com/aidenkiefer/thrive/issues/54), M2)

1. ~~Separate Supabase Preview project~~ **Decided 2026-11-19: use the existing production project until launch**; owner sets the env vars and Vercel Authentication. Open: is the project empty? (see [owner-decisions.md](../owner-decisions.md))
2. Approve seeding Preview from the audited exports (80 events, 120 sermons) after the dry run. *Default: yes.*
3. ~~Express(o) schedule~~ **Confirmed 2026-11-19:** every Sunday 8:30 AM, before the 9:30 AM main service.
4. Staff login email: separate Resend SMTP credential and code-only template; sender on `updates.thrivevineyard.com`. GoDaddy DNS: **owner does it (decided 2026-11-19)**. Sender address and credential still open.
5. Staff roster: **decided 2026-11-19** (owner as main admin; Molly Kiefer, Kevin Kiefer, Carley LaPointe as staff). Open: who may disable accounts, and whether account levels are needed (the data model has none).
6. Website form email: default inbox **`info@thrivevineyard.com` (decided 2026-11-19)**; still open: optional extra recipients, verified sender, send-only key, dedicated limiter hashing secret.

### Ministry content and destinations ([#55](https://github.com/aidenkiefer/thrive/issues/55), M1)

7. Which ministries, groups and outreach initiatives are published, with approved descriptions, schedules, leaders and contacts (none exist in any export).
8. Team page: which staff appear; any public staff email or phone. *Default: none public.*
9. Youth Alpha published destination and dates. *Default: hold the redirect.*
10. Signup tool per ministry (ChurchSuite, Google Form, native form) and the approved URLs. Gravity Forms action URLs are not copied; the site allows only HTTPS ChurchSuite or Google Forms. *Default: ChurchSuite where already used.*
11. Confirm giving channels on `/give` are current.
12. Newsletter (Mailchimp) kept? Podcast (RSS.com) external link or native feed? New sermons by hand or YouTube import? *Defaults: keep link, keep external podcast, by hand at launch.*
13. Who reviews the Preview for the pastors, and by when.

### Launch decisions ([#57](https://github.com/aidenkiefer/thrive/issues/57), M3)

14. DNS owner, cutover date (target week of Nov 23), rollback plan. *Default: WordPress stays reachable until the release URL check passes.*
15. Image storage choice and approval to re-host photos; upload rules. *Default: Supabase Storage; alt text required; 5 MB JPEG/PNG/WebP.*
16. Confirm Ads tag `AW-16575196430` is inside container `GTM-PRJX6P9H`; retire `GTM-NQV3Z3N7`.
17. Consent notice: "none for now" stands; when to revisit. *Default: before launch if any tag uses ad or remarketing storage.*
18. Final social profile URLs for the footer (confirm or supply).
19. `/prayer/`, `/expresso/`, `/volunteering/`, `/speaker/[slug]/` dispositions (docs/04 TBD rows). *Default: 301 to the nearest existing page until a real destination exists.*
20. Which campaign slugs are still live Ads destinations (needs Search Console and Ads exports).
21. Form submissions: email only or also stored; retention. *Default: email only; if stored, 12 months.*

## Next assignment candidates

Per lane, with contracts. Pick 2 to 6.

**Data (Claude Code, after R1/R2)**
- #44 revalidation helper, then #42 series/speaker editors (CMS slice). Both reuse R2's actor contract. Serialize on one branch stack because they edit the same admin files.
- #45 RLS matrix once D1L-C's harness exists.
- #49 phase 1 (image URL validation and WordPress-host warning) even before the owner decides storage.

**Data (Codex or Cursor, small and independent)**
- #39 seed rails now (no dependencies). *Contract:* README section appended only; rebase after #23 which also touches `supabase/README.md`.
- #40 reserved slugs, then file the Experience request for `[slug]/page.tsx`.
- #48 API inventory immediately after #23 merges.

**Experience (Cursor)**
- Consume `isReservedSlug()` from #40 (one-line contract PR).
- After #49: re-point hot-linked photos to the re-hosted URLs.

**Ops (Codex)**
- Docs fixes requested by these tickets (docs/05 reserved list, docs/06 GTM container and ISR wording).
- `next.config.ts` image host and any redirect rows that come out of #57.

**Owner**
- #54 first (Resend DNS and the Preview database unblock the most cards), then #55 (share the #24 Preview with the pastors), then #57 before the redirect table is finalised.

## Overlaps and notes

- The board still has two **draft cards** ("Provision Preview, auth email and form email" and "Ministry content, destinations and launch decisions"). #54, #55 and #57 supersede them with explicit questions and defaults. The coordinator should archive or relink the drafts so owners see one checklist.
- `docs/06-integrations.md` still names `GTM-NQV3Z3N7`; the owner chose `GTM-PRJX6P9H` (see #57). Ops fix.
- `docs/admin-setup.md` on main still describes the shared-password admin login that #15 replaces; Data #15 updates it. No ticket here.
- #44, #42, #40 and #53 edit files that R2 also touches; they stay in Backlog until R2 merges so Claude's in-progress work is not disturbed.
