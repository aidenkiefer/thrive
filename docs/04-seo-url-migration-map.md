# 04 — SEO URL Migration Map

Maps live WordPress URLs to planned Next.js routes. **Status:** Draft — built from [01-current-site-audit.md](./01-current-site-audit.md) crawl (2026-06-20). Final redirects require Google Search Console audit to prioritize high-traffic URLs.

Redirects are configured in `next.config.ts` → `redirects()`.

---

## Priority mapping (named routes)

| Live URL | New URL | Status | Priority | Notes |
|---|---|---|---|---|
| `/im-new/` | `/plan-a-visit` | implemented | High | Primary "Plan a Visit" page; high ad/visitor traffic |
| `/teaching/` | `/sermons` | implemented | High | Watch & Listen hub; consider keeping `/teaching/` as alias |
| `/sermons/` | `/sermons` | same-path | — | Verify slug parity during export |
| `/sermons/[slug]/` | `/sermons/[slug]` | same-path | — | Verify slug parity during export |
| `/events/` | `/events` | same-path | — | Same path |
| `/upcoming-events/[slug]/` | `/events/[slug]` | implemented | High | MEC prefix change — all ~62 events |
| `/groups/` | `/groups` | same-path | — | Same path |
| `/kids/` | `/kids-youth` | implemented | High | Path change |
| `/youth-alpha/` | `/ministries/youth-alpha` | implemented | Medium | Dedicated ministry page; owner creates the canonical record |
| `/about/` | `/about` | same-path | — | Same path |
| `/give/` | `/give` | same-path | — | Same path |
| `/get-connected/` | TBD | pending-audit | Medium | A2 recommendation and owner decision required |
| `/prayer/` | TBD | pending-audit | Medium | A2 recommendation and owner decision required |
| `/expresso/` | TBD | pending-audit | Medium | A2 recommendation and owner decision required |
| `/volunteering/` | TBD | pending-audit | Low | A2 recommendation and owner decision required |

---

## Sermon taxonomy redirects

Live site uses singular taxonomy paths not in planned IA. Options:

1. **301 to `/sermons`** with query/filter params (requires filter UI)
2. **301 to `/sermons/series/[slug]`** for series only; others to `/sermons`
3. **Keep taxonomy routes** as optional archive pages

| Live pattern | Redirect | Status | Count |
|---|---|---|---|
| `/series/[slug]/` | `/sermons/series/[slug]` | implemented | Per series |
| `/speaker/[slug]/` | TBD | pending-audit | Per speaker |
| `/topics/[slug]/` | `/sermons` | implemented, temporary | Temporary until topic filters exist |
| `/book/[slug]/` | `/sermons` | implemented, temporary | Temporary until book filters exist |
| `/service-type/[slug]/` | `/sermons` | implemented, temporary | Temporary until service-type filters exist |

---

## Campaign / landing page redirects

Live campaign pages at root slugs. Map to `landing_pages` table or named routes:

| Live slug | Suggested handling | Status |
|---|---|---|
| `/joydrop/` | `outreach` entity or landing page | pending-audit |
| `/pantry/` | Landing page linked to Pack the Pantry event | pending-audit |
| `/plug/` | `recurring_events` or landing page | pending-audit |
| `/la-vina/` | `ministries` entity | pending-audit |
| `/prayer-walk/` | `outreach` entity | pending-audit |
| `/greenthumbs/` | Landing page | pending-audit |
| `/sokm/` | Landing page or ministry | pending-audit |
| `/feel-the-power/`, `/fuelthefire/`, `/fasting/` | Landing pages — check ad traffic in Search Console | pending-audit |
| `/easter/`, `/christmas-guide/` | Seasonal landing pages — may expire | pending-audit |

**Google Ads:** Confirm active campaign destination URLs against this list before launch. Conversion ID: `AW-16575196430`.

---

## Do not migrate

| URL pattern | Reason |
|---|---|
| `*.wpenginepowered.com/*` | Stale staging links in WP nav |
| `*.myftpupload.com/*` | Stale GoDaddy staging links |
| `/news/` | Empty WordPress placeholder |
| `/wp-admin/*`, `/wp-json/*` | WordPress infrastructure |
| `/communications/` | Internal staff form — not public |

---

## Search Console checklist (before launch)

- [ ] Export top 100 URLs by clicks (last 12 months)
- [ ] Export top 100 URLs by impressions
- [ ] Cross-reference with sermon slugs, event slugs, and campaign pages above
- [ ] Flag any live URL with >50 clicks/month missing from this map
- [ ] Verify `/im-new/` and `/teaching/` traffic (likely highest non-homepage pages)
- [ ] Confirm active Google Ads landing page URLs

---

## Implementation

```typescript
// next.config.ts — example format (populate after Search Console audit)
async redirects() {
  return [
    { source: '/im-new', destination: '/plan-a-visit', permanent: true },
    { source: '/im-new/:path*', destination: '/plan-a-visit', permanent: true },
    { source: '/teaching', destination: '/sermons', permanent: true },
    { source: '/upcoming-events/:slug', destination: '/events/:slug', permanent: true },
    { source: '/kids', destination: '/kids-youth', permanent: true },
    { source: '/youth-alpha', destination: '/ministries/youth-alpha', permanent: true },
    { source: '/topics/:slug', destination: '/sermons', permanent: false },
    { source: '/book/:slug', destination: '/sermons', permanent: false },
    { source: '/service-type/:slug', destination: '/sermons', permanent: false },
  ]
}
```

Campaign and undecided named-route redirects remain pending until A2 recommendations and owner approval.
