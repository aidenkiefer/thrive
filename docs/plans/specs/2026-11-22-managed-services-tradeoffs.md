# Managed-service tradeoffs and owner decisions — 2026-11-22

**Status:** Owner accepted Google Forms, committed assets plus Supabase Storage with uploader deferred, and the GitHub Actions/private R2 backup direction on November 22. Added custom form features are low priority and not required for MVP. The owner also explicitly deferred the fixed 12-month cleanup requirement; ordinary private sharing remains required. No accounts, subscriptions, credentials, live settings or application functionality were changed by this document.

## Approved direction

Prefer managed/hosted capabilities that reduce Thrive's runtime, bespoke implementation and maintenance. Evaluate ongoing operator work, reliability, access/privacy policy, quotas, portability and migration effort, not just the monthly price. Suitable free tiers are preferred until paying is justified; no budget ceiling or unlimited spending authority was given. Present any paid commitment/expected recurring charge before enabling it.

Target **more than 1,000 concurrent website visitors**, primarily a regional audience within roughly 60 miles. This is not evidence of capacity or a limit on geography. Define journey mix, arrival rate, cache behavior, pages per visit and signup rate before a load test. Concurrent people do not each require a database connection. Prioritize CDN/static/cache delivery and avoid request-by-request database or form-processing work where a managed service can own it. Do not claim a free tier guarantees this target.

Keep Next.js, Supabase, NextAuth and Resend. No stack replacement is needed merely to link to a hosted signup form or use object storage. The approved #144 visual system remains the baseline. Provider choice and signup UI placement are separate decisions.

## Settled data and mail policy

- Initial policy approved: signup responses retained 12 months, deletion on request, owner sees all, staff assigned forms, owner exports/deletes, and no automatic marketing opt-in. After selecting Google Forms, the owner explicitly deprioritized additional configuration/custom features. For MVP use ordinary private provider sharing; no custom export/access-control subsystem, automated retention or detailed email automation is required. The owner explicitly deferred the fixed 12-month cleanup interval as well. Keep private sharing and deletion on request; do not claim exact role/export enforcement or automatic retention.
- Prayer and website feedback remain email-only for this MVP. Do not move prayer requests into hosted signup response storage just because it is available.
- Auth code sender: `info@thrivevineyard.com`. Native website notification sender: `website@updates.thrivevineyard.com`. Default recipient: `info@thrivevineyard.com`, with explicit per-form additions if approved.
- Prayer may go to that same default church inbox. Existing code still requires `FORMS_PRAYER_RECIPIENT`; set it privately to `info@thrivevineyard.com` rather than creating a new mailbox or removing the guard. This is a configuration decision, not verified deployment/delivery.
- A Google-hosted notification's sender is controlled by its chosen Google mechanism; the native Resend sender decision does not automatically apply to it.

## Signup options

| Outcome | Google Forms + Sheets | Custom native subsystem |
|---|---|---|
| Reusable forms | Duplicate/configure provider templates; provider stores per-form responses | Build definition/template/version/instance management |
| Visitor experience | Hosted link or supported embed; constrained provider branding | Full accepted Thrive visual/interaction control |
| Staff review | Google response views or assigned response Sheets; Thrive admin can link there | Build protected list/detail/filter/permissions in Thrive admin |
| Detailed notifications | Built-in new-response alerts; exact full-detail routing requires validation and potentially a small approved script/add-on | Existing Resend foundation helps, but durable storage/delivery state/retries need building |
| Access and retention | Configure per-form/Sheet sharing and owner-only management; validate download restrictions. Define removal from all response copies and a purge procedure/automation | Can implement the exact role policy; must build/test retention, export/delete controls and administration |
| Runtime/maintenance | Google owns collection/storage; little site code if no synchronization | Thrive owns validation, storage, access, migration, failures, abuse handling and administration |
| Tradeoff | External review/branding and provider policy/quotas | More development and ongoing operational responsibility |

**Owner decision:** adopt Google Forms for ordinary event/group signups and accept external response review. Link staff to authorized Google response tools from Thrive admin; do not copy answers into Supabase. Existing native prayer/feedback remain. The owner accepts dropping extra custom functionality that needs additional configuration; standard notifications and simple private sharing are sufficient for MVP. Custom in-portal review, detailed-mail automation, bespoke export enforcement and a custom form builder are not required.

Rollout checks:

1. Use a church-controlled owner account; staff get only intended provider access, no shared credentials. Confirm public signup without mandatory Google sign-in unless an individual form explicitly needs it. Do not use file-upload/one-response settings casually.
2. Duplicate a reusable group/event template, verify questions and confirmation, link the approved destination from its canonical event/group. Keep source links until the replacement works.
3. Keep public response summaries disabled. If access is revoked, update both Form and linked Sheet sharing where applicable. Provider-native permissions are the MVP mechanism, not a new custom role system.
4. Verify a sandbox response and standard new-response notification. Full response-detail email/routing and Apps Script/add-on automation are deferred, not gates. If automation is later chosen, Apps Script allows 100 email recipient deliveries/day on consumer accounts versus 1,500 on Workspace; that quota is not a Forms submission limit.
5. Record who manages/deletes provider data. The fixed 12-month cleanup requirement is owner-deferred; deletion on request remains. Do not build a timed purge job for MVP.
6. Verify mobile/accessibility and private staff response access. No bespoke renderer, API sync or response dashboard is required to satisfy signup review for this MVP.

