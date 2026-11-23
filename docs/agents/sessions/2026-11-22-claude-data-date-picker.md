# Session log: `claude/data-date-picker`

**Assignment:** none (owner ad-hoc QoL request 2026-11-22: "calendar date select") · **Lane:** data · **Tool:** claude · **Started:** 2026-11-22

## Status
Done: QOL-datepicker at a7c30f6; QOL-datepicker-shared at f3474d3 (opus-5.5/standard), gate PASS (typecheck, lint, build; vitest 528/528).
Open: manual browser click-through of one admin form (QA); interactive browser check not done. Requests: #76/#78 use DatePicker popover.
Branch claude/data-date-picker; PR #147 body regenerated via scribe pr.

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
- `--:--` **change** QOL-datepicker-shared: DatePicker refactored into a shared admin+public UI primitive for the upcoming event/sermon sort and filter work; gate PASS (typecheck, lint, build; vitest 528/528). (opus-5.5/standard) [f3474d3]
- `--:--` **change** QOL-datepicker-shared key files: src/components/ui/DatePicker.tsx, src/components/ui/index.ts, src/lib/calendar-date.ts, src/lib/church-time.ts, src/lib/admin-validation.ts, src/app/admin/admin.css. (opus-5.5/standard) [f3474d3]
- `--:--` **decision** (owner-approved cross-lane, 2026-11-22): owner said the date picker is needed on both user and admin sides for event and sermon sorting/filtering. DatePicker moved from src/components/admin/DatePicker.tsx to src/components/ui/DatePicker.tsx (Experience lane); one appended export line in src/components/ui/index.ts. No other Experience files touched. (opus-5.5/standard) [f3474d3]
- `--:--` **change**: DatePicker styles itself with Tailwind to match ui/Input, with inline SVG icons (no AdminIcon dependency). admin.css date rules removed except `.admin-ui [data-date-picker='trigger']`, which matches the trigger to admin inputs. (opus-5.5/standard) [f3474d3]
- `--:--` **change**: new props: `value`+`onChange` (controlled); `min`/`max` (inclusive YYYY-MM-DD, out-of-range days aria-disabled, keyboard focus clamped); `placement` "inline" (default) or "popover"; `hideLabel`; `disabled`; `placeholder`; `name` optional (hidden input posts value, so GET filter forms work). (opus-5.5/standard) [f3474d3]
- `--:--` **change**: Chicago clock helpers moved to src/lib/church-time.ts and re-exported from admin-validation.ts (imports unchanged), so public code never imports an admin module. src/lib/admin-date.ts renamed to src/lib/calendar-date.ts (parseFormValue, serializeValue, isInRange, clampDate, monthEdges); 18 tests in calendar-date.test.ts. (opus-5.5/standard) [f3474d3]
- `--:--` **note**: verification on a temporary uncommitted public preview route (deleted): GET param prefilled the hidden input (?from=2026-11-15); UTC 2026-11-23T03:00Z rendered as Chicago 2026-11-22; controlled client filter rendered its state; hideLabel rendered sr-only. (opus-5.5/standard)
- `--:--` **note**: interactive browser check still not done (local Chromium missing libnss3/libnspr4). QA should click through one admin form and confirm the trigger matches the admin inputs. (opus-5.5/standard)
- `--:--` **request** (target lane: experience): when building #76 sermon filters or #78 events month view, use `DatePicker` from '@/components/ui' with placement="popover"; optionally document it in docs/07-design-system.md. (opus-5.5/standard)
