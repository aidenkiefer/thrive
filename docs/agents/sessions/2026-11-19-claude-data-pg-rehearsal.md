# Session log: `claude/data-pg-rehearsal`

**Assignment:** `docs/plans/batches.md` (Batch 3, Data: #60) · **Lane:** data · **Tool:** claude · **Started:** 2026-11-19

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
Done, pending senior QA review. #60 checkpointed at f20cec1: 573/573 checks on PostgreSQL 17.11; gate --quick PASS.
Not proven: hosted Supabase roles/ownership, PostgREST exposure, PG 15 projects, pooler.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `01:50` **change** #60: scripts/pg-rehearsal/ standalone package (embedded-postgres 17.11.0-beta.19, pg 8.23.1); 573/573 checks on PostgreSQL 17.11 incl. 50-connection concurrent take_rate_limit (exactly 3 of 5 new-subject trials allowed at limit 3); mutation variants fail. supabase/README.md section added. Run: `cd scripts/pg-rehearsal && npm ci && node rehearse-pg.mjs ../..` (~17s). Key files: scripts/pg-rehearsal/rehearse-pg.mjs, scripts/pg-rehearsal/package.json, scripts/pg-rehearsal/package-lock.json, supabase/README.md (sonnet subagent, verified by Opus re-run) [f20cec1]
- `01:50` **note**: session end. #60 done, pending senior QA review. Gate --quick PASS. (claude)
