# Backup and restore drill

**Status on 2026-11-19: unrun.** Preview shares production. Run this exercise only against a separately approved disposable restore target. The owner controls the backup and approves the destination and cost. Agents do not create projects or branches.

## Choose a recovery point before any write

1. In the Supabase dashboard, the owner checks the actual plan, available recovery points, retention window and restore permissions. Paid daily-backup retention is 7 days on Pro, 14 on Team and up to 30 on Enterprise. PITR is a paid add-on with its own recovery window. Verify which mechanism the project actually uses. [Supabase backup guide](https://supabase.com/docs/guides/platform/backups)
2. On Free, or when a suitable managed recovery point is unavailable, the owner makes a private logical export and stores it securely offsite outside the repository. Confirm the selected method supports restoration to the intended disposable target. The owner keeps all credentials, dump files and service configuration private. [Supabase backup and restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
3. Record the recovery-point time with timezone and capture exact aggregate table counts, migration history and relevant policy metadata at that point. For a prior managed backup, use contemporaneous records if available and mark comparisons without a matching baseline unverified. A database backup excludes Storage object bytes. The current bucket inventory is empty; if that changes, the owner must arrange separate object backup and recovery. [Supabase backup coverage](https://supabase.com/docs/guides/platform/backups)

## Rehearse on the disposable target

1. Owner records recovery objectives and explicitly approves the isolated target and restoration method. Keep it disconnected from production deployments. Before restoring or starting workloads, disable outbound Auth messages, email delivery and webhooks, including restored integrations that could contact live recipients. Stop if isolation cannot be confirmed.
2. Record the simulated incident and recovery start times. Owner keeps private recovery material under their control. If an agent must execute a database change, require issue approval naming the exact artifact and commit or batch, then backup confirmation. Only Data (Claude Code) may execute and append the verification to the [ledger](supabase-change-ledger.md). Use the provider procedure appropriate to the backup format.
3. On the restored target, compare exact counts and applied migrations to the **backup-time** snapshot. Record differences by table and version. Report gaps against the audited content export separately under [#101](https://github.com/aidenkiefer/thrive/issues/101). Staff edits require reconciliation before changing content; never blindly reseed or reverse migrations.
4. Check RLS on all 12 expected public tables, SELECT and write policy metadata, and all six contact-column privilege results against [the readiness audit](supabase-readiness.md). Compare bucket inventory and object policies. Verify any separately restored media by approved inventory. Use metadata and counts only.
5. Owner or QA opens one published sermon and one published event using approved slugs on the isolated application. Record status and whether expected public content renders. Keep outbound delivery disabled. Record recovery completion only after the agreed checks pass.
6. Compare the age of the recovery point at the simulated incident with the RPO. Compare elapsed recovery time with the RTO. Record exceptions, responsible role and retest date. Owner confirms target disposition and retention of private copies. A production restore requires separate issue approval, backup confirmation, Data execution and a ledger entry under the [live policy](supabase-live-project.md).

## Drill record

Publish only roles, timestamps, aggregates and outcomes. Keep database identifiers, connection details, account information, backup files and screenshots containing private data out of tickets and logs.

| Evidence | Owner or QA entry |
|---|---|
| Plan, backup method, retention and restore access verified | ____ |
| Approval issue, executor role and target isolation verified | ____ |
| Recovery point and simulated incident time (with timezone) | ____ |
| Recovery start and validated finish (with timezone) | ____ |
| RPO target / observed data-loss window / pass or fail | ____ / ____ / ____ |
| RTO target / elapsed recovery time / pass or fail | ____ / ____ / ____ |
| Exact counts and migration history vs. backup-time baseline | ____ |
| Export reconciliation tracked separately under #101 | ____ |
| RLS, contact privileges and Storage verification | ____ |
| Published sermon / event route check | ____ / ____ |
| Result, exceptions, follow-up role, retest date and target disposition | Unrun / ____ |
