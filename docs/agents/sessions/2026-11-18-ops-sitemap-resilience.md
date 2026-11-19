# Session log: `cursor/ops-sitemap-resilience`

**Assignment:** ticket O-sitemap (S) · **Lane:** ops (Cursor agent as stand-in; owner approved) · **Tool:** cursor · **Started:** 2026-11-18

## Status
Code, test and doc row are committed in PR #27. Server behavior verified by the coordinator and senior QA on production builds: non-production without a database serves 200 with 12 static URLs; with `VERCEL_ENV=production` it returns 500 by design.

## Entries
- `22:40` **change**: `src/app/sitemap.ts` now exports `STATIC_ROUTES` (existing 11 routes in original order plus `/get-connected`; no `/feedback`) and `buildStaticEntries(base)`. Database queries and URL shapes moved unchanged into a private `buildDatabaseEntries()`.
- `22:40` **decision**: failure policy is `shouldFallbackToStatic(vercelEnv)`: strict (throw) only when `VERCEL_ENV === 'production'`, otherwise `console.warn` (message only, no data) and return static entries. Why: production crawlers must get an error and retry rather than cache a truncated sitemap; previews and local builds lack Supabase config and a 500 there hides the valid static routes. The try/catch covers `createClient()` throwing, query errors and rejected promises.
- `22:41` **change**: new `src/app/sitemap.test.ts` (9 tests): static routes include `/get-connected` and all previous routes, no duplicates, root-relative, no `/feedback`, `buildStaticEntries` prefixing, `shouldFallbackToStatic` false for `production`, true for `preview`, `development`, `undefined`. Mocks `@/lib/supabase/server`.
- `22:41` **change**: `docs/04-seo-url-migration-map.md` `/get-connected/` row set to `/get-connected`, `same-path`, citing `docs/audit/2026-11/pages/get-connected.md`. No other lines touched.
- `22:42` **note**: Before this PR, `vitest.config.mts` only included `tests/**/*.test.ts`, so it did not discover the colocated test (see Requests).

## Verification
- `./node_modules/.bin/tsc --noEmit`: exit 0.
- `./node_modules/.bin/eslint src/app/sitemap.ts src/app/sitemap.test.ts`: exit 0, no output.
- `./node_modules/.bin/vitest run src/app/sitemap.test.ts` (committed config): "No test files found" (include is `tests/**` only).
- `./node_modules/.bin/vitest run --config /tmp/vitest.sitemap.config.mjs src/app/sitemap.test.ts` (temporary config outside the repo with `include: ['src/**/*.test.ts']`): 1 file, 9 tests passed.

## Not verified
- `GET /sitemap.xml` returning 200 with Supabase env unset in a non-production build, and still failing in `VERCEL_ENV=production` (needs a built server; coordinator to check).
- That Next's build accepts extra named exports (`STATIC_ROUTES`, `buildStaticEntries`, `shouldFallbackToStatic`) from a `sitemap.ts` metadata route file. I believe it does; the gate build will confirm.
- Behavior against a real Supabase database.

## Requests and blockers
- `22:42` **request**: ops/data (config owner): `vitest.config.mts` `include` should add `src/**/*.test.ts` and an `@/` alias if colocated tests are meant to run; otherwise move this test to `tests/` (it imports `@/lib/supabase/server` via mock, which also needs the alias to resolve in some setups). Not edited, out of allowed paths.
- `22:42` **note**: `docs/04` still has `/prayer/`, `/expresso/`, `/volunteering/` as TBD, out of scope here.
- `23:30` **note**: resolved in this PR: `vitest.config.mts` include widened to `['tests/**/*.test.ts','src/**/*.test.ts']` (byte-identical to Ops PR #16), so colocated tests now run. Senior QA verdict: MERGE, no blockers. Not changed: a landing page whose slug equals a static route would produce a duplicate `<loc>` (pre-existing for `about`, `give`, etc.).
