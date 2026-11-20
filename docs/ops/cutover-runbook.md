# Production cutover runbook

**Status:** Draft. Do not change DNS until the owner decisions are filled, the linked launch checks pass, and the owner gives go/no-go approval.

## Owner decisions — complete before scheduling

| Decision / evidence | Owner answer |
|---|---|
| Target date and cutover window (time zone) | TBD |
| DNS registrar/provider, credential holder, executor | TBD |
| Canonical host (apex or www) and redirect direction | TBD |
| Current DNS zone export and WordPress rollback values | TBD |
| TTL for each changed record and lead time to lower it | TBD |
| Rollback trigger, decision maker, executor | TBD |
| How long WordPress remains online and read-only | TBD |
| Search Console property type and verified owner | TBD |
| Confirm Ads tag AW-16575196430 is inside GTM container GTM-PRJX6P9H | TBD |
| Named verifier for each checkpoint; alert recipient and channel | TBD |

Unknown DNS values, TTLs, names, and dates deliberately remain TBD. Do not infer them from this document.

## Preconditions and freeze

1. Owner and QA review the [production launch checklist](../10-launch-checklist.md) and complete its go/no-go evidence for production deployment/domain/DNS, forms, tracking, redirects, and rollback. That checklist is the acceptance record; this runbook is the execution procedure.
2. Confirm the owner-approved production deployment and domain in Vercel. The exact project/team and current WordPress DNS records must be recorded by the owner before proceeding.
3. Freeze content and data changes for the cutover window. Apply the approved seed/import first; only then allow admin edits (**seed before admin edits**). Freeze start and release time: TBD.
4. Complete the [SEO URL migration map](../04-seo-url-migration-map.md) review using Search Console exports and active Ads destinations. Confirm candidate redirects and sitemap before switching traffic.
5. Confirm the [monitoring proposal](monitoring-proposal.md), alert recipient, and first-72-hour coverage. Do not assume an alert channel is configured until verified.

## Capture DNS and rollback state

Before changing anything, the DNS executor exports or screenshots the complete current zone, records the capture time, and stores it in the owner-approved location (TBD). Record exact existing values and TTLs below. **MX records are explicitly untouched.**

| Purpose | Type/name | Current value | Current TTL | Proposed value | Proposed TTL | Change? |
|---|---|---|---|---|---|---|
| Apex website | TBD | TBD | TBD | TBD | TBD | TBD |
| www website | TBD | TBD | TBD | TBD | TBD | TBD |
| Mail routing | MX / TBD | TBD | TBD | unchanged | unchanged | **No** |
| SPF | TXT / TBD | TBD | TBD | unchanged unless separately approved | unchanged | **No** |
| DKIM | TXT / TBD | TBD | TBD | unchanged unless separately approved | unchanged | **No** |
| Resend sending-subdomain verification | TXT/CNAME / TBD | TBD | TBD | unchanged unless separately approved | unchanged | **No** |
| ChurchSuite verification, if present | TBD | TBD | TBD | TBD | TBD | TBD |
| Google/Search Console verification, if present | TBD | TBD | TBD | TBD | TBD | TBD |
| Other records from zone export | TBD | TBD | TBD | TBD | TBD | TBD |

The owner decides which web records change. Preserve the captured WordPress values for rollback. Retain SPF, DKIM, Resend, ChurchSuite, and Google verification records unless their owner separately approves a change.

## TTL plan

Lower TTL only on web records that will change, at the owner-approved lead time. Both lead time and target TTL are **TBD** until decided. Verify the DNS provider shows the new TTL before cutover. After the cutover is stable and the owner approves, restore the prior/approved TTL; value and timing: **TBD**.

Do not promise a rollback duration until changed-record TTL, prior TTL, and resolver/cache assumptions are recorded. Expected restoration window after reverting to WordPress records: **TBD**.

## Cutover sequence and checkpoints

Fill in a named verifier and execution window for each step before starting. Record results and timestamps in the launch checklist or owner-approved change record.

