# Session log: `claude/data-reserved-slugs`

**Ticket:** #40 (Data, S, T1) · **Lane:** Data · **Tool:** claude · **Started:** 2026-11-19 · **Stacked on:** #96 (`claude/data-cms-r2b`, which edits the admin landing-pages page)

## Status
Done: #40 shared list, helper, admin wiring, drift test. Two cross-lane requests open (Experience, Ops). Draft until #96 merges.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `16:50` **decision** stacked on #96, not main: #96 changes `src/app/admin/landing-pages/page.tsx` (the ticket's dependency note) (T1, opus)
- `16:50` **decision** list = union of the two old lists + `api` + every fixed top-level route folder: `events` (`src/app/events/calendar`) and `og` (`(public)/og` on main since #38). Dynamic, private and parallel folders are skipped (T1, opus)
- `16:50` **change** `src/lib/reserved-slugs.ts` + test (4 tests; dropping `events` fails 2); admin form uses `isReservedSlug()` with its own message, "/<slug> is already a page on the site" (T1, opus)
- `16:50` **request** lane experience: `src/app/[slug]/page.tsx` should replace its local `RESERVED` set (line 8) with `import { isReservedSlug } from '@/lib/reserved-slugs'` and `if (isReservedSlug(slug)) return null`, because the shared list adds `api` and `og`, and the two lists must not drift again (#40). Apply after #40's PR merges.
- `16:50` **request** lane ops: `docs/05-content-models.md` "Admin Warning: Reserved Slugs" (line 312) should list the same 14 slugs as `src/lib/reserved-slugs.ts` (adds `feedback`, `get-connected`, `api`, `og`) and name that file as the source of truth (#40).
