# Session log: `claude/data-system-actors`

**Assignment:** `docs/agents/assignments/2026-11-20-after-data-merge.md` · **Lane:** data · **Tool:** claude · **Started:** 2026-11-20

## Status
Done: system actors + published_at INSERT guard (#94) implemented and verified; not applied to live DB.
Next: PR for senior QA; data follow-up on seed scripts before migration is applied.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `13:38` **change** #94: system actors + INSERT guard done. Files: `supabase/migrations/20261120000000_system_actors.sql`, `supabase/schema.sql`, `src/lib/admin-identities.ts`, `scripts/seed-current.ts`. Commits 365460e, 8487fc0. Gate PASS; PGlite cms-rehearse 528/528; embedded rehearse-pg 689/689. Mutation checks (INSERT guard off, system-only backdate off, kind filter off) all caught. (T2/claude-opus-5-5)
- `13:38` **decision**: seed needs WordPress publish times, but `cms_set_published` stamps now(). Added 5-arg `cms_set_published(..., p_published_at timestamptz)`: non-null only for kind='system', publish only, not future. 4-arg staff form delegates (same signature/grants), so one publish path.
- `13:38` **decision**: owner approved in chat editing two files outside the assignment's listed paths: `src/lib/admin-auth.test.ts` (mock chains `.eq`; new test that a system row never resolves) and `scripts/pg-rehearsal/rehearse-pg.mjs` (counts kind='staff'; system actor checks incl. 2 concurrent seed publishes -> 1 event). Flagged for QA.
- `13:38` **request** (lane: data): follow-up. `scripts/seed-from-parsed.ts` and `src/lib/seed/sql.ts` (generated SQL seed) still insert published_at and will be refused once migration 20261120000000 is applied. They need draft-then-publish as the seed actor before apply.
- `13:38` **note**: deploy order: apply `supabase/migrations/20261120000000_system_actors.sql` BEFORE deploying this code. Staff lookup filters kind; without the column it fails closed (nobody can sign in). Not applied to live DB. No system actor sign-in path.
