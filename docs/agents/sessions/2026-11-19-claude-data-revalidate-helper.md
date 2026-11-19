# Session log: `claude/data-revalidate-helper`

**Ticket:** #44 (Data, S, T1) · **Lane:** Data · **Tool:** claude · **Started:** 2026-11-19 · **Stacked on:** #120 (`claude/data-reserved-slugs`, on #96), which edits the same admin actions

## Status
Done: #44 helper, test, all admin actions switched. One cross-lane request (Ops). Draft until #96 and #120 merge.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `17:10` **decision** sitemap is refreshed only for entities `src/app/sitemap.ts` actually lists (sermons, events, landing pages, ministries); groups, outreach and announcements aren't in the sitemap, so they don't need it. A test ties `SITEMAP_TABLES` to the tables sitemap.ts reads (T1, opus)
- `17:10` **decision** sermons also refresh `/sermons/series` and every `/sermons/series/[slug]` page (`revalidatePath(pattern, 'page')`): a sermon shows on its series page, and the action only knows the series id (T1, opus)
- `17:10` **decision** home (`/`) for announcements, events, sermons, groups and outreach, as the issue lists; today the home page only queries the first three, so groups and outreach are a cheap safety margin (T1, opus)
- `17:10` **note** slug edits are refused everywhere today ("requires a redirect plan"); the helper still takes `previousSlug` so a future slug change refreshes the old path. `/events/calendar` is a route handler with its own `s-maxage=300` and is not path-revalidated
- `17:10` **change** `src/lib/revalidate.ts` + test (22 tests); 9 admin pages call `revalidateEntity()` (10 call sites), with no direct `revalidatePath` left (a test enforces it). Pre-existing lint warning in `admin/staff/page.tsx:16` (`prefer-const`) left alone: outside this ticket's allowed edits (T1, opus)
- `17:10` **request** lane ops: `docs/06-integrations.md` lines 24–25 and 87. Say that public pages keep `export const revalidate = 60` as the fallback, and that every admin save refreshes the affected pages on demand through `revalidateEntity()` in `src/lib/revalidate.ts`. Drop the "webhook from the admin panel" wording (#44).
