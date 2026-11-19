# Session log: `cursor/experience-og-image`

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-19

## Status
E3 #38 done. Gate PASS. Awaiting independent QA.

## Entries
- **change** #38: New `src/app/(public)/og/route.tsx` GET handler using `next/og` ImageResponse (no new dependency, no remote fonts or images; default bundled font). Output 1200x630 PNG. (S, T1) [593fb68]
- **decision** #38: Brand colors hard-coded as constants from `tailwind.config.ts` tokens `brand.900` (#0f2838 background), `accent.400` (#c9828a tagline and left bar), `neutral.0` white. The issue said the tokens are in `globals.css`; they actually live in `tailwind.config.ts`. (T1)
- **decision** #38: Text is only `SITE.shortName` and `SITE.tagline` from `src/components/content/site-info.ts`, plus optional `?title=` (control characters stripped, whitespace collapsed, max 80 characters with an ellipsis, rendered as plain text through JSX, unknown params ignored). Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800. (T1)
- **decision** #38: The route-group path `src/app/(public)/og/route.tsx` was accepted by the production build (route listed as dynamic `/og`); the `src/app/og/route.tsx` fallback was not needed and no PM note is required. Named route wins over `[slug]`: `/og` returns 200, `/nope` returns 404. (T1)
- **change** #38: First version clipped an unbroken long word; fixed with wordBreak and a smaller font so a long unbroken word wraps instead of clipping, before the PR. Dropped unused eslint directive in `/og`. (T1) [98759fd]
- **note** #38: Verification on a production build (`next start`) with curl and viewing the PNGs: `/og`, `/og?title=Sunday%20Message`, a script-tag plus 200-character title with `&evil=1`, and a control-characters-only title all returned 200 image/png 1200x630 with the Cache-Control header. (T1)
- **note** #38: Control-characters-only title rendered identically to no title; the script-tag title rendered as literal text and the 200-char unbroken string wrapped and ended with an ellipsis; a long multi-word title wrapped to 3 lines. (T1)
- **note** #38: Not tested: how social platforms render the card (needs the public domain; #43 wires the metadata); non-Latin glyph coverage of the bundled font; abuse of unlimited `?title=` cache keys (title length is capped, edge cache is the control). No logo, photo, date, or contact detail; no `loading.tsx`. Hard-constraint checklist all satisfied/N-A. (T1)
- **change** #38 checkpoint: done, gate PASS (typecheck, 91 tests, lint 0 errors / 4 pre-existing warnings, production build). `git diff --shortstat origin/main...HEAD`: 1 file, 88 insertions (`src/app/(public)/og/route.tsx`). Adding this session log makes 2 files. (T1) [593fb68] [98759fd]
