# Sermon title HTML entities session — 2026-11-24

- Agent: Claude (Opus 5.5) · Lane: Data · Branch: `claude/data-sermon-title-entities`, based on `origin/main` at `1d8b93b`.
- Goal: for the Nov 25 MVP demo, stop literal WordPress-import entities (`&amp;`, `&#039;`, `&quot;`, `&#8217;`) from showing in public sermon and series text. Fix at read time only. Stored data is unchanged.
- No live database access: no dev server, seed, migration, supabase or psql. Verified with unit tests and the production build only.

## Changes

- `src/lib/text/decode-entities.ts` (new): pure `decodeHtmlEntities(value: string | null)`. Decodes a fixed named-entity table (amp, lt, gt, quot, apos, nbsp, single and double curly quotes, ndash, mdash, hellip, plus bull, middot, copy, reg, trade) and decimal and hex numeric references. Runs as one regex pass, so it decodes exactly once (`&amp;amp;` becomes `&amp;`). Unknown names, wrong case (`&AMP;`), missing semicolons, NUL, surrogates and out-of-range code points stay as they are. Returns plain text; React escapes it. No new dependency.
- `src/lib/queries/sermons.ts`: `decodeSermon` and `decodeSeries` decode `title`, `description`, `seo_title` and `seo_description` on sermons, the nested series, and `getSermonSeries` rows. They apply to `getLatestSermon`, `getSermons`, `getSermonBySlug`, `getSermonSeries` and `getSermonsBySeriesSlug`. Signatures and return types are unchanged. Speaker fields are out of scope and not touched.
- Checked with a grep: every public sermon and series read goes through `sermons.ts`. `sitemap.ts` reads only slugs. Admin reads use a separate path and keep the stored raw value.

## Verification

- `npx vitest run src/lib/text src/lib/queries`: 2 files, 15 tests passed. The helper tests cover each entity class, double encoding, null, clean text, and unknown or malformed entities. The query tests mock `../supabase/server` with a chainable fake builder and use synthetic fixtures. They cover all five query functions, a null series, and the error path.
- `scripts/agents/gate.sh`: GATE: PASS. Files changed vs origin/main: the 4 `src/lib/{text,queries}` files above, plus this log.

## Notes and follow-ups

- Owner decision: an optional one-time data cleanup that rewrites the ~25 sermon titles and 1 series in the database, so the admin editor also shows clean text. Not done here. If approved, it belongs to a separate Data ticket with a reviewed SQL script. The read-time decode is safe to keep after a cleanup because clean text passes through unchanged.
- No files from #168 (`src/components/**`) or #169 (`src/app/**`) were touched.
- Session end: done, PR opened for senior QA, not merged.
