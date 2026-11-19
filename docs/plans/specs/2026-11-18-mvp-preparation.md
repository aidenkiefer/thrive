# Thrive MVP release dependencies

The planning target is the week of November 23, 2026. Confirm release readiness on a configured Preview before setting a cutover date. The [development architecture](2026-11-18-mvp-development-architecture.md) holds the build contracts. The [private GitHub Project](https://github.com/users/aidenkiefer/projects/3) tracks tickets, owners and blockers; this page lists only the connected services whose configuration gates release.

## Connected services to verify

| Service | Evidence required |
|---|---|
| Supabase | Identify development, Preview, and production targets. Rehearse fresh install and legacy upgrade separately. Verify migrations, RLS, grants through the Supabase API, media bucket permissions, import totals, backup and recovery. The importer upserts matching slugs, so verify the disposable target before running it. |
| Vercel and NextAuth | Verify environment separation, required settings by name, staff preview, valid sign-in, unauthorized rejection, domain and rollback. Bind a protected Preview to a separate staging database with its own credentials. Look at names and behavior without printing secret values. |
| Forms mail provider | Confirm the default inbox and verified sender, configure test delivery and verify the routing before using real submissions. |
| ChurchSuite, Mailchimp and YouTube | Verify approved hosted form and giving links, newsletter destination, and channel/media links or embeds. |
| Basecamp | Identify the church team and the milestones or approvals that belong there before deciding whether an integration is needed. |

Search, automated content upkeep and broader integration automation remain roadmap candidates. Production merge, live migration and cutover follow the owner's release decision.
