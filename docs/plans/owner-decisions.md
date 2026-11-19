# Owner decisions log

Dated record of decisions the owner has made, so agents stop re-asking. Newest first. Decisions only: no secrets, no personal contact details (this repository is public). Open questions stay in the owner issues ([#54](https://github.com/aidenkiefer/thrive/issues/54), [#55](https://github.com/aidenkiefer/thrive/issues/55), [#57](https://github.com/aidenkiefer/thrive/issues/57)).

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

Recorded in context where they were made: shared limiter in Postgres, announcements newest-featured-wins, GTM `GTM-PRJX6P9H` with no consent notice, native email forms replacing Google Forms (`AGENTS.md`, 2026-11-19), reserved system actors (#94), redirect dispositions for `/expresso`, `/prayer`, `/volunteering` (#63). See [PROGRESS.md](PROGRESS.md) and [roadmap-milestones.md](roadmap-milestones.md).
