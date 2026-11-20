# Launch monitoring proposal

**Status:** Options for owner decision. No monitoring account has been created and no dependency has been added. Pricing and plan details checked **2026-11-20**; confirm with the provider before signup.

## Options

| Option | What it covers | Setup effort | Published cost | Data and privacy |
|---|---|---|---|---|
| **A. Vercel dashboard only** | Deployment/build status and available runtime logs/observability. No independent availability check; form delivery, admin sign-in failures, Supabase quota/outage, and certificate expiry need separate review or alerts. | Lowest: use the existing project dashboard. | Existing Vercel plan; features and limits depend on account plan. Vercel currently lists Hobby at $0 for personal/non-commercial use and Pro at $20/month; this church's applicable plan is TBD. Hobby runtime logs have limited retention. [Vercel pricing](https://vercel.com/pricing), [runtime log limits](https://vercel.com/docs/logs/runtime). | Avoid logging visitor PII, form contents, tokens, and secrets. No added client-side tracking. |
| **B. Vercel plus UptimeRobot Free** | Option A plus external HTTP/keyword checks for availability and HTTP failures. Does not by itself establish successful email delivery, admin authentication, or Supabase health. | Low: configure monitors and an alert recipient after owner approval. Free checks are every 5 minutes; verify exact limits before signup. | Free plan advertised; paid upgrades and SMS/voice credits are optional. [UptimeRobot pricing](https://uptimerobot.com/pricing/), checked 2026-11-20. | Sends monitored URLs/status results to provider. Monitor public pages only; omit private query strings, account data, form payloads, and visitor identifiers. No browser script needed. |
| **C. Better Stack combined monitoring** | External uptime/incident notification plus error tracking and logs, subject to selected products and quotas. Form and admin alerts require suitable server-side events. | Medium: select products, configure monitors/alerts, and instrument errors/logs. | Free plan advertised for personal projects with product-specific quotas; pricing lists paid products starting at $29/month annual or $34/month monthly. Eligibility and exact bundle for a church are TBD; verify before adoption. [Better Stack pricing](https://betterstack.com/pricing), checked 2026-11-20. | Redact PII and secrets in error reports/logs. Do not enable session replay or client-side tracking without a separate owner/privacy decision. No cookie/consent notice is currently planned. |

## Owner decision

Choose an option or specify another provider: **TBD**. Also decide:

- Who creates and owns any selected account: **TBD**.
- Alert recipient(s) and channel (email, SMS, or other): **TBD**.
- Monthly budget ceiling and approval for any paid plan: **TBD**.
- Whether to add error reporting/instrumentation and its server-side data redaction policy: **TBD**.

Until these choices are recorded, do not create an account, key, SDK, or alert route. Do not add client-side tracking as part of this proposal.

## Minimum day-one checks if external uptime is chosen

- Check the approved production homepage and /sermons over HTTPS; expected status is HTTP 200. Production hostname/canonical host remains TBD until confirmed in the cutover runbook.
- Use a 5-minute interval if the selected tier supports it; alert threshold is TBD.
- Send alerts to the owner-approved recipient/channel (TBD).
- Keep form delivery, admin sign-in failures, and Supabase outage/quota as manual/dashboard checks until a server-side alert is approved. Monitoring events must not include visitor PII or submitted form text.

## Follow-up coverage gaps

No current application health endpoint or error-monitoring SDK was found in the inspected app paths. These changes are not part of this proposal:

- **Data lane:** add a server-side health route reporting dependency availability without secrets or sensitive database details.
- **Data lane:** emit redacted server-side signals for Resend delivery failures and relevant Supabase availability/quota errors.
- **Data lane:** emit a safe aggregate signal for admin sign-in failures; never include codes, credentials, or submitted content.
- **Ops lane:** after provider selection, record alert routing and incident ownership in the cutover runbook.

See [the cutover runbook](cutover-runbook.md) for the first-72-hour watch and rollback procedure.
