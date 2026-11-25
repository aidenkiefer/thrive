# Session log: `claude/data-admin-demo-preview`

**Assignment:** owner prompt (headless), admin demo path for the MVP demo on Wed 2026-11-25 · **Lane:** data · **Tool:** claude · **Started:** 2026-11-24

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
Done: staff-only draft preview for announcements and events, Preview links in both admin lists, and a preview link right after a create. GATE: PASS.
PR open against main, not merged; awaiting senior QA. Nothing parked or blocked.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `21:55` **change**: `saveWithFeedback` may now return the saved id; on a successful "new" save the redirect adds `?created=<uuid>`. `readFeedback` accepts it only for `saved=new`, no error, and a well-formed UUID. Existing callers return void and behave as before. `FormFeedback` takes an optional `previewHref` and shows "Preview it as the public will see it" after "Saved.". (opus-5.5) [3c33447]
  Key files: `src/lib/admin-form.ts`, `src/lib/admin-form.test.ts`, `src/app/admin/_components/form-feedback.tsx`.
- `21:57` **change**: new routes `/admin/preview/announcement/[id]` and `/admin/preview/event/[id]` (under `/admin/**`, so middleware protects them; middleware/auth unchanged). Each page calls `requireAdmin()` first, then a loader in `preview-data.ts` that goes through `adminDb()`, rejects non-UUID ids with `notFound()` (only after auth), reads with `maybeSingle()`, calls `notFound()` when nothing comes back, and throws on DB errors. Pages are `force-dynamic` with `robots: noindex, nofollow`. (opus-5.5) [46ccf1b, c50d06e]
  Rendering reuses the public components by import only: `FeaturedAnnouncement` (homepage) and `PageHero` + `Band` + `EventDetail` (mirrors `src/app/(public)/events/[slug]/page.tsx`). A dashed `PreviewBanner` says "Preview — not published" (or "this is published" plus a "View live page" link) and links back to the editor at `#form-<id>`.
- `21:57` **decision**: the banner shows visibility notes taken from the real public query rules, so the demo doesn't fall into "published but nowhere to be seen": announcements with "Feature on homepage" off or already expired never show on the homepage (`getFeaturedAnnouncement`), only the newest featured one shows, and events whose `start_datetime` has passed drop out of upcoming lists (`src/lib/queries/events.ts` filters `start_datetime > now`).
- `21:58` **change**: "Preview" link beside each item's summary in `/admin/announcements` and `/admin/events`; the save actions now return the id from `saveWithPublication` so a create links to its preview. (opus-5.5) [612a802]
- `22:00` **note**: `src/lib/security/admin-guard.test.ts` statically requires each admin page body to call `requireAdmin()`/`adminDb()` itself; a guard inside the loader isn't seen. Added explicit `await requireAdmin()` to both preview pages. [c50d06e]
- `22:02` **note**: verified with unit tests and `npm run build` only. No dev server, no form submits, no seed, no Supabase or Vercel CLI, no live DB access.
- `22:02` **note**: no cross-lane requests. The public components were reused without changes.
- `22:02` **note**: "Back to the editor" depends on the browser opening the closed `<details>` that holds `#form-<id>` when it follows the fragment (current Chrome/Edge/Firefox/Safari do). If one doesn't, the editor list is still one click away. Worth a glance during the demo dry run.
