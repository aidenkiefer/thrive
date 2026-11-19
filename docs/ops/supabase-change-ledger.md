# Supabase change ledger

Append-only record of every write to the live Supabase project (see [supabase-live-project.md](supabase-live-project.md)). One row per change. No emails, tokens or keys.

| Date | Executor | Artifact (file at commit, or SQL batch) | Owner "go" (issue comment) | Version recorded by Supabase | Verification (query and result) |
|---|---|---|---|---|---|
| before 2026-11-19 | owner | `supabase/migrations/20261107000000_mvp_foundation.sql`, `20261107010000_ministry_schedule_forms.sql`, `20261107020000_contact_column_privacy.sql` | n/a (pre-ledger) | `20261107000000`, `20261107010000`, `20261107020000` | `list_migrations` shows all three; RLS on for 12 tables; advisors clean (2026-11-19 audit) |
| before 2026-11-19 | owner (legacy script) | older content import plus hand-written rows via `scripts/seed-from-parsed.ts` (June 2026) | n/a (pre-ledger) | n/a (data) | counts in the baseline table of `supabase-live-project.md` |
