# Preview smoke checklist

Run after deploying the candidate commit with the scopes in the [Vercel matrix](vercel-env-matrix.md). Record the commit, UTC time, check name, status code or count, and pass/fail. Mark unrun checks pending with the reason. Omit deployment identifiers, personal data, inbox screenshots, response bodies, tokens and configuration values from shared evidence.

## No database access required

- [ ] In a signed-out private window, request the unique Preview URL and any owner-approved branch domain. Expect the Vercel Authentication challenge before any app content. Stop if either exposes the app. The following read-only command reports the first status without following redirects. Inspect the challenge in the browser to distinguish it from app authentication.

  ```sh
  curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' '<preview-url>/'
  ```

- [ ] Before widening QA access, the authorized owner opens the Preview in a separate browser session. Check the actual app response headers for `X-Robots-Tag` containing `noindex` on every Preview hostname used. Inspect page source and network requests for GTM. Expect no GTM snippet or requests. With missing noindex or active production tracking, hold wider access.
- [ ] Inspect `/robots.txt` for the admin/API exclusions, public crawling allowance and production sitemap reference. Check a nonexistent public path returns 404. With no app session, open `/admin` after the Vercel challenge. Expect app sign-in or denial without private content.
- [ ] On a deployment without database access, request `/` and `/sitemap.xml` through the authorized browser. Expect a usable public shell and well-formed fallback sitemap on Preview. A successful sitemap response alone cannot verify live database connectivity.

## Requires the real database

- [ ] On the protected QA candidate only, read a known published item on a public route and verify its public link in the sitemap. Use owner-approved public content, record only pass/fail and counts, and avoid admin lists or personal records.
- [ ] When the staff-login stack is deployed, the owner signs in using an existing approved sandbox staff account and verifies the expected role boundary. The owner handles the code privately. Treat sign-in as stateful because it can send mail or update auth state. Follow the owner-approved execution windows in [#41](https://github.com/aidenkiefer/thrive/issues/41).
- [ ] Before testing a form, the owner privately confirms the sender, sandbox default recipient, form-specific overrides and any additional feedback recipients. If any route can reach a real inbox, leave the test pending. Follow the forthcoming [#103 email runbook](https://github.com/aidenkiefer/thrive/issues/103) for sender readiness. Verify sandbox receipt with a pass/fail entry only.
- [ ] **Optional write check, Data executor only.** Require an explicit owner go on the issue identifying the single operation, verified backup, and cleanup/restore plan before execution. Ops does not submit forms or write records. If the single approved operation is a sandbox form submission, Data submits it once with synthetic content and the owner checks delivery. Record the issue reference and sanitized outcome. Stop after the approved operation.

For the full privilege, limiter, migration, staff sign-in and sandbox-mail checks, use [#41](https://github.com/aidenkiefer/thrive/issues/41) and the [planned Preview verification runbook](preview-verification-runbook.md) when it lands.
