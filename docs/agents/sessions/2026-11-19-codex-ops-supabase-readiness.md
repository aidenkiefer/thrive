# Session log: `codex/ops-supabase-readiness`

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Lane:** ops · **Tool:** codex · **Started:** 2026-11-19

## Status

#70 audit complete. Readiness and backup/restore documentation is in progress. Restore drill UNRUN pending owner inputs and authorization.

## Entries

- `14:06` **note** #70: Sized M. Planned a read-only metadata, advisor, migration, and privacy audit followed by an owner backup/restore checklist.
- `14:06` **decision** #70: Apply the current shared-project Preview policy. The issue's separate database instruction is stale.
- `14:06` **note** #70: Supabase MCP confirmed 12 public tables with RLS and three baseline migrations. Counts matched baseline, including 104 sermons, 20 series, 46 one-time events, and 18 recurring events.
- `14:06` **note** #70: Security and health advisors returned no findings. Performance advisors flagged two foreign keys without covering indexes and three unused indexes. No storage buckets were configured.
- `14:06` **note** #70: Column privilege checks returned false for anon and authenticated on all three sensitive columns. The audit read no personal values and made no live writes.
- `14:06` **request** #70: Data to evaluate covering indexes for sermons_series_id_fkey and sermons_speaker_id_fkey. Data and QA to review the three unused-index findings.
- `14:06` **blocker** #70: Owner to confirm plan tier, usable backup and recovery point, restore access, RPO/RTO, and an approved disposable restore target. Verify backup usability before changes and preserve production.
- `14:06` **note** #70: Drafting supabase-readiness.md and backup-restore-drill.md. The owner has not authorized a restore, and the drill remains UNRUN.
