# Session log: `cursor/experience-structured-data`

**Assignment:** owner request 2026-11-18, ticket E-seo (schema.org JSON-LD) · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-18

## Status
Implemented and verified by typecheck, lint and unit tests. Not committed (coordinator commits). Not verified in a browser or by Google Rich Results.

## Entries
- `22:41` **change**: `src/components/seo/` added: `serialize.ts` (`serializeJsonLd`, escapes every `<` as `\u003c`), `JsonLd.tsx` (server component, `application/ld+json` via `dangerouslySetInnerHTML`), `church.ts` (`buildChurchJsonLd`, `SITE_URL`), `event.ts` (`buildEventJsonLd`), plus `church.test.ts`, `event.test.ts`, `serialize.test.ts`.
- `22:42` **change**: `src/app/page.tsx` renders the Church JSON-LD (homepage only). `src/app/(public)/events/[slug]/page.tsx` renders the Event JSON-LD after the `if (!event) notFound()` guard, using the record already fetched by `loadEvent`. No new queries; notFound behaviour unchanged.
- `22:42` **decision**: church JSON-LD contains only `SITE` values (name, tagline as `description`, phone, email, address fields, social URLs, maps URL) and the production base URL. No logo, image, hours or founding date: none are audited.
- `22:42` **decision**: `serializeJsonLd` lives in `serialize.ts`, not `JsonLd.tsx`. Why: Vitest in this tree has no JSX transform, so a test importing the `.tsx` file fails to parse. The component itself is a three-line wrapper around the tested function.
- `22:42` **decision**: recurring events have no start of their own, so `startDate`/`endDate` use the next non-cancelled occurrence the page already fetches. If there is none, the builder returns null and no JSON-LD renders.
- `22:42` **decision**: `location` is a `Place` whose `name` is `venue` and `location` joined with ", " (mirrors how `EventDetail` shows them), omitted when both are empty. No `address` is guessed and the church address is never used as a default.
- `22:42` **decision**: `endDate` is also dropped when it is before the start (not just when unparseable). `description` prefers `short_summary`, then `description`. `image` only for http(s) URLs.
- `22:42` **decision**: `organizer.url` is the site base URL (`SITE_URL`), not the event URL. `url` for the event is `https://thrivevineyard.com/events/<slug>` (same as the page's canonical path).

## Verification
Run from the worktree:
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 0.
- `./node_modules/.bin/eslint src/components/seo src/app/page.tsx "src/app/(public)/events/[slug]/page.tsx"`: exit 0, no output.
- `./node_modules/.bin/vitest run src/components/seo`: **exit 1, "No test files found"**, because `vitest.config.mts` only includes `tests/**/*.test.ts` (the brief assumed colocated discovery). Ran instead with a throwaway config outside the repo (`/tmp/vitest-seo.config.mjs`, include `src/components/seo/**/*.test.ts`): 3 files, 11 tests passed.

## Not verified
- Rendering in a browser / the actual `<script>` in served HTML (did not run the dev server or a build, per brief).
- Google Rich Results Test / Schema Markup Validator: needs a public URL.
- Event JSON-LD against a real Supabase record (no database configured); builder tested with plain-object fixtures only.
- That `SITE.tagline` is acceptable as the Church `description` (it is an audited tagline, but a tagline is not a full description).

## Open questions for the owner
- Is `location` vs `venue` semantics right? `venue` is not in the base `schema.sql` create table (added by an `alter table` at line ~327) and `location` may hold either a place name or an address. I joined both into one `Place.name` rather than guess which is the street address.
- Should recurring events with no upcoming occurrence emit nothing (current behaviour), or should they emit a different schema type?
- Is the YouTube/Facebook/Instagram list in `sameAs` final (they come from the shipped footer, not the audit)?

## Requests and blockers
- `22:43` **request**: ops: `vitest.config.mts` `include` is `['tests/**/*.test.ts']` only. Add `'src/**/*.test.ts'` so colocated tests run in `npm test`/CI (otherwise `src/components/seo/*.test.ts` are never run by the gate).
- `22:43` **note**: `src/app/layout.tsx` not touched (another agent). `SITE_URL` is duplicated from `metadataBase` there; consolidate if layout exports a constant later.
