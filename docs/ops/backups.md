# Weekly encrypted database snapshots

**Status (2026-11-22): prepared with local fixtures only.** No R2 bucket, live database connection, scheduled workflow, live snapshot, or restore of a real snapshot is attested here. The workflow is intentionally inert at `.github/workflows/weekly-backup.yml.example`.

## Format and failure behavior

The pinned Supabase CLI exports `roles.sql`, `schema.sql`, `data.sql`, and separate migration-history schema/data files following [Supabase's logical backup procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). The five files are tarred, then encrypted locally with AES-256-GCM using a fresh nonce. Only the ciphertext is uploaded to a **separate private R2 bucket**. The operator keeps the 32-byte key outside the repository and R2. Losing it makes the snapshots unusable.

The job downloads the uploaded ciphertext, compares SHA-256, decrypts and authenticates it locally, compares the plaintext SHA-256, then uploads and reads back a verification marker. Only after that marker is confirmed does it remove snapshots older than the newest ten verified markers. A failed export, upload, readback, decryption, or marker check leaves prior verified snapshots intact. A failed prune reports failure; a deleted marker can leave an encrypted orphan, which an operator must inspect privately. Temporary plaintext and ciphertext are removed from the runner at the end of a run. Application/CLI stderr is suppressed to keep connection details out of logs.

This verifies file integrity, **not** that a new Supabase project can restore and serve the app. The five CLI exports run sequentially, so writes during the run can make schema/data/history inconsistent across files; schedule during low activity and test a real restore before relying on this as the sole recovery path. Supabase database dumps do not include Storage object bytes; provider-hosted Google Form responses are outside this backup. Track those recoveries separately. See [Supabase backup coverage](https://supabase.com/docs/guides/platform/backups).

## Prepared commands (offline only)

The fixture command uses an arbitrary local tar file, a fake storage directory, and a disposable key. It makes no network or database request:

```bash
export THRIVE_BACKUP_KEY="$(openssl rand -base64 32)" # temporary test key only
node scripts/agents/backup.mjs fixture /path/to/disposable-fixture.tar /tmp/thrive-fake-r2
node scripts/agents/backup.mjs check-local /tmp/thrive-fake-r2
```

`scripts/agents/backup-core.test.mjs` covers encryption/tamper rejection, readback recovery, newest-ten pruning, failed upload/readback preservation, and stale-snapshot detection. It does not exercise live Supabase or R2.

**Disposable rehearsal result (2026-11-22): PASS for a fixture only.** An unprivileged PostgreSQL 16.15 cluster was started on loopback `127.0.0.1:35432` with a database named `thrive_restore_fixture`. A five-file SQL tar containing one `restore_fixture` row and one `supabase_migrations.schema_migrations` row was encrypted, stored in a local fake R2 directory, read back, authenticated, extracted, and restored by `restore-local.mjs`. `psql` returned `7|offline fixture` and `fixture-001`. The server was stopped afterward. This does not prove that a Supabase production export will restore.

For a disposable local PostgreSQL restore, use a database whose name begins `thrive_restore_` and a loopback `PGHOST`; the script refuses other targets. Create the empty database yourself, set only local `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and run:

```bash
node scripts/agents/restore-local.mjs fixture SNAPSHOT_ID /tmp/thrive-fake-r2 --confirm-disposable
```

The script authenticates/decrypts the selected **fixture** archive and runs the five SQL files in one `psql` transaction. It refuses a non-loopback host, connection overrides, and a database name without the disposable prefix. It deliberately has no R2 mode: a real Supabase export can depend on managed schemas, roles, extensions and platform settings that a vanilla local Postgres cannot reproduce. Rehearse a real encrypted R2 snapshot with the [provider restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) on an owner-approved isolated target. Independently compare backup-time counts, migration history, RLS and selected public routes before calling that restore successful. Supabase-managed extensions, custom Auth/Storage changes, Vault keys, and Storage files need separate recovery checks.

## Owner-assisted activation and live acceptance

1. Confirm the church-controlled database account, minimum actual export/management scopes, direct or session-pooler URL, and Supabase CLI compatibility. The pinned CLI 3.2.0 accepts `db dump --remote=<url>`; verify its actual permissions in the owner setup window before calling the credential read-only. Enter the URL as `BACKUP_DATABASE_URL` only in Actions secrets. Never paste it into a PR or issue.
2. Create a **private, separate** R2 Standard bucket and bucket-scoped credentials with only required list/read/write/delete access. Record owner access and recovery ownership privately. Measure a first encrypted dump and estimate `size × 10` against the current [R2 free allowance and billing units](https://developers.cloudflare.com/r2/pricing/); check required payment or subscription with the owner before enabling it. Do not assume 10 copies fit the allowance.
3. Generate a random 32-byte encryption key privately, keep a tested recovery copy outside GitHub/R2, and set `BACKUP_ENCRYPTION_KEY` as an Actions secret. Set `BACKUP_R2_ENDPOINT`, `BACKUP_R2_BUCKET`, `BACKUP_R2_ACCESS_KEY_ID`, and `BACKUP_R2_SECRET_ACCESS_KEY`. Restrict Actions workflow editing and secret access.
4. Pick a weekly off-hour schedule and add it when renaming the `.example` template to `.yml`. Configure an **independent** heartbeat monitor for a seven-day period plus about one day of grace, so it alerts when no success ping has arrived for eight days total; set `BACKUP_HEARTBEAT_URL`. Enable GitHub Actions failure notifications too. GitHub [warns schedules may be delayed or dropped and public-repo schedules disable after 60 inactive days](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), so Actions email alone cannot detect a missed run. A private operations repo is an alternative, subject to owner access/cost review.
5. After approval, manually dispatch one live job, watch its private logs, confirm one encrypted object and matching verification marker in the private bucket, record measured size, verify successful readback, and run `check-r2`. Confirm failure alerts with a safe test and missed-run alert with the independent monitor's test mode. Then verify weekly execution and retention with eleven fixture objects before relying on live pruning.
6. Rehearse a **real** snapshot into a disposable isolated local Postgres or approved throwaway Supabase project, with outbound mail/webhooks disabled. Record backup-time table counts, migrations, RLS, selected routes, elapsed restore time, and agreed RPO/RTO. Do not state that a fixture decrypt or green workflow is a successful real backup/restore. Follow the [existing recovery drill](backup-restore-drill.md) for the evidence record.

The owner must approve any required R2 payment or recurring charge before activation. DNS cutover and any production restore require separate authorization. The Data lane owns the `docs/ops/supabase-live-project.md` role matrix update for this new backup operator.
