# Owner decisions log

## MVP signup refinement — later 2026-11-22

Owner chose a **branded Thrive signup surface linking to Google's hosted form** for MVP. Use the official Forms REST API through an operator CLI to create/read/update/publish forms from reusable templates (#151); no authenticated Google API call per public page view. Responses/private review remain in Google. Custom Thrive input rendering and an Apps Script submission bridge are post-MVP (#148), not launch blockers. The branded surface is #149; #50 is the umbrella.

Free Browser/Computer setup is authorized for the later owner-assisted window. Defer account consent/provisioning until then; do not enable a paid plan, billable commitment or unknown-cost service. This does not replace artifact-specific live database or DNS approval. Build/QA templates, dry runs, mocked API adapters and branded handoff states before setup; mocks never establish real service success. Newest refinement supersedes earlier plain-link-only or custom-field aspirations.

Dated record of decisions the owner has made, so agents stop re-asking. Newest first. Decisions only: no secrets, no personal contact details (this repository is public). Open questions stay in the owner issues ([#54](https://github.com/aidenkiefer/thrive/issues/54), [#55](https://github.com/aidenkiefer/thrive/issues/55), [#57](https://github.com/aidenkiefer/thrive/issues/57)).

## 2026-11-22: managed services, signup provider, media and recovery

These current answers supersede conflicting historical provider and priority assumptions below. A decision is not evidence of implementation or runtime verification. Source discussion: owner answers recorded through PR #143 and the linked issues; [tradeoffs/evidence](specs/2026-11-22-managed-services-tradeoffs.md).

| Topic | Owner decision |
|---|---|
| Architecture DNA | Offload complexity from Thrive's runtime/webapp to suitable managed services. Prefer free allowances until paying is justified; consider reliability and maintenance, not price alone. |
| Audience/capacity | Design for **more than 1,000 concurrent website visitors**, primarily a regional audience within about 60 miles. Capacity is not yet verified; define load/cache/journey assumptions. |
| Existing stack/design | Keep Next.js/Supabase/NextAuth/Resend. No stack replacement was requested. Existing #144 visual redesign is explicitly accepted. Major architecture, interface, design, product and cost changes still go to the owner. |
| Signup provider | **Google Forms/Sheets** for event/group signups; external response review and admin links are acceptable. No response sync into Supabase, custom form builder or native response dashboard for MVP. |
| Signup extras | Disregard extra custom features/configuration for MVP: bespoke export controls, detailed response-email automation, automated retention and in-app review are not required. Use standard notifications and ordinary private provider sharing. |
| Data policy | Owner initially approved 12 months, deletion on request, owner/all and assigned staff access, owner exports/deletes, no implicit marketing opt-in. With provider adoption, custom enforcement is relaxed for MVP. The owner explicitly deferred the fixed 12-month cleanup rule. Keep private sharing and deletion on request; public response access is not approved. |
| Feedback/prayer storage | Existing native forms remain email-only for MVP; do not copy prayer requests into signup response storage. |
| Mail | Auth codes from info@thrivevineyard.com; native website notifications from website@updates.thrivevineyard.com; default recipient info@thrivevineyard.com. Prayer uses this same receiving inbox, not a new mailbox. FORMS_PRAYER_RECIPIENT can privately contain the same address; retain the configuration guard. Google-hosted sender behavior follows its provider mechanism. |
| Media | Keep optimized assets committed with the site; use Supabase Storage for new changing images. Initially manage through the dashboard. **Defer the custom staff uploader.** |
| Backups | **Weekly GitHub Actions exports to separate private R2**, encrypted before upload, retain ten verified snapshots, restore rehearsal, failure/missed-backup alerts. Account setup and actual quota/size/recovery evidence remain. |
| Spending | Free is a preference, not a hard ban. Bring required payments, subscriptions and expected recurring charges to the owner before enabling them. No dollar budget ceiling was set. |
| Wednesday | November 25 = approved/tested MVP readiness. Domain cutover needs a separate owner go. Remaining CMS preview/version restore (#32/#33) is deferred. |
| Other preserved decisions | Youth Alpha excluded until it returns; podcast paused/deferred; manual weekly sermon entry; Basecamp wins the recorded schedule conflicts; newest featured announcement wins; ChurchSuite giving unchanged. |

No Google/R2 account, paid subscription, live setting, form destination, actual backup or capacity result is established by this record. Owner content approvals, provisioning, service eligibility, notification receipt and operational acceptance remain on their issues.

## 2026-11-19 (later): live database, sender, roles

| Topic | Decision |
|---|---|
| Live database state | The Supabase MCP is connected in all three agent tools. A read-only audit shows the project is **not empty and out of date** (older import, stale published rows). Baseline and rules: [../ops/supabase-live-project.md](../ops/supabase-live-project.md). Reconcile and seed from the audited exports: Claude, issue #101. |
| Staff login code sender | `info@thrivevineyard.com`. Technical caveat tracked in #103: Resend currently has `updates.thrivevineyard.com`; sending From the root address needs root-domain verification and an SPF that merges with the existing mail provider. Owner chooses after Codex shows the DNS evidence. |
| Resend, other keys, templates | Owner will configure; Codex helps (#103). Not decided yet. |
| Supabase Auth settings | Owner configures (signups off, OTP expiry). |
| Admin vs staff roles | **Staff account control (create, disable, re-enable, rebind) is admin-role only.** The owner is the only admin for now. Other permissions will be assigned to roles as they come up. Issue #102. |
| Work split | Claude: seeding, admin role. Codex: GoDaddy/email DNS first, then environment, Supabase readiness, #41 runbook, tests. Cursor: Experience batch 3 plus senior QA and merge. Plan: [session 2](../agents/assignments/2026-11-19-session-2.md). |

## 2026-11-19: Supabase, hosting, staff, form inbox, Express(o) (issue #54)

| Topic | Decision |
|---|---|
| Supabase project | **No separate Preview project.** Prepare the existing production Supabase project and use it for Preview verification until launch. The public still sees WordPress until cutover, so this project serves no live traffic yet. |
| Environment variables | Owner sets them in Vercel. Agents never hold or see the service-role key. |
| Vercel Authentication | Owner turns it on for Preview deployments. |
| DNS (GoDaddy) | Owner does all DNS work, including the Resend sending-domain records for `updates.thrivevineyard.com`. |
| Main admin account | The owner, Aiden Kiefer (personal email, kept out of git). |
| Staff accounts | Molly Kiefer, Kevin Kiefer and Carley LaPointe, each with their `@thrivevineyard.com` address (addresses are in the owner's hands for enrollment, not in git). |
| Default form inbox | `info@thrivevineyard.com` (the `FORMS_DEFAULT_RECIPIENT` value). |
| Express(o) | Every Sunday at 8:30 AM, before the main service at 9:30 AM. Matches the 2026-11-07 decision already in `src/lib/constants/service-times.ts`; no longer "held for editorial review". |

### What changes because the production project is the Preview database

- **Agents still do not touch it.** No agent applies migrations, enrolls staff, seeds, or sends email. Owner-run steps only, with written commands from the Data and Ops lanes.
- **Back up before the first change.** Owner confirms what backup or point-in-time recovery the project's plan offers, and takes one before applying any migration (the schema state of the project is not yet known; see open questions).
- **Seed once, early.** The `published_at` guard (#96) makes a re-seed abort at the first row staff changed. Dry run first (#39), then seed once, before staff start editing.
- **Order matters for the CMS pair.** Apply migration `20261119000000` before deploying #90's code, and `20261119010000` only after #96's code is live (see the delta QA report).
- **Preview deployments carry real credentials.** Every Preview deployment that has the service-role key can write to this database. Keep Vercel Authentication on, and consider scoping the Supabase variables to a single branch (owner's call, in Vercel).
- **#41 checklist still applies**, but runs against this project: privilege query, 50-parallel limiter check (writes only limiter rows), migration run twice, real staff sign-in, sandbox email only.

### Still open from #54

- Is the production project empty, or does it already hold tables or data? (Decides "fresh `schema.sql`" versus "review and migrate".)
- Approve seeding from the audited exports (80 events, 120 published sermons) after the #39 dry run.
- Sender address for staff login codes on `updates.thrivevineyard.com`, and a separate Resend SMTP credential for Supabase Auth (default: separate from the website-forms key).
- `FORMS_MAIL_FROM`, send-only Resend key scoped to website forms, any extra per-form recipients (default: none).
- Supabase Auth settings: new signups disabled, short OTP expiry (default 10 minutes); dedicated `RATE_LIMIT_HASH_SECRET` per environment.
- Who may disable staff accounts (default: the owner, by SQL).
- **Account levels:** the staff identity table (`admin_staff_accounts`) has no roles; every active account has the same admin access. If "main admin" must differ from "staff-level" (for example only the owner can manage accounts or publish), that is a new Data ticket and the owner should say what each level may do.
- Does Molly or Kevin need a Preview-review role for the pastors (#55)?

### Cross-lane notes raised with this decision

- **Ops/Data (#39, #30):** `scripts/seed-from-parsed.ts` is a legacy script, not wired to `npm run seed` (which runs `seed-current.ts`). It still contains a hand-written "Express(o) Service Renovation Pause" homepage announcement and other hand-written rows. Against the production project it must not be run; delete it in #39 or #30.
- **Docs:** `docs/10-launch-checklist.md` and `docs/admin-setup.md` still say "isolated Preview project". The launch checklist is updated in this change; `docs/admin-setup.md` is Data lane, so Data should change "isolated Preview project" to "the production project, before launch" when D0 touches it.

## Earlier decisions

Recorded in context where they were made: shared limiter in Postgres, announcements newest-featured-wins, GTM `GTM-PRJX6P9H` with no consent notice, the historical native email forms decision (`AGENTS.md`, 2026-11-19; superseded by November 22 Google Forms signup direction), reserved system actors (#94), redirect dispositions for `/expresso`, `/prayer`, `/volunteering` (#63). See [PROGRESS.md](PROGRESS.md) and [roadmap-milestones.md](roadmap-milestones.md).
