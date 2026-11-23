# 06 — Integrations

## MVP signup refinement — later 2026-11-22

Owner chose a **branded Thrive signup surface linking to Google's hosted form** for MVP. Use the official Forms REST API through an operator CLI to create/read/update/publish forms from reusable templates (#151); no authenticated Google API call per public page view. Responses/private review remain in Google. Custom Thrive input rendering and an Apps Script submission bridge are post-MVP (#148), not launch blockers. The branded surface is #149; #50 is the umbrella.

Free Browser/Computer setup is authorized for the later owner-assisted window. Defer account consent/provisioning until then; do not enable a paid plan, billable commitment or unknown-cost service. This does not replace artifact-specific live database or DNS approval. Build/QA templates, dry runs, mocked API adapters and branded handoff states before setup; mocks never establish real service success. Newest refinement supersedes earlier plain-link-only or custom-field aspirations.

The [current floorplan](../floorplan.md) adds server-side email for Thrive-owned forms and GitHub Projects for development tracking. Hosted integrations still use their own destinations. See [MVP release dependencies](plans/specs/2026-11-18-mvp-preparation.md) for service checks.

## Current service decisions (2026-11-22)

Owner direction: prefer managed services and suitable free allowances to reduce Thrive's application runtime and maintenance; paying is allowed when justified and owner-approved. The existing stack remains. Target >1,000 concurrent regional website users is not a verified free-tier capacity claim.

- **Signups:** Google Forms/Sheets with external response review and approved site/admin links. Do not build native form definitions/response storage/admin review or synchronize responses into Supabase for MVP. Standard provider notifications are sufficient; detailed-email automation and bespoke access/export tooling are deferred. Keep response sharing private; the fixed 12-month cleanup requirement is explicitly deferred.
- **Native feedback/prayer:** continue Resend email-only flows. Auth sender info@thrivevineyard.com; website sender website@updates.thrivevineyard.com; default recipient info@thrivevineyard.com. Set the existing FORMS_PRAYER_RECIPIENT to that same address privately; a separate mailbox is unnecessary. No configuration or delivery is proved by this decision.
- **Media:** existing optimized assets remain in the site; changing images use Supabase Storage, owner/dashboard-managed initially. Custom staff upload UI is deferred. Storage/upload currently described below is an intended integration, not proof of an implemented uploader.
- **Recovery:** weekly GitHub Actions logical exports, encrypted before upload to separate private R2 storage, newest ten verified snapshots, restore rehearsal and failure/staleness alerts. Account/credential/paid setup remains owner-controlled. Database exports do not recover media objects or Google response data; inventory those separately.

See [the source-backed comparison and record](plans/specs/2026-11-22-managed-services-tradeoffs.md). Newest dated decisions override historical assumptions below.

## Supabase

**Role:** Primary data layer for all dynamic content.

**What lives here:**
- All content tables (sermons, events, groups, announcements, landing pages, etc.)
- Owner/dashboard-managed image storage for changing media (chosen 2026-11-22; custom staff uploader deferred). Existing video remains on its managed video destination; no generic admin audio/video upload is claimed.
- Staff email-code issuance and verification in Supabase Auth; service-only `admin_staff_accounts` membership binds each Auth user to a durable actor ID

**Access pattern:**
- Public pages query Supabase from Next.js Server Components using the `@supabase/supabase-js` server client
- Admin pages query with elevated permissions (service role key, never exposed to the client)
- Row Level Security (RLS) should be enabled — public reads on published records only; writes require an authenticated admin session