| Step | Action | Checkpoint / evidence | Verifier |
|---|---|---|---|
| 1 | Confirm go/no-go, content freeze, DNS export, rollback values, and TTL plan. | Preconditions complete; owner explicitly approves starting. | TBD |
| 2 | In Vercel, add/confirm the approved production domain and review displayed DNS instructions. | Domain belongs to approved project; displayed records match the approved plan. | TBD |
| 3 | At DNS provider, change only approved apex/www web records. Leave MX and mail verification untouched. | Authoritative DNS and independent lookups return planned values; record evidence and time. | TBD |
| 4 | Wait for Vercel domain validation and certificate issuance. | Vercel reports valid domain; HTTPS serves a trusted certificate for canonical host. | TBD |
| 5 | Run the [production launch checklist](../10-launch-checklist.md) against canonical host. | Homepage, /sermons, key pages, forms, admin policy, and error paths meet approved behavior. | TBD |
| 6 | Check representative legacy URLs and response headers. | Approved redirects land at intended destinations without loops/chains; use the final [migration map](../04-seo-url-migration-map.md). | TBD |
| 7 | Verify production analytics. | Production loads GTM-PRJX6P9H; confirm AW-16575196430 is configured inside it, not directly on the site. | TBD |
| 8 | Verify sitemap and Search Console. | https://<approved-canonical-domain>/sitemap.xml succeeds and Search Console accepts it. | TBD |
| 9 | Start the first 72-hour watch (see [monitoring proposal](monitoring-proposal.md)). | Record start time, alert recipient, cadence, and incidents. | TBD |

## Rollback

Triggers include sustained outage, broken high-priority pages or redirects, failed critical forms, invalid HTTPS, or another launch-stopping issue identified by owner/QA. Exact thresholds and duration: **TBD**. Rollback decision maker: **TBD**.

1. Notify owner and QA using the approved incident channel (TBD). Decision maker records the rollback decision and time.
2. At the DNS provider, restore the recorded pre-cutover WordPress web-record values. Do not alter MX, SPF, DKIM, Resend, ChurchSuite, or Google verification records.
3. If needed, open the project's Deployments in Vercel, select the last known-good production deployment, and use its production promotion/rollback action. Record deployment and result. Verifier: TBD.
4. Verify the canonical host resolves to WordPress, HTTPS is valid, and critical visitor paths work. Monitor until the rollback condition clears.
5. Expected restoration time: **TBD**, based on changed TTL and observed resolver caching. Owner must fill this before cutover. Keep WordPress online for at least the owner-approved period: **TBD**.
6. Record cause, timeline, DNS/deployment actions, and whether the freeze can end. Only the owner ends the freeze.

## WordPress retirement order

Keep WordPress available and read-only for the owner-approved period (**TBD**) after verified cutover. Retire only in this order:

1. Cutover and production checks are verified.
2. Media is re-hosted and the media check is clean: zero live wp-content/uploads references remain.
3. Production redirects are verified against the approved migration map and Search Console review.
4. WordPress stays read-only for the full owner-approved observation window; rollback is no longer required.
5. Owner authorizes retirement and records date and executor (both TBD).

**Hard dependency:** never retire WordPress while any live page hot-links its uploads.

## Search Console

1. Record existing property type (Domain or URL-prefix) and verified owner account: **TBD**. Verify ownership using the existing approved method; do not publish verification secrets here.
2. After DNS/certificate checks, open the approved property and submit https://<approved-canonical-domain>/sitemap.xml.
3. Inspect highest-priority legacy URLs and destinations. Use the top-URL exports and mapping in [the SEO migration map](../04-seo-url-migration-map.md); do not duplicate exports here.
4. Review indexing/Coverage and redirect reports after cutover. Reviewer, cadence, and escalation recipient: **TBD**.

## First 72 hours

Follow the checks and cadence selected in [monitoring-proposal.md](monitoring-proposal.md). At minimum, verify site and critical routes, form delivery, admin sign-in, Supabase availability/quota, certificate/domain validity, and Search Console redirect/indexing signals. Alert recipient, channel, and cadence are **TBD** until the owner chooses them. Use rollback steps if an owner-approved trigger is met.