Source checks (2026-11-22): [Google response management](https://support.google.com/docs/answer/139706?hl=en), [Form editor sharing](https://support.google.com/docs/answer/2917111?hl=en), [Google file-access restrictions](https://support.google.com/drive/answer/7166529), [response/sign-in settings](https://support.google.com/docs/answer/2839588), [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas). These capabilities do not establish a guaranteed 1,000-simultaneous-submission SLA.

## Media options

| Option | Fit and current constraints | Recommendation |
|---|---|---|
| Existing optimized site assets | Already delivered with the deployment; no new object-store/uploader setup. Still consume hosting delivery/build allowances. Changes require a deployment. | Keep the selected photos/logos/graphics already committed; finish WordPress independence. |
| Supabase Storage | Existing vendor/access ecosystem, public object URLs without a DNS migration. Free: 1 GB file storage and separate 5 GB cached/5 GB uncached egress allowances; image transformation not included on Free. | Owner-selected MVP home for changing images. Initially owner/dashboard-managed; custom staff uploader deferred. Monitor delivered bytes and storage. |
| Cloudflare R2 Standard | Free allowance 10 GB-month storage, 1M Class A/10M Class B operations monthly; direct egress has no charge. Extra S3/upload/DNS/caching setup. Public r2.dev is a development endpoint; production custom domain requires a zone in the same account. Partial DNS setup while keeping an external authoritative provider requires Business/Enterprise. | Attractive when bandwidth or media volume justifies setup; not an automatic lowest-maintenance launch choice with current GoDaddy DNS. Private backup use needs no public media domain. |

Do not put sermon video in a general image bucket; retain the existing managed video destination. Image optimization, actual transfer sizes and cache behavior matter more than audience radius alone. E.g. 1,000 visitors downloading ten 200 KB images is approximately 2 GB of client delivery before caching assumptions; this is an illustration, not measured Supabase usage.

Sources: [Supabase pricing](https://supabase.com/pricing), [storage bandwidth](https://supabase.com/docs/guides/storage/serving/bandwidth), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 public domains](https://developers.cloudflare.com/r2/buckets/public-buckets/), [partial DNS availability](https://developers.cloudflare.com/dns/zone-setups/partial-setup/). No selected provider or actual account quota/plan is implied by this comparison.

## Backups and cost boundary

“No new paid service” was an earlier proposed spending guardrail, not a constraint the owner accepted. The approved goal is the cheapest reliable, simple suitable solution, preferring free allowances and escalating paid commitments. A cron job is just a scheduler; it does not prescribe a particular provider or require moving the website stack.

**Existing decided policy:** weekly recoverable snapshots, keep newest ten; prune only after a successful verified upload. **Owner-approved implementation direction:** GitHub Actions runs the logical export outside the webapp, encrypts it before transfer and stores it in a separate private R2 bucket. Owner keeps the recovery key safely outside the failed database/account. Alert on failure AND stale/missing successful backups; rehearse restore into disposable Postgres. Prefer an appropriate private operations repository within verified included runner usage if avoiding public-workflow inactivity disablement is important. Do not put plaintext database dumps in a public repo or rely on publicly accessible workflow artifacts as the backup store.

GitHub scheduling may be delayed/dropped, and public-repo schedules disable after 60 days without repository activity; therefore successful-run freshness must be monitored. Standard public-repository runners are free; private runner usage depends on the account allowance. R2's allowance is shared by account usage, not per bucket. Estimate actual compressed dump size times ten plus other storage; no $0 guarantee. Weekly snapshots alone can lose roughly a week's changes even when working; agree recovery objectives separately.

Supabase paid plans provide daily database backups, and its docs advise free users to export off-site. A database dump does **not** back up Storage objects. Google-hosted response data would also sit outside the Supabase dump. Inventory media/provider data recovery separately, with copies and deletion behavior consistent with the approved data policy. Compare upgrading an existing plan against custom automation when verified costs or operational burden favor it.

Sources: [GitHub runner billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [GitHub scheduled workflow limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Supabase backups](https://supabase.com/docs/guides/platform/backups), [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## Immediate planning consequences

- Re-scope #50/#55 to Google Forms setup/links/private review and standard notifications. Native signup builder/response-admin/outbox/schema work is no longer MVP scope.
- Keep policy acceptance in #50; mail routing in #35/#103; media decision in #49/#59; backup mechanism in #118/#70; performance/load assumptions in #67 and release QA #74.
- Core site/CMS, approved redesign, hydration/smoke fixes, current media inventory and owner content approval can proceed without waiting for a signup provider decision.
- Wednesday November 25 remains the approved readiness target; domain cutover remains separately gated. Remaining CMS preview/restore stays deferred. None of this research verifies runtime capacity, delivery, recovery or service eligibility.