**Environment variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only, never exposed to browser
```

**ISR revalidation:**
Dynamic pages (sermons, events, groups) use `next: { revalidate: 60 }` on fetch calls — pages are cached and refreshed every 60 seconds without a full deploy. Time-sensitive pages (homepage, announcements) can use shorter intervals or on-demand revalidation via a webhook from the admin panel on save.

---

## NextAuth.js

**Role:** Admin panel authentication.

**Scope:** Protects all `/admin/**` routes. The rest of the site is public.

**Provider:** One-time email code through Supabase Auth for owner-provisioned staff users only. NextAuth's credentials callback verifies the code and issues a website JWT only after a service-only active membership check. There is no shared-password or Google OAuth fallback.

**Session strategy:** JWT sessions — no additional database table needed.

**Implementation:**
- `middleware.ts` at the project root intercepts all `/admin` requests and redirects unauthenticated users to `/admin/login`
- `requireAdmin()` is called on every protected server page and action to recheck active membership and auth version before reading or writing
- The login page lives at `/admin/login` (outside the middleware-protected path)

**Environment variables:**
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= # or NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=          # server only
```

Supabase Auth needs a code-only email template and dedicated SMTP credentials. Public signup stays disabled. See [admin-setup.md](./admin-setup.md) for staff enrollment, Preview checks, and the shared rate-limit release gate.

**Shared abuse limiter (fails closed).** Code requests, code verification, and native form submissions are rate limited through `public.take_rate_limit` in Supabase Postgres, called with the service role and `RATE_LIMIT_HASH_SECRET`. The limiter fails closed: if the secret or Supabase configuration is missing, or the RPC errors or times out, the request is refused rather than let through. Each refusal logs one fixed code and never the email or address. Client addresses come from the first `x-forwarded-for` hop, which is trusted because Vercel sets it. See [admin-setup.md](./admin-setup.md#release-gate-shared-rate-limiting).

---


## Resend (website form delivery)

The native website feedback form uses the server-side F1 form registry and the D3 Resend Email API transport. `FORMS_MAIL_TRANSPORT=resend` selects delivery only when `RESEND_API_KEY` is present; an unconfigured or failed send returns an unavailable result to the visitor. The fake transport is for local development and cannot be selected in production. The form registry resolves the sender and required default recipient on the server, with optional additional recipients per form. The visitor cannot set either.

Configure `RESEND_API_KEY`, `FORMS_MAIL_FROM`, and `FORMS_DEFAULT_RECIPIENT` as server-only deployment variables. Use a scoped API key for website forms. The updates sending domain and a sandbox feedback send were recorded as verified on November 20. The November 22 owner decision selects website@updates.thrivevineyard.com for native website sends and info@thrivevineyard.com as default recipient, including prayer. Production configuration and inbox delivery remain checks; the historical sandbox result does not prove them. Resend acceptance is not proof of inbox receipt: before enabling public submission, use an isolated Preview deployment and an approved test recipient to verify delivery, Reply-To, failure handling, and access to submissions. Do not send test content to the production inbox without the owner's direction.

Supabase Auth may use Resend SMTP for staff one-time codes, with a separate key and code-only template. Keep authentication traffic and website feedback messages distinct.

---

## ChurchSuite

**Role on live site:** Online giving only (`thrivevineyard.churchsuite.com/donate/`).

**Role on new site:** Giving continues through the ChurchSuite donate destination. Group/event signup provider is now Google Forms. Existing hosted signup URLs are migration references until approved Google destinations are configured and tested; legacy column names do not dictate the provider.

**Important:** The live WordPress site uses **Gravity Forms** for signups and contact — not ChurchSuite. See [01-current-site-audit.md](./01-current-site-audit.md) for the full form inventory and migration decision.

**Integration pattern:** Every entity that has a signup (groups, events, outreach) stores a `churchsuite_form_url` field. The website renders a button or link pointing to that URL. No API calls, no iframes required — a simple redirect or new tab is sufficient.

**Example:**
```
Group: "Tuesday Night Small Group"
churchsuite_form_url: "https://thrivevineyard.churchsuite.com/groups/123/signup"

Rendered as:
<a href={group.churchsuite_form_url} target="_blank">Sign Up</a>
```

**What ChurchSuite does NOT own:**
- Event and group data — that lives in Supabase
- Website content — all managed in the Next.js admin panel

---

## Vercel

**Role:** Hosting for the Next.js application.

**Relevant features used:**
- **ISR** — Incremental Static Regeneration for sermon, event, and group pages (fast loads + fresh content)
- **Edge Middleware** — Admin route protection via `middleware.ts`
- **Environment Variables** — All secrets stored in Vercel's environment variable dashboard, not in the repo
- **Redirects** — 301 redirects from old WordPress URLs configured in `next.config.ts` (populated from `04-seo-url-migration-map.md`)

**Deployment:** Auto-deploys on push to `main`. Preview deployments on PRs/branches.

**Cost/capacity:** Verify the current Vercel account plan, eligibility and included delivery/compute/image allowances. Do not assume unlimited requests or that free hosting proves the >1,000 concurrent-visitor target. Estimate cache-hit and uncached request load; measure before claiming readiness. Current plan documentation: https://vercel.com/docs/plans/hobby (checked 2026-11-22).

---

## Mailchimp (live — confirm for new site)

**Role:** Newsletter signup on homepage and `/get-connected/`.

**Live embed:** Email + First Name fields; list reference `eepurl.com/iTHsnQ`.

**New site:** Embed on homepage newsletter section (see [03-information-architecture.md](./03-information-architecture.md)). No API sync — embed or link only.

---

## YouTube

**Role:** Sermon video embeds.

**Channel:** `@thrivevineyardchurchus`

**Usage:** Embedded on `/teaching/` (live) and individual sermon pages. New site stores `youtube_url` on sermon records and embeds on `/sermons/[slug]`.

---

## RSS.com Podcast (live — confirm scope)

**Role:** Auto-distributed sermon audio ("Sunday Morning Messages").

**Live:** RSS.com feed `thrivevineyard`; embedded player on `/teaching/`; Apple Podcasts `id1764577277`; Amazon Music link.

**New site decision:** Keep RSS.com as external feed (link from `/sermons`) or build native podcast RSS from Supabase sermon records. Currently active on live site — do not defer silently.

---

## Giving (multi-channel)

Live `/give/` page supports four channels — all must appear in `/give` MDX:

| Method | Detail |
|---|---|
| ChurchSuite | `thrivevineyard.churchsuite.com/donate/` |
| Zelle | `give@thrivevineyard.com` — include fund designation in memo |
| Chase QuickPay | `give@thrivevineyard.com` |
| Mail | 1273 N Jack Pine Ct, Palatine, IL 60067 |
| In person | Sunday offering during services |

---

## Google Tag Manager & Ads

**Live tracking (preserve through migration):**

| ID | Purpose |
|---|---|
| `GTM-NQV3Z3N7` | Google Tag Manager container (live WordPress site) |
| `GTM-PRJX6P9H` | Google Tag Manager container (new site, owner choice 2026-11-18) |
| `AW-16575196430` | Google Ads conversion tracking |

The new site loads only `GTM-PRJX6P9H`; Ads `AW-16575196430` is not loaded directly, and the owner is to confirm it lives inside that container.

Add to new site layout before decommissioning WordPress. Active ad campaigns depend on landing page URLs — see [04-seo-url-migration-map.md](./04-seo-url-migration-map.md).

---

## Gravity Forms (live WordPress only)

**Role:** All signup, contact, prayer, and visitor forms on the live site.

**Migration:** Not carried forward as-is. Options: (1) ChurchSuite form URLs on entities, (2) embed remaining Gravity Forms during transition, (3) custom form handlers. Full inventory in [01-current-site-audit.md](./01-current-site-audit.md).

---

## Google Ads

**Role:** Campaigns drive traffic to specific landing pages on the website.

**Integration pattern:** No technical integration required. Google Ads links directly to URLs on the new site. The `landing_pages` table powers these pages.

**Workflow for new campaigns:**
1. Staff creates a landing page in `/admin/landing-pages`
2. Optionally links it to a canonical entity (recurring event, group) to pull its description, image, and signup form
3. Publishes the landing page — it becomes available at `/[slug]`
4. Staff updates the Google Ad destination URL to the new slug

**Landing page design considerations:**
- No global nav (or a simplified nav) — reduce exit paths for ad traffic
- Clear single CTA pointing to a ChurchSuite signup URL
- All the usual SEO fields (title, description, og:image) populated for the ad platform's link preview

---

## Dependency Notes

### next-mdx-remote

**Current version:** ^6.0.0 (declared in package.json)
**Status:** Installed; the former “v5 installed, upgrade required” note is stale.

Keep MDX developer-authored and reviewed. Do not render user-controlled MDX without a separate security review and current advisory check.

See [the 2026-11-20 dependency audit](ops/dependency-triage.md) for the lockfile triage and remediation.


## Future Integrations (Not Planned Yet)

| System | Potential use | Live site status |
|---|---|---|
| Livestream | Embed active livestream on Watch page (YouTube Live / Vimeo) | No dedicated livestream page today |
| Google Search Console | SEO monitoring — not a code integration | Needed before finalizing redirects |
| Custom prayer/contact forms | Replace Gravity Forms workflows | Live uses Gravity Forms extensively |

**Promoted from future (now active on live site):** Mailchimp, YouTube, RSS.com podcast — see sections above. Confirm scope for v1.0.0 launch.
