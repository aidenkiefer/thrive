# Session log: `cursor/experience-feedback-wiring`

**Assignment:** `docs/agents/assignments/2026-11-18-development-kickoff.md` (E1 follow-up) · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-18

## Status
Footer and slug wiring for the feedback form done; branch stacked on `cursor/experience-mvp-feedback` (PR #17). Footer service rows now read `SERVICE_TIMES`.

## Entries
- `21:20` **change** E1-wiring: Footer Connect list links to `/feedback`; `feedback` added to `RESERVED` in `src/app/[slug]/page.tsx`. Resolves the two experience-lane requests logged in the #17 session log. (T1)
- `21:22` **change**: Footer "Sunday Services" rows were hardcoded, including "paused for renovations" for Express(o). They now map over `SERVICE_TIMES` from `src/lib/constants/service-times.ts`, so the owner-confirmed schedule from Data PR #12 (D4) reaches the footer with no further edit. (T1)
- `21:22` **note**: the #12 session log named `ServiceTimesSection.tsx` as the only consumer of `SERVICE_TIMES`. The footer was a second, hardcoded copy; it is fixed here.
- `21:23` **request**: data lane needs `/feedback` link in the admin layout nav (admin chrome is data-owned). Blocked on the identity and form stack in PR #15.
- `21:23` **note**: the footer pause suffix is derived from `pauseNote` text. Before #12 merges the footer shows the current paused state; after #12 it shows no suffix. Static address line under the service rows is unchanged and still hardcoded.
