# 06 — Integrations

## Supabase

**Role:** Primary data layer for all dynamic content.

**What lives here:**
- All content tables (sermons, events, groups, announcements, landing pages, etc.)
- Media file storage (images, audio, video uploaded through the admin panel)
- Admin authentication (via NextAuth using Supabase as the user store, or Supabase Auth directly)

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

**Recommended provider:** Credentials (email + password) stored in Supabase, or Google OAuth restricted to `@thrivevineyard.com` accounts if the church uses Google Workspace.

**Session strategy:** JWT sessions — no additional database table needed.

**Implementation:**
- `middleware.ts` at the project root intercepts all `/admin` requests and redirects unauthenticated users to `/admin/login`
- `auth()` from NextAuth is called in Server Components to get the session
- The login page lives at `/admin/login` (outside the middleware-protected path)

**Environment variables:**
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=
# If using Google OAuth:
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## ChurchSuite

**Role:** Registration and signup forms only. ChurchSuite owns the registration data; the website does not sync or store it.

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

**Cost:** Free tier covers a church website comfortably (100GB bandwidth/month, unlimited requests on hobby plan).

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

### `next-mdx-remote`

**Current version:** v5 (installed)
**Status:** Upgrade required before implementing MDX page rendering.

v5 has a high-severity vulnerability ([GHSA-g4xw-jxrg-5f6m](https://github.com/advisories/GHSA-g4xw-jxrg-5f6m)): arbitrary code execution via untrusted MDX content in React SSR. This only applies when rendering MDX from user-controlled or untrusted input — our MDX files are developer-authored and committed to the repo, so the risk is low until we wire up the renderer.

**Before implementing MDX pages:** upgrade to v6. The `serialize` / `MDXRemote` API is largely the same but the import paths changed. Since no MDX rendering code has been written yet, this is a clean upgrade.

```bash
npm install next-mdx-remote@6
```

### Moderate vulnerabilities in `postcss` / `next` / `uuid`

These appear in `npm audit` but are in Next.js's and NextAuth's internal dependency trees — they cannot be fixed without downgrading Next.js to v9 (not appropriate). They will resolve when Next.js and NextAuth release their own dependency updates. Safe to ignore for now; monitor with `npm audit` on each dependency bump.

---

## Future Integrations (Not Planned Yet)

| System | Potential use |
|---|---|
| Podcast platform (Spotify / Apple) | Auto-publish sermons to podcast feed via RSS |
| YouTube | Embed sermon videos from a church YouTube channel |
| Google Search Console | SEO monitoring — not a code integration, just a tool to use |
| Email/newsletter | Newsletter signup form on homepage (Mailchimp, Kit, etc.) |
| Livestream | Embed active livestream on Watch page (YouTube Live / Vimeo) |

These are noted here so they can be designed in rather than bolted on later, but none are in scope for the initial build.
