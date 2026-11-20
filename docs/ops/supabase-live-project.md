# The live Supabase project: rules and baseline

**Decision (owner, 2026-11-19, #54):** there is no separate Preview database. The existing production Supabase project is used for verification until launch. The public still sees WordPress until cutover, but this database is real: treat every write as irreversible.

**Current state (2026-11-20):** `scripts/seed-sql.ts` generates `supabase/ops/2026-11-20-seed.sql`, which has not been applied to the live project. `scripts/seed-from-parsed.ts` has been deleted. The November 19 baseline below is a historical snapshot; its references to the old script remain accurate for that audit.

The Supabase MCP server is connected in Claude Code, Cursor and Codex. It is **project-wide and can do anything** the connected account can (apply migrations, run DML/DDL, create or delete branches, deploy functions). These rules apply to every agent and every session.

## Rules

1. **Read-only by default.** Allowed without asking: `list_tables`, `list_migrations`, `list_extensions`, `get_advisors`, `get_project_url`, `search_docs`, `generate_typescript_types`, and `execute_sql` containing only `SELECT`. Look at counts, shapes and metadata, not at people's data.
2. **Never read or copy personal data.** Do not select from `auth.users`, `admin_staff_accounts.email`, or form submissions. Do not put emails, tokens, or keys into git, PRs, issues or logs. Do not use `query_logs` for anything that could contain request bodies. `get_publishable_keys` is public data but still stays out of git. Agents never hold the service-role key.
3. **Writes need all four, in this order:**
   1. The owner's **"go" comment on the relevant issue**, naming the exact artifact (a migration file at a commit, or the SQL batch) and what it changes. A general "go ahead" in chat is not enough; an agent that is unsure asks.
   2. The owner's **backup confirmation** for this change (what recovery the plan offers, and that a backup or recovery point exists now). Agents cannot verify this.
   3. **One executor:** the Data lane (Claude Code) only. Ops and Experience agents never write.
   4. A row appended to [`supabase-change-ledger.md`](supabase-change-ledger.md) in the same PR or the next docs PR: date, executor, artifact, version recorded by Supabase, verification query and result.
4. **Repo equals database.** Schema changes are committed as `supabase/migrations/*.sql` and `supabase/schema.sql` first, QA-reviewed, then applied with `apply_migration` using the same SQL. No ad hoc DDL through `execute_sql`. Record the version Supabase assigns (it may differ from the filename timestamp) in the ledger.
5. **Order matters** for the CMS pair (see `docs/agents/qa/2026-11-19-delta-data-stack.md`): `20261119000000` before #90's code is deployed; `20261119010000` only after #96's code is live. Migrations in the Data stack chain are additive and idempotent, but apply them only after the QA verdict says MERGE or for a Preview-candidate rehearsal the owner approved.
6. **Never:** create or delete development branches (they cost money), deploy or edit Edge Functions, change Auth settings, create auth users, change RLS/policies outside a reviewed migration, run `TRUNCATE`/`DELETE`/`DROP`, or touch rows that staff edited. The owner configures Auth and enrolls staff.
7. **Seed only under rule 3.** The current `2026-11-20-seed.sql` artifact is generated but not applied live. Before any seed, verify prerequisites, protect staff-edited rows, coordinate one executor, and record the result in the ledger. The `published_at` guard (#96) prevents the earlier script path from overwriting rows staff changed.

## Baseline: read-only audit, 2026-11-19

Collected through the MCP with list and `SELECT count(*)` queries only.

**Applied migrations:** `20261107000000 mvp_foundation`, `20261107010000 ministry_schedule_forms`, `20261107020000 contact_column_privacy`. Not applied: everything from the Data stack (staff accounts, shared limiter, publication events, `published_at` guard).

**Security advisors:** no lints. **RLS:** enabled on all 12 public tables.

| Table | Live rows | Audited export |
|---|---|---|
| speakers | 12 | 12 |
| sermon_series | 20 | 22 |
| sermons | 104 | 120 |
| recurring_events | 18 | 25 |
| event_occurrences | 8 | 56 |
| one_time_events | 46 | 55 |
| groups | 3 | none in exports |
| outreach | 2 | none in exports |
| announcements | 1 | none in exports |
| ministries, staff, landing_pages | 0 | none in exports |

The live data is an older import plus rows from the legacy `scripts/seed-from-parsed.ts` (June 2026). Published rows that need an owner decision: announcement "Express(o) Service Renovation Pause" (homepage-featured; contradicts the confirmed Sunday 8:30 AM schedule), groups Contend Prayer Group, Alpha, Married's Small Group, outreach Joy Drop Collective, Pack the Pantry (names only). Reconciliation and the seed are ticket #101.

## Who may do what

| Agent | Allowed |
|---|---|
| Claude Code (Data) | Read-only audits; writes only under rule 3 |
| Codex (Ops) | Read-only audits (advisors, extensions, verification SELECTs) for runbooks and #41 |
| Cursor (QA/Experience) | Read-only verification of Claude's work; never writes |
| Owner | Auth settings, staff enrollment (`auth.users` + `admin_staff_accounts` SQL), env vars, backups, every "go" |
