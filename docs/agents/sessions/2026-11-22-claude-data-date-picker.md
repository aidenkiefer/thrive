# Session log: `claude/data-date-picker`

**Assignment:** none (owner ad-hoc QoL request 2026-11-22: "calendar date select") · **Lane:** data · **Tool:** claude · **Started:** 2026-11-22

## Status
Done: QOL-datepicker checkpointed at a7c30f6 (opus-5.5/standard), gate PASS (521 tests).
Open: manual browser click-through of one admin form (QA). Follow-up: #42 uses DatePicker.
Branch claude/data-date-picker; PR via scribe pr.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `--:--` **change** QOL-datepicker: reusable calendar DatePicker landed; 7 fields on 5 admin pages switched; gate PASS (521 tests). (opus-5.5/standard) [a7c30f6]
- `--:--` **change** QOL-datepicker key files: src/components/admin/DatePicker.tsx, src/lib/admin-date.ts, src/lib/admin-date.test.ts, src/app/admin/admin.css, src/app/admin/events/page.tsx, src/app/admin/announcements/page.tsx. (opus-5.5/standard) [a7c30f6]
- `--:--` **decision**: calendar opens INLINE below the field, not a floating popover, because `.admin-ui details` is overflow-hidden and would clip it in existing-item rows. (opus-5.5/standard)
- `--:--` **decision**: picker posts through a hidden input in the exact strings server validators accept (date-only "YYYY-MM-DD"; datetime "YYYY-MM-DDTHH:MM:00±HH:MM" with DST-correct Chicago offset computed as parseInstant checks it). Server validation unchanged and still the source of truth; required-ness enforced server-side (hidden inputs can't use native `required`). (opus-5.5/standard)
- `--:--` **decision**: pure date math in src/lib/admin-date.ts (reuses chicagoWallTime/chicagoOffset from admin-validation); 11 vitest cases incl. both 2026 DST transitions round-tripping through parseInstant and the skipped 2:30 AM spring-forward hour. (opus-5.5/standard)
- `--:--` **change**: fields replaced: announcements expires_at; events start/end_datetime; recurring-events occurrence start/end_datetime; outreach start/end_date; sermons preached_at. Removed the "type ISO with -06:00/-05:00 offset" instructions from labels. (opus-5.5/standard)
- `--:--` **change**: UX: keyboard grid (arrows, Home/End, PageUp/PageDown, Shift+Page = year, Enter, Escape); "Today" uses Chicago date; CST/CDT hint; Clear for optional fields; inline warnings for half-filled date/time and nonexistent spring-forward times; picking a date with no time moves focus to the time input. Styles scoped in src/app/admin/admin.css; reuses AdminIcon calendar/arrow. (opus-5.5/standard)
- `--:--` **note**: verification: server-rendered output checked on a temporary uncommitted preview route (deleted). Stored UTC instants render as 2026-12-05T09:00:00-06:00 (CST) and 2026-07-04T18:30:00-05:00 (CDT), so unedited saves round-trip. (opus-5.5/standard)
- `--:--` **note**: interactive browser check NOT done: local Playwright Chromium lacks libnss3/libnspr4; needs `sudo npx playwright install-deps chromium`. QA should click through one admin form manually. (opus-5.5/standard)
- `--:--` **note**: seconds are dropped on re-save (time input is HH:MM); existing data uses :00 seconds so no change expected. (opus-5.5/standard)
- `--:--` **request**: #42 (series/speaker editors) should use DatePicker for series start/end date. Target lane: data (follow-up, not out-of-lane). (opus-5.5/standard)
- `--:--` **note**: searched issues/PRs first; no existing guidance on a date picker. (opus-5.5/standard)
