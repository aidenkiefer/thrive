# Vercel environment matrix

Until launch, every database-connected Preview uses the production Supabase project. The owner manages Vercel settings. These are proposed scopes. Each unchecked box needs owner verification in the dashboard.

**QA only** means a Preview override restricted to `cursor/qa-preview-candidate`. **Either** means supply one public key name. **Off** means leave that scope empty by default. Local development can use owner-approved isolated fixtures. **Workflow** denotes owner-managed CI inputs referenced through GitHub Actions secrets. Their values have not been inspected. Feature labels apply when the corresponding feature is deployed. The pending #15 change removes both legacy credentials. Mail rows cover the pending #15/#18 stack and the limiter row covers pending #23.

**Yes** means required for the current deployment. **All** covers every Preview branch. **Auto** denotes provider-supplied classification. **Set** denotes a workflow-defined setting. **Admin**, **Auth**, **Mail** and **Limiter** mean required for the named feature. **Legacy** applies only before #15 lands. **Optional** enables additional recipients when needed.

| Variable | Purpose | Exposure | Production | Preview | Development | CI | If missing | Owner checked |
|---|---|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint for public and admin clients | Public | Yes | All | Off | Workflow | Supabase clients cannot connect. | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client credential, preferred when both names exist | Public | Either | Either | Off | Off | Reads use the publishable key if present. | ☐ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client credential, alternate name | Public | Either | Either | Off | Workflow | Without either key the public client is unavailable. | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged admin and seed access | Server | Admin | QA only | Off | Off | Admin database operations unavailable. | ☐ |
| `NEXTAUTH_SECRET` | Session signing and admin route protection | Server | Yes | QA only | Off | Workflow | Admin authentication fails closed. | ☐ |
| `NEXTAUTH_URL` | Canonical origin for NextAuth callbacks | Server | Auth | QA only | Off | Workflow | Set the approved branch-domain origin for QA. If unset, NextAuth relies on framework detection. | ☐ |
| `ADMIN_EMAIL` | Legacy shared login identity | Server | Legacy | QA only | Off | Off | Legacy credentials login unavailable. | ☐ |
| `ADMIN_PASSWORD_SCRYPT` | Legacy shared login password verifier | Server | Legacy | QA only | Off | Off | Legacy credentials login unavailable. | ☐ |
| `VERCEL_ENV` | Provider deployment classification | System | Auto | Auto | Auto¹ | Off | Application follows its non-production paths. | ☐ |
| `NEXT_TELEMETRY_DISABLED` | Next.js telemetry control | Build | Off | Off | Off | Set | Framework telemetry policy defaults apply. | ☐ |
| `FORMS_MAIL_TRANSPORT` | Select form delivery adapter (#18) | Server | Mail | QA only | Off | Off | Explicit delivery transport unconfigured. | ☐ |
| `RESEND_API_KEY` | Authenticate form mail delivery (#18) | Server | Mail | QA only | Off | Off | Resend delivery unavailable. | ☐ |
| `FORMS_MAIL_FROM` | Verified form sender (#18) | Server | Mail | QA only | Off | Off | Verified sender unconfigured. | ☐ |
| `FORMS_DEFAULT_RECIPIENT` | Default form inbox (#18) | Server | Mail | QA only | Off | Off | Default routing unconfigured. | ☐ |
| `FORMS_FEEDBACK_EXTRA_RECIPIENTS` | Additional feedback recipients (#18) | Server | Optional | QA only | Off | Off | No additional configured recipients. | ☐ |
| `RATE_LIMIT_HASH_SECRET` | Limiter and identity hashing (#23) | Server | Limiter | QA only | Off | Off | Feedback and staff endpoints fail closed with HTTP 503. Verify on the candidate. | ☐ |
| `GOOGLE_CLIENT_ID` | Unused example OAuth identifier | Server | Off | Off | Off | Off | No implemented consumer. | ☐ |
| `GOOGLE_CLIENT_SECRET` | Unused example OAuth secret | Server | Off | Off | Off | Off | No implemented consumer. | ☐ |

¹ Vercel supplies system variables when enabled in the deployment context. A plain local shell may omit them. Public-prefixed variables are inlined into browser code at build. Keep privileged credentials server-only. On generic Preview branches, missing admin or mail credentials intentionally limit feature checks. [Vercel environment variables](https://vercel.com/docs/environment-variables)

## Runtime behavior

| Consumer | production | preview | development or unset |
|---|---|---|---|
| GTM in Analytics and tracking | Enabled | Disabled | Disabled |
| Sitemap database fetch failure | Throws | Static fallback | Static fallback |
| Safe-data error reporting | Console error | Console warning | Console warning |

These checks use `VERCEL_ENV`. A production-mode Next.js build alone cannot identify the deployment environment. Current `robots.ts` permits public routes in all environments, excludes admin and API routes, and references the production sitemap. Proposed change: emit the HTTP response header `X-Robots-Tag: noindex` for all Preview routes, including custom branch domains. Vercel normally adds a noindex response header on unique Preview deployment URLs. Custom branch domains can behave differently. Verify both surfaces actually used by QA. [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables) · [Deployment environments](https://vercel.com/docs/deployments/environments)

In pending #18, the fake mail transport depends on `NODE_ENV`. Vercel Preview uses a production-mode build, so the fake transport is unavailable there. Use Resend with owner-approved sandbox recipients.

## Owner dashboard checks

- [ ] Confirm Production branch `main`, the owner-approved production domain, and build command `npm run build` in the project dashboard.
- [ ] Check each row by name and scope. Remove inherited all-Preview privileged credentials. A branch override alone leaves the generic value available to other branches. Enable system environment variables. Redeploy after edits because existing deployments retain their prior settings.
- [ ] Confirm the Vercel Development scope is empty. Keep local fixtures separate from dashboard configuration.
- [ ] Give QA Preview its own `RATE_LIMIT_HASH_SECRET` and `NEXTAUTH_SECRET`, each distinct from its Production counterpart. Coordinate rotation at launch with the owner, including session invalidation and limiter continuity.
- [ ] Enable Vercel Authentication for Preview, authorize the QA team, and verify Production remains publicly accessible. Keep credentials and access bypass tokens private. [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
- [ ] When staff email login lands, owner configures Supabase Auth SMTP in Supabase using the host, port, username, password and sender fields. The app reads no SMTP environment variables. Follow the forthcoming [email setup runbook in #103](https://github.com/aidenkiefer/thrive/issues/103).
- [ ] Complete the [Preview smoke checklist](preview-smoke-checklist.md) against a new candidate deployment.

To repeat the names-only inventory check, compare literal environment names in `src/lib/supabase/env.ts`, `src/lib/admin-db.ts`, `src/lib/admin-auth.ts`, middleware, analytics, tracking, sitemap, safe-data and the seed script with the matrix. Include the candidate's mail transport, recipients, registry, Resend adapter, limiter and admin identities. Check the names in the tracked example file and CI workflow. Compare identifiers only, including fallback aliases. Never print an environment dump or open a local secrets file.

## Code evidence

At main commit `1228025`, Supabase reads are in `src/lib/supabase/env.ts` (lines 6, 15–16), `src/lib/admin-db.ts` (7–8) and `scripts/seed-current.ts` (11, 14–15). Auth reads are in `src/lib/admin-auth.ts` (7–9, 43–44) and `src/middleware.ts` (21). The tracked `.env.local.example` documents framework and optional names. The CI workflow in `.github/workflows/ci.yml` (23–28) specifies build inputs.

Runtime branches are in `Analytics.tsx` (10, 20), `tracking.ts` (4), `sitemap.ts` (29–30, 69), `safe-data.ts` (21) and `robots.ts` (5–6). Recheck the candidate's #15/#18 transport, recipients, registry and Resend adapter, and #23 limiter and admin-identities modules before enabling these features.
