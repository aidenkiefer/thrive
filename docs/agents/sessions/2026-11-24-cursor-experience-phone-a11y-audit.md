# Session log: `cursor/experience-phone-a11y-audit-d32a`

**Assignment:** launch-critical phone + accessibility audit (#47, #61), after #160 · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-24

## Status
Audit done at 360/390/1280px on every public route (tablet 1024–1279px deferred by owner). Five bounded fixes. axe: 13 serious contrast nodes → 0. Gate PASS. Not merged.

## Method
Production build (`next start`, no `.env`, so DB-backed lists show empty states and detail slugs 404). Playwright 1.49 + axe-core 4.x installed in a scratch dir outside the repo (no `package.json` change). axe tags: wcag2a/aa, wcag21a/aa, wcag22aa, best-practice. Per run: HTTP status, `scrollWidth` vs `innerWidth`, elements past the viewport edge, interactive targets under 24px, heading-level skips, full-page screenshot. `prefers-reduced-motion: reduce` was emulated for the layout/axe runs.

## Route × width results (after fixes)
Cell = status, scrollWidth/innerWidth, axe violation nodes before→after. Overflowing elements, heading skips: none on any row.

| Route | 360 | 390 | 1280 |
|---|---|---|---|
| `/` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 0→0 |
| `/plan-a-visit` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 0→0 |
| `/sermons` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/sermons/series` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/events` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/groups` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/kids-youth` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/outreach` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/about` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/about/team` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/give` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 0→0 |
| `/get-connected` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 1→0 |
| `/feedback` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 0→0 |
| `/thrive-flames` | 200, 360/360, 0→0 | 200, 390/390, 0→0 | 200, 1280/1280, 0→0 |
| `/sermons/<missing>` (404) | 404, 360/360, 0→0 | 404, 390/390, 0→0 | 404, 1280/1280, 1→0 |
| `/events/<missing>` (404) | 404, 360/360, 0→0 | 404, 390/390, 0→0 | 404, 1280/1280, 1→0 |
| `/<unknown>` (404) | 404, 360/360, 0→0 | 404, 390/390, 0→0 | 404, 1280/1280, 0→0 |

Mobile menu open on `/about` at 390px: axe on `<header>` 0 violations.

## Manual checks (360, 390, 1280)
- **Skip link:** first Tab stop at every width, visible on focus (16,16 185×42), Enter moves focus to `main#main-content`.
- **Tab order:** skip → logo → (desktop nav links | theme toggle + menu button) → Give → Plan a Visit → page content → footer. Logical at all widths.
- **Focus ring:** every tab stop in the first 25 has a visible outline/ring except the Google Maps iframe (see deferred).
- **Mobile menu (360/390):** opens with `aria-expanded=true`, focuses first link, `aria-current="page"` on the current section, body scroll locked, no overflow; Escape closes and returns focus to the toggle; tapping a link navigates, closes the menu and releases the scroll lock.
- **Forms (`/feedback`):** every field has a `<label>`/`<legend>`; help text via `aria-describedby`; errors are `role="alert"` and linked via `aria-describedby` + `aria-invalid`. Newsletter input passes axe `label`.
- **Iframes:** map iframes titled on `/`, `/plan-a-visit`, `/about`, `/get-connected`.
- **Contrast:** footer `text-white/70` and badges pass axe; the only failure was the active nav link (fixed).
- **Reduced motion:** with `reduce`, 0 running animations/scroll timelines and 0 visible-but-opacity-0 elements on `/`; with `no-preference`, 31 animated elements (hero settle/parallax/fade, reveals), so the gate works.

## Entries
- `21:05` **change** Active nav link `text-accent-400` (#c9828a on #183d59 = 3.8:1, axe serious on 11 routes at 1280) → `text-accent-300` (5.3:1), desktop + mobile. Same swap for dark-surface text that used accent-400: `.prose-invert-content` links, `ContactDetails` pause note and link hover, `LatestSermonSection` link hover. Underline/icons stay accent-400 (non-text 3:1 OK). (T1) `src/components/layout/GlobalNav.tsx`, `src/app/globals.css`, `src/app/(public)/about/ContactDetails.tsx`, `src/components/home/LatestSermonSection.tsx`
- `21:06` **change** Footer "Get directions" was a 92×20 target; now `inline-flex min-h-11` (92×44). (T1) `src/components/layout/Footer.tsx`
- `21:08` **change** Feedback form: the submit button disables while sending, so keyboard focus fell to `<body>` after every submit. Focus now moves to the first invalid field (the category radio or `aria-invalid` field), or to the submit button for sent/unavailable/network results. (T1) `src/components/forms/FeedbackForm.tsx`
- `21:10` **note** Deferred: (1) Google Maps iframe shows no ring on our side, because Tab moves focus into the cross-origin frame and neither `:focus` nor `:focus-within` matches on the host page; Google's own UI shows the focus inside. Leave as is. (2) Lighthouse a11y scores not recorded; reuse Ops #66 CI reports. (3) Populated states (sermon/event/group/outreach detail, SermonPlayer, signup panels) need a recheck with Preview data. (4) Admin routes are Data-owned; not audited here. (5) `/feedback` radios are 16px but the wrapping `<label>` is the hit area. (T1)
- `21:10` **note** Scope guard: no `public/images/**`, `photos.ts`, Data or Ops files touched. (T1)
