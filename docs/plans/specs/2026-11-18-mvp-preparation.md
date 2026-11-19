# Thrive MVP preparation and ticket map

Work in this order. The target is the week of November 23, 2026. Confirm release readiness on a configured Preview before setting a cutover date.

1. Verify the shared agent entry points, built-in skills, templates, and reference locations from a fresh checkout.
2. Set up Claude Code in Cursor's Ubuntu terminal and verify sign-in with the owner.
3. Install the committed dependencies and run the repository gate in Ubuntu.
4. Review the current architecture and floorplan with high reasoning effort. Reconcile the November handoff, current branches, and integration assumptions.
5. Split the accepted scope into independently verifiable tickets. The Product Manager establishes GitHub Projects here, links existing work and keeps the board current throughout the session.
6. Update the shared skills and references based on gaps found during onboarding and ticket drafting.
7. Inventory connected services and verify them in local or Preview environments. Use the release checklist for live configuration and changes.

## Modular backlog

These entries are the initial ticket map. Existing pull requests are carry-over. The Product Manager should link them and file only missing work.

| Work | Lane | Acceptance and dependencies |
|---|---|---|
| Reconcile the current release candidate | QA | Review PRs #5, #8, #9 and #12. Preserve the dated URL audit, retire the superseded RC2 draft, verify the Youth Alpha destination or defer its redirect, and reproduce and fix the successful-save then rejected-edit input loss. Gate the combined candidate. |
| Verify storage, database and admin access | Data / Ops | Establish a disposable DB schema/import run, review published-only public reads and private writes, and inventory media permissions and Preview credentials. Test a staff login and authorized save against Preview. Depends on an identified Preview target for end-to-end runs. |
| Support individual staff accounts | Data | Replace the single shared environment credential with individual authorized staff identities. Verify two staff accounts have distinct identities and a removed account loses access. Decide the sign-in provider before migration. |
| Build draft preview and publishing | Data / Experience | Start with structured content for staff-editable pages and announcements. Verify a signed-in editor can preview a draft and publish it. Record who published and when, and verify public visitors and caches see published content only. Reuse existing staff editors for sermons, events and groups. Publishing attribution depends on individual staff accounts. |
| Restore the previous published version | Data / Experience | From revision history, preview and restore the previous published version. Verify the restore is attributable, preserves history, and updates the public view after explicit confirmation. Depends on draft and publish. |
| Verify announcements for service updates | Experience / QA | Staff can use an existing announcement for a closure or schedule change. Verify timely display, expiry and the effect on the current featured announcement. Reuse the canonical record and existing occurrence handling where relevant. |
| Route website form submissions | Data / Experience | Route every form submitted to Thrive to one configured admin email plus optional extra recipients per form. Verify default-only and additional-recipient delivery with a test inbox. Keep the existing hosted signup, donation, and newsletter integrations where applicable and document their routing separately. |
| Add built-in website feedback | Experience / Data | Visitors can find feedback in the public footer and staff can find it in the admin portal. Both can report a bug or suggest a feature. Reuse the website form delivery path and validate input on the server. The Product Manager turns actionable reports into scrubbed issues. Depends on shared mail delivery. |
| Verify visitor parity, media and SEO | Experience / Ops | Review visitor routes, mobile and keyboard behavior, sitemap, approved forms, YouTube watch links or embeds, and ChurchSuite signup/giving. Confirm legacy redirects and active Ads destinations reach published pages. Assert actual status and Location headers for the routes in the migration map. |
| Establish the GitHub Project | Product Manager | Verify Projects permission, reuse or create the board, link the repo, connect carry-over PRs and approved tickets, and record owner, priority, status and blockers. Keep Basecamp coordination distinct from implementation tracking. |

## Connected services to verify

| Service | Evidence required |
|---|---|
| Supabase | Identify development, Preview, and production targets. Rehearse fresh install and legacy upgrade separately. Verify migrations, RLS, grants through the Supabase API, media bucket permissions, import totals, backup and recovery. The importer upserts matching slugs, so verify the disposable target before running it. |
| Vercel and NextAuth | Verify environment separation, required settings by name, staff preview, valid sign-in, unauthorized rejection, domain and rollback. Bind a protected Preview to a separate staging database with its own credentials. Look at names and behavior without printing secret values. |
| Forms mail provider | Confirm the default inbox and verified sender, configure test delivery and verify the routing before using real submissions. |
| ChurchSuite, Mailchimp and YouTube | Verify approved hosted form and giving links, newsletter destination, and channel/media links or embeds. |
| Basecamp | Identify the church team and the milestones or approvals that belong there before deciding whether an integration is needed. |

On November 18, a passive request returned HTTP 200 for the linked Vercel homepage, YouTube channel, and ChurchSuite giving page. This checks reachability. Verify playback, signup destinations, and authenticated Preview workflows separately. The Ubuntu checkout has no local app environment file or Vercel project link.

Search, automated content upkeep and broader integration automation remain roadmap candidates. Production merge, live migration and cutover follow the owner's release decision.
