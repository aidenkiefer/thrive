# 04 — SEO URL Migration Map

Maps live WordPress URLs to planned Next.js routes. **Status:** Draft — built from [01-current-site-audit.md](./01-current-site-audit.md) crawl (2026-06-20). Final redirects require Google Search Console audit to prioritize high-traffic URLs.

Redirects are configured in `next.config.ts` → `redirects()`.

---

## Priority mapping (named routes)

| Live URL | New URL | Priority | Notes |
|---|---|---|---|
| `/im-new/` | `/plan-a-visit` | High | Primary "Plan a Visit" page; high ad/visitor traffic |
| `/teaching/` | `/sermons` | High | Watch & Listen hub; consider keeping `/teaching/` as alias |
| `/sermons/` | `/sermons` | — | Same path |
| `/sermons/[slug]/` | `/sermons/[slug]` | — | Verify slug parity during export |
| `/events/` | `/events` | — | Same path |
| `/upcoming-events/[slug]/` | `/events/[slug]` | High | MEC prefix change — all ~62 events |
| `/groups/` | `/groups` | — | Same path |
| `/kids/` | `/kids-youth` | High | Path change |
| `/youth-alpha/` | `/kids-youth#youth-alpha` or `/youth-alpha` | Medium | Decide: anchor vs dedicated route |
| `/about/` | `/about` | — | Same path |
| `/give/` | `/give` | — | Same path |
| `/get-connected/` | `/plan-a-visit` or `/about` | Medium | No 1:1 equivalent — split contact CTAs |
| `/prayer/` | TBD | Medium | New route or embed in `/about` |
| `/expresso/` | `/plan-a-visit#expresso` | Medium | Section redirect |
| `/volunteering/` | `/give#volunteer` | Low | Partial content overlap |

---

## Sermon taxonomy redirects

Live site uses singular taxonomy paths not in planned IA. Options:

1. **301 to `/sermons`** with query/filter params (requires filter UI)
2. **301 to `/sermons/series/[slug]`** for series only; others to `/sermons`
3. **Keep taxonomy routes** as optional archive pages

| Live pattern | Suggested redirect | Count |
|---|---|---|
| `/series/[slug]/` | `/sermons/series/[slug]` | Per series |
| `/speaker/[slug]/` | `/sermons/speakers/[slug]` | Per speaker |
| `/topics/[slug]/` | `/sermons?topic=[slug]` | TBD — filter not built yet |
| `/book/[slug]/` | `/sermons?book=[slug]` | TBD |
| `/service-type/[slug]/` | `/sermons?type=[slug]` | TBD |

---

## Campaign / landing page redirects

Live campaign pages at root slugs. Map to `landing_pages` table or named routes:

| Live slug | Suggested handling |
|---|---|
| `/joydrop/` | `outreach` entity or landing page |
| `/pantry/` | Landing page linked to Pack the Pantry event |
| `/plug/` | `recurring_events` or landing page |
| `/la-vina/` | `ministries` entity |
| `/prayer-walk/` | `outreach` entity |
| `/greenthumbs/` | Landing page |
| `/sokm/` | Landing page or ministry |
| `/feel-the-power/`, `/fuelthefire/`, `/fasting/` | Landing pages — check ad traffic in Search Console |
| `/easter/`, `/christmas-guide/` | Seasonal landing pages — may expire |

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
    // ... per-slug campaign redirects added after Search Console review
  ]
}
```

Full per-slug redirect list to be appended after content export and Search Console audit.
