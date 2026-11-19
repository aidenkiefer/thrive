# Launch URL and form disposition (working matrix)

**Status:** Prepared for owner and QA review, 2026-11-18. This matrix reconciles the live-site inventory in `docs/01-current-site-audit.md` with `docs/04-seo-url-migration-map.md` and the MVP architecture. It records intended destinations; it does not authorize a redirect until the destination is published and returns 200. Search Console and active Ads destinations are still needed for final priority and per-slug rules.

## Routes

| Existing route | Target or disposition | Launch gate / owner input |
|---|---|---|
| `/` | `/` | Homepage content and primary CTAs approved. |
| `/im-new/` | `/plan-a-visit` | Existing redirect; confirm the visit form and service details on the target. |
| `/teaching/` | `/sermons` | Existing redirect; preserve YouTube and podcast access on target. |
| `/sermons/`, `/sermons/[slug]/` | Same paths | Confirm imported slugs; redirect exceptions individually. |
| `/events/` | `/events` | Confirm current event data. |
| `/upcoming-events/[slug]/` | `/events/[slug]` | Existing pattern redirect; verify every migrated event slug and cancellation state. |
| `/groups/` | `/groups` | Confirm group content and registration destinations. |
| `/kids/` | `/kids-youth` | Existing redirect; confirm Kids contact handoff. |
| `/youth-alpha/` | **Owner decision pending**: published Youth Alpha page or the relevant `/kids-youth` section | PR #8 proposed a redirect, but its Preview destination returned 404. Do not activate until the chosen published destination returns 200 and current dates/form are approved. |
| `/about/`, `/give/` | Same paths | Preserve prayer and all approved giving methods, respectively. |
| `/get-connected/` | Same path, once the contact hub is published | No redirect is needed. Preserve routed contact intent through the native email form. |
| `/prayer/` | Temporary 302 to `/get-connected` (owner decision 2026-11-07) | Activate only after that destination is published; retain a path to the confidential prayer workflow. |
| `/expresso/` | 301 to `/plan-a-visit#services` (owner decision 2026-11-07) | Confirm current schedule and working fragment target. |
| `/volunteering/` | Temporary 302 to `/get-connected` (owner decision 2026-11-07) | Activate only after that destination is published; keep volunteering intent clear. |
| `/series/[slug]/` | `/sermons/series/[slug]` | Existing pattern redirect; verify imported series slugs and target 200s. |
| `/speaker/[slug]/`, `/topics/[slug]/`, `/book/[slug]/`, `/service-type/[slug]/` | Per-taxonomy decision pending | Map to working filtered archives or individual destinations after content export; do not bulk-redirect to nonexistent filters. |
| `/joydrop/`, `/pantry/`, `/plug/`, `/la-vina/`, `/prayer-walk/`, `/greenthumbs/`, `/sokm/` | Published ministry or campaign page, per slug | Confirm whether each campaign remains active and its canonical record, CTA, and target. |
| `/feel-the-power/`, `/fuelthefire/`, `/fasting/`, `/easter/`, `/christmas-guide/` | Campaign-specific published page or approved retired-campaign disposition | Check active Ads links and Search Console before any redirect. |
| `/communications/` | Staff-only workflow; no public migration | Record the staff destination separately; do not expose the old internal form publicly. |
| `/news/`, WordPress admin/API paths, stale staging domains | No public migration | Preserve the site 404/retirement behavior as appropriate. |

## Forms and submission handoffs

**Native email forms** use the planned server-side registry and delivery boundary. One configured admin inbox is the default, with optional extra recipients per form, deduplicated server-side. The example address `info@thrivevineyard.com` needs owner confirmation and credentials; it is not a live configuration. Submission success must mean delivery was accepted. Do not use a production inbox to verify Preview.

**Hosted registrations** are outbound HTTPS links to approved ChurchSuite or Google Forms destinations. A public page renders a signup CTA only when its configured URL passes `isApprovedFormUrl`. These links are not native email submissions and should not be described as already migrated merely because the page exists.

| Live form / entry route | Intended owner and target | Launch gate / owner input |
|---|---|---|
| First-time visitor RSVP (`/im-new/`) | Native visit email form on `/plan-a-visit` | Confirm fields, recipient, consent/copy, and successful sandbox delivery. |
| Prayer request (`/about/`, `/teaching/`, `/prayer/`, `/expresso/`) | One native prayer email workflow reached from each relevant page | Confirm confidential handling, recipient access, and successful sandbox delivery. |
| Routed contact (`/get-connected/`) | Native contact email form | Preserve a clear reason/topic field if staff need it; confirm destination and delivery. |
| Kids ministry contact (`/kids/`) | Native contact form with Kids context or approved hosted form | Confirm whether staff need a dedicated extra recipient. Avoid unnecessary child details in email. |
| Group interest (`/groups/`, `/group-form-sign-up/`) | Approved hosted ChurchSuite/Google form per group, or a defined native interest form | Inventory the extended checkbox options and obtain each published signup URL. No dead CTA. |
| Youth Alpha interest (`/youth-alpha/`) | Approved hosted registration if active, otherwise no signup CTA | Confirm current program, dates, URL, and the route destination together. |
| Joy Drop / Pantry program signup | Approved hosted registration per active program | Confirm current program and URL; keep page and form publication coupled. |
| Staff communications request (`/communications/`) | Restricted staff workflow, later admin ticket | Do not expose as a public form. |
| Public and admin website feedback (new) | Native feedback email form, with page at `/feedback` and an admin entry point | Accept bug/feature feedback with useful context; default admin inbox and optional extra recipients. Confirm delivery in sandbox. |
| Homepage and contact newsletter signup | Existing Mailchimp embed or approved outbound signup | Confirm live list and copy; separate from native email forms. |

## Before enabling launch redirects and forms

1. Obtain Search Console URL export and active Google Ads destination list; add missing high-traffic and campaign slugs.
2. Confirm owner-approved target routes, current copy, form destinations, and inbox configuration.
3. For each activated redirect, verify a 200 target and the expected content/CTA in Preview; record exceptions by slug.
4. Exercise native forms with a sandbox recipient, including validation, delivery failure, and success states. Confirm hosted signup links resolve without exposing unapproved destinations.
