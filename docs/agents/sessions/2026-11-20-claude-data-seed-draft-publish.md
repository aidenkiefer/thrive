# Session log: `claude/data-seed-draft-publish`

**Assignment:** none (ticket given in chat; follow-up named in `supabase/migrations/20261120000000_system_actors.sql`) · **Lane:** data · **Tool:** claude · **Started:** 2026-11-20

## Status
Done: checkpoint 11586a3 gated and verified; PR body written. Live database not touched.
Parked: #53 activity log (separate schema change, not started). Ops docs request open.

## Entries
- `14:12` **init**: session log created from template; branch from main a029e25 (after #133 merged). (claude) 
- `14:12` **change** #94 follow-up: seed SQL publishes as seed actor, checkpoint. Gate PASS (3 pre-existing lint warnings); src/lib/seed tests 54/54; scratch PGlite e2e 9/9: fresh schema.sql + generated SQL publishes 22 series / 120 sermons / 25 recurring / 55 one-time, one seed-actor publish event each; sermons keep export publish times 120/120; re-run adds no events; staff-unpublished row stays unpublished on re-run; old 2026-11-19-seed.sql refused P0001 by INSERT guard; new file refuses without active seed actor. (T2 / claude-opus-5-5) [11586a3]
- `14:12` **decision**: src/lib/seed/sql.ts upserts drafts (published_at never inserted/updated for publishable tables), then `cms_set_published(type, id, true, seed actor, original time)` per dated row. Rows with any publication_events row are skipped so a re-run never overrides a staff unpublish (before #94 such a re-run was refused by UPDATE guard; a silent republish would be worse). Preconditions block refuses without active seed actor. (T2 / claude-opus-5-5) [11586a3]
- `14:12` **decision**: generated file moved to supabase/ops/2026-11-20-seed.sql (SEED_SQL). Applied 2026-11-19-seed.sql kept unchanged as ledger artifact; it now fails safe (P0001, rolls back). (T2 / claude-opus-5-5) [11586a3]
- `14:12` **decision**: scripts/seed-from-parsed.ts deleted, not converted, per docs/plans/owner-decisions.md ("must not be run; delete it in #39 or #30"). Converting would publish its hand-written placeholder rows dated now(). Nothing imported it; npm run seed runs seed-current.ts. (T2 / claude-opus-5-5) [11586a3]
- `14:12` **note**: seed-current.ts now only imports the shared PUBLISH_AS map. Its republish behaviour is unchanged because its approved dry-run fingerprint shows any published_at update before a write. (T2 / claude-opus-5-5) [11586a3]
- `14:12` **request** ops (docs): docs/ops/seeding-preview.md and docs/ops/supabase-live-project.md still name scripts/seed-from-parsed.ts and/or supabase/ops/2026-11-19-seed.sql as current. Point them at 2026-11-20-seed.sql and note the legacy script is deleted. Historical docs (ledger, reconciliation report, tickets/03) need no change.
- `14:12` **note**: #53 activity log deliberately not started (separate schema change). Live database not touched.
