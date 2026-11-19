# Thrive MVP architecture and release boundaries

This specification turns the [floorplan](../../../floorplan.md) into build contracts. The first development batch is in the [kickoff assignment](../../agents/assignments/2026-11-18-development-kickoff.md). The [private GitHub Project](https://github.com/users/aidenkiefer/projects/3) tracks delivery. The current code baseline is `d9d7df4`. Treat the open release-candidate PRs as separate work in progress.

## Public and staff surfaces

| Surface | MVP behavior and source |
|---|---|
| Home and Plan a Visit | Preserve current routes and correct canonical service data at its source. Staff use existing announcements for closures and service changes. Check featured placement and expiration through the existing announcement system. |
| Plan a Visit editorial body | First structured staff-editable page. Keep the existing MDX content as the initial fallback and preserve the URL and metadata. Service times and event facts continue to come from canonical records. Use this page to prove the full editorial workflow before expanding the editable set. |
| Sermons, events, groups and ministries | Continue using canonical Supabase records and the existing staff editors. Reuse the recorded media, schedule and signup fields across views. Keep YouTube playback through the existing embeds or links. |
| Contact and feedback | The first native website form is `/feedback`, linked from the public footer and staff admin. Both links use the same form. Apply the same delivery path to other site-owned forms as their legacy replacements are approved. Check root campaign slugs before reserving the route. |
| Admin | Individual staff sign-in, existing entity editors, and a structured page editor with draft, preview, publish and previous published restore. Start the revision model with Plan a Visit and announcements. |

## Staff identities and editorial revisions

- **Owner decision, 2026-11-18:** Individual staff sign in with a one-time email code; OIDC and the shared-password account are not the MVP path. Keep NextAuth's website session and server-side authorization. Use Supabase Auth to issue and verify email OTPs for preprovisioned users only, then create the NextAuth JWT after a server-side active staff membership check. Never accept a visitor-created account as staff merely because its email matches. Persist a durable staff actor UUID, the bound Supabase Auth user UUID, and an auth version in a service-only membership table. Protected requests recheck active membership and version so disabling a staff member revokes existing website sessions. Email addresses are login/contact details, not revision authorship keys. Keep the existing guarded shared account working only until the Preview cutover is verified; remove that fallback before production enrollment.
- Define a versioned structured payload for the page editor. Validate permitted blocks and fields on the server. Developer-owned pages can remain MDX. Reuse approved editorial content, and retain existing content as a fallback until the first staff revision is published. Existing announcements retain their scheduling and visibility behavior.
- Each editable item has one current draft and one current published revision, with previous publications preserved as immutable snapshots. Draft saves never change public output. Publish or restore validates the expected revision, records actor and time, and updates the published pointer atomically. A stale edit returns a conflict and preserves typed input. A restore creates an attributable publication and retains intervening history.
- Preview requires a current staff session, uses the same renderer as the public page, and stays out of shared caches, metadata, and the sitemap. Public routes only read the published version. After commit, invalidate the affected public route and any announcement surface that reads the changed record.

## Native forms and feedback

- Register each site-owned form on the server with accepted fields and optional additional recipients. The server resolves the required default inbox and deduplicates optional recipients. The submitting visitor can never select recipients or the sender. A validated optional email may be used for replies. The owner chose a dedicated transactional mail service on 2026-11-18. The implementation target is Resend via the server-only form transport and `RESEND_API_KEY`; the sender and inbox remain configuration inputs. Supabase Auth may use Resend SMTP for separate admin code messages, with separate credentials and a code-only template.
- Feedback asks for a bug or feature category and a description, with optional contact and page context. Share form handling between public and admin entry points. Input validation and abuse controls apply to both. A send returns a clear success or retryable error. Do not put submitted text in logs or a ticket. Email is the staff inbox. The delivery design does not require a submission database, a staff triage UI, or automatic public issue creation.
- Keep hosted ChurchSuite signup and giving and the existing hosted newsletter flow on their own destinations. The form inventory will record the choice for each legacy form before replacement. `info@thrivevineyard.com` remains an example until the default is configured. A fake transport supports development; a verified Resend domain, sender, API key, default inbox and sandbox delivery check are required before enabling live submissions.

## Cross-lane contracts

| Contract | Provider → consumer | Shape and acceptance |
|---|---|---|
| A1 staff actor | Data → editor and Ops | An authorized request resolves a durable staff `actorId` from a preprovisioned Supabase Auth user and active service-only membership, with an auth version. Missing, removed, rebound or unverified identities fail closed before mutation. Keep existing guarded callers working only during Preview transition. |
| C1 editorial record | Data → Experience | Versioned page/announcement payload plus an expected revision ID. Draft, preview, publish and restore share one guard. A conflict must leave current public content intact. |
| F1 native forms | Data → Experience and Ops | `submitWebsiteForm(formId, fields)` returns `{ status: 'sent' }`, `{ status: 'invalid', fieldErrors }`, or `{ status: 'unavailable' }`. For `feedback`, accept `category: 'bug' \| 'idea'`, `message`, and optional `replyEmail` and `pagePath`. Recipient lookup and mail transport are server-only. Fake and deployment transports obey the same contract. |
| E4 ministry display | Existing data contract → Experience and Ops | Use the existing ministry schedule and approved hosted URL fields from PR #11. Configured schedule and approved URL render. Missing data gets the intentional empty state. An unapproved URL never renders as a signup action. |

## Release boundaries

Preserve canonical URLs, metadata and the sitemap, and enable legacy redirects only when published destinations resolve. Reconcile Search Console and active Ads URLs against the existing migration map. GitHub Projects tracks engineering. Basecamp is the place for church decisions and approvals when the team identifies the destination. The MVP adds no automatic GitHub/Basecamp or YouTube ingestion.

Development can begin with existing code and fixture contracts. Admin OTP enrollment, Resend domain/sender/recipient configuration, approved content and legacy form links, Search Console/Ads inventory, and isolated Preview credentials block only the corresponding integration or release checks. Local configuration and test execution were parked at the owner's request during preparation. The project's verification and production approval remain part of release acceptance.
