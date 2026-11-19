# Supabase readiness for Preview and production

**As of 2026-11-19, approximately 14:08 CST.** Ops verified the live schema and aggregate counts through read-only MCP calls. Backup availability, operator access and recovery remain unverified. Preview uses the existing production project until launch. The owner’s [decision](../plans/owner-decisions.md) supersedes earlier separate-project instructions. The current [write policy](supabase-live-project.md) names Data (Claude Code) as sole executor of approved database changes.

## Live evidence

Exact SELECT counts follow. The table-summary estimates showed zero even for populated tables. No personal records or values were read.

| Public table | Rows | Public table | Rows |
|---|---:|---|---:|
| speakers | 12 | groups | 3 |
| sermon_series | 20 | outreach | 2 |
| sermons | 104 | announcements | 1 |
| recurring_events | 18 | ministries | 0 |
| event_occurrences | 8 | staff | 0 |
| one_time_events | 46 | landing_pages | 0 |

Migration history contains only `20261107000000 mvp_foundation`, `20261107010000 ministry_schedule_forms` and `20261107020000 contact_column_privacy`. The staff-account, shared-limiter and CMS migrations remain unapplied. Seed reconciliation belongs to [#101](https://github.com/aidenkiefer/thrive/issues/101). Migration `20261119000000` must precede #90 code deployment. Apply `20261119010000` only after #96 code is live.

All 12 public tables have RLS enabled and a SELECT policy for PUBLIC. Policy metadata yielded these visibility rules.

| Tables | Visible rows |
|---|---|
| speakers, staff | All rows, subject to column privileges |
| sermons, sermon_series, recurring_events, one_time_events, groups, ministries, outreach, landing_pages | Rows with a non-null publication timestamp |
| announcements | Published rows whose expiry is absent or in the future |
| event_occurrences | Events that have not been cancelled and whose recurring parent is published |

These RLS and privilege findings come from metadata only. Ops did not attempt anonymous HTTP writes. Neither `anon` nor `authenticated` has SELECT on `speakers.email`, `staff.email` or `staff.phone` (all six `has_column_privilege` results false). There were no write policies on these tables. For roles subject to RLS, table-level INSERT or UPDATE grants alone do not allow row writes.

The Storage bucket catalog and Storage object policy list were empty. Media upload readiness is pending owner and Data review.

| Advisor | Finding and disposition |
|---|---|
| Health | Zero lints at audit time. |
| Security | Zero lints at audit time. |
| Performance | Data should assess covering indexes for `sermons_series_id_fkey` and `sermons_speaker_id_fkey`. [Foreign-key lint](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) |
| Performance | The advisor flagged `sermons_published_at_idx`, `event_occurrences_recurring_event_id_idx` and `staff_display_order_idx` as unused. Retain pending a representative traffic sample and query-plan review. [Unused-index lint](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) |

Installed extensions were `supabase_vault` 0.3.1 (vault), `uuid-ossp` 1.1 (extensions), `pgcrypto` 1.3 (extensions), `plpgsql` 1.0 (pg_catalog) and `pg_stat_statements` 1.11 (extensions).

## Repeat the metadata checks

These read-only queries return installed extension metadata and three privilege flags per role. All six flags were false at the audit.

```sql
SELECT e.extname, e.extversion, n.nspname AS installed_schema
FROM pg_extension AS e
JOIN pg_namespace AS n ON n.oid = e.extnamespace
ORDER BY e.extname;

SELECT role_name,
       has_column_privilege(role_name, 'public.speakers', 'email', 'SELECT') AS speaker_email_readable,
       has_column_privilege(role_name, 'public.staff', 'email', 'SELECT') AS staff_email_readable,
       has_column_privilege(role_name, 'public.staff', 'phone', 'SELECT') AS staff_phone_readable
FROM (VALUES ('anon'::name), ('authenticated'::name)) AS roles(role_name);
```

## Key custody and rotation

The owner keeps credentials in scoped server settings. No rotation or configuration change was performed.

| Setting | Owner action |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Store privately in Vercel server settings. Inventory all clients before rotating a JWT secret. Legacy service-role and anonymous keys can depend on the same JWT secret. Follow the provider's migration sequence to prevent shared clients losing access. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) |
| `RESEND_API_KEY` | Store the form sender credential in scoped Vercel server settings. Keep the separate Auth SMTP credential in Supabase Auth settings and outside the repository. |
| `NEXTAUTH_SECRET` | Store the session secret in Vercel. Schedule rotation with staff because it invalidates existing sessions. |
| `RATE_LIMIT_HASH_SECRET` | Use a separate secret of at least 32 characters per environment in Vercel. Rotation changes bucket identities and can reset effective limits. Coordinate timing with limiter cooldowns. |

For a planned rotation, the owner provisions the replacement privately, updates the selected environment and branch scopes, redeploys, and verifies the affected service in the approved sandbox. For Resend, revoke the old key after sandbox delivery succeeds. Record only the role, date, scopes and outcome.

## Owner checks before live changes

- [ ] Review organization and project membership, backup/restore access and who can deploy a privileged Preview. Record roles and review date only. Membership and access review date: ____.
- [ ] Enable Vercel Authentication on Preview and restrict privileged Preview values to the designated QA branch. Review server-side scope for `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `RATE_LIMIT_HASH_SECRET` and `RESEND_API_KEY` privately.
- [ ] Confirm plan: ____. Daily backups enabled: ____. PITR enabled and recovery window: ____. Latest usable recovery point and timezone: ____. Ops cannot establish these from the MCP audit.
- [ ] Confirm maximum tolerable data loss (RPO): ____. Maximum tolerable time to restore service (RTO): ____. Follow the [backup and restore drill](backup-restore-drill.md) and record the result.
- [ ] For each proposed live write, post a go on its issue naming the reviewed artifact, commit and intended change, then confirm a usable backup for that change. Data alone executes and records the assigned version, verification query and result in the [change ledger](supabase-change-ledger.md). Agents do not create projects or branches.
- [ ] Owner configures Auth and enrolls staff. Bootstrap [#15](https://github.com/aidenkiefer/thrive/issues/15) is pending. Account creation, disabling, re-enabling and rebinding require the admin role; the owner is the sole current admin ([#102](https://github.com/aidenkiefer/thrive/issues/102)). Never query the Auth user list for evidence.
- [ ] Use the forthcoming [#41 Preview verification runbook](https://github.com/aidenkiefer/thrive/issues/41) for application checks. Migration replay, limiter writes, sign-in, email, seed and restore were unrun in this audit.
