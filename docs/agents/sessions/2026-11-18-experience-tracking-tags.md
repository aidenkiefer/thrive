# Session log: `cursor/experience-tracking-tags`

**Assignment:** `docs/agents/assignments/2026-11-07-release-candidate-2.md` section E1 and decision row 1 · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-18

## Status
E1 implemented in the working tree (not committed). GTM only, production only. Gate not run (coordinator runs it).

## Entries
- `22:38` **decision**: load GTM (`GTM-NQV3Z3N7`) only; do NOT load Ads (`AW-16575196430`) separately. Relied on: `docs/01-current-site-audit.md:18` ("Analytics | Google Tag Manager `GTM-NQV3Z3N7`; Google Ads conversion `AW-16575196430`"), `docs/01-current-site-audit.md:~230-233` ("Google Tag Manager container" / "Google Ads conversion tracking" table, "Add to new site layout"), `docs/06-integrations.md:~146-147` ("Google Tag Manager `GTM-NQV3Z3N7` site-wide"; "Google Ads Conversion `AW-16575196430` — campaigns active"). None show a separate gtag.js loader for Ads. Loading the same conversion both directly and via GTM can double-count conversions.
- `22:39` **change**: added `src/components/analytics/{ids.ts, tracking.ts, Analytics.tsx, tracking.test.ts}`. `ids.ts` holds both IDs with source-doc comments; the Ads ID is exported but intentionally unused for loading. `isTrackingEnabled(vercelEnv)` is true only for `'production'`. `Analytics` renders a `next/script` (`afterInteractive`, id `gtm-bootstrap`) with the standard GTM bootstrap; `AnalyticsNoScript` renders the GTM `noscript` iframe. Both return `null` unless `isTrackingEnabled(process.env.VERCEL_ENV)`. No dependency added; no other env var read.
- `22:40` **change**: `src/app/layout.tsx` renders `<AnalyticsNoScript />` as the first child of `<body>`, then `<Analytics />`, then `SiteShell`. Fonts, metadata and `SiteShell` unchanged.
- `22:41` **note**: `vitest.config.mts` includes only `tests/**/*.test.ts`, so `vitest run src/components/analytics` finds no files with the repo config (contrary to the brief's "discovers colocated tests"). Config is outside my allowed paths; I ran the test with a throwaway config in `/tmp` instead. See Requests.

## Verification
- `./node_modules/.bin/tsc --noEmit`: exit 0.
- `./node_modules/.bin/eslint src/app/layout.tsx src/components/analytics`: exit 0, no output.
- `./node_modules/.bin/vitest run src/components/analytics` (repo config): "No test files found" (include pattern issue above).
- `./node_modules/.bin/vitest run --config /tmp/vitest.e1.config.mts --root . src/components/analytics` (include `src/**/*.test.ts`): 1 file, 7 tests passed.
- Not verified: production build, rendered HTML with `VERCEL_ENV=production` (script and noscript present) vs unset (absent), Preview deployment, that GTM container actually fires or contains the Ads tag, `gate.sh`.

## Open questions for the owner
1. Is the Ads conversion `AW-16575196430` configured inside the GTM container, or did the live site load it with its own gtag.js? Docs do not say. If separate, add `gtag('config','AW-16575196430')` with the gtag loader (and confirm GTM does not also fire it).
2. Consent/cookie notice is not part of this ticket; confirm owner expectation.

## Requests
- `22:41` **request**: ops/data (owner of `vitest.config.mts`): widen `include` to `['tests/**/*.test.ts', 'src/**/*.test.ts']` so colocated tests run under `vitest run`. Until then `src/components/analytics/tracking.test.ts` is not discovered by `npm test` / the gate.
- `23:05` **note**: coordinator verification on production builds, Supabase unset. A normal build (`VERCEL_ENV` unset) served with `VERCEL_ENV` unset or `preview`: no `GTM-NQV3Z3N7`, no `googletagmanager` on `/` or `/plan-a-visit`. A build made with `VERCEL_ENV=production`: GTM loader, container ID and the `<noscript><iframe>` (the first thing the layout renders in `<body>`; Next puts its own empty hidden div ahead of it) present; no `AW-16575196430` anywhere. Important: statically prerendered pages bake the decision in at build time, so a tag is controlled by the `VERCEL_ENV` of the build (Vercel sets it per deployment: `production` for the production deployment, `preview` for previews), not by runtime env changes.
- `23:05` **note**: `tracking.test.ts` is only discovered once `vitest.config.mts` includes `src/**/*.test.ts` (same change is in Ops PR #27 and #16). The 7 tests pass under that config (57 total under that widened config; the gate on this branch alone runs 50). Until #27 or #16 merges, the gate does not run them.
- `23:30` **note**: independent senior QA: MERGE. No blockers. Owner questions remain: is the Ads tag inside the GTM container, and is a cookie/consent notice wanted. Ship by merging to `main` (static pages bake the tag in from the build's `VERCEL_ENV`; promoting a preview build would not add it).
