# Session log: `claude/data-wp-media-inventory`

**Assignment:** `docs/agents/assignments/2026-11-22-managed-signup-sprint.md` (staged on `origin/codex/pm-managed-services-decisions`, not yet on main) · **Lane:** data · **Tool:** claude (Claude Code, Opus 5.5) · **Started:** 2026-11-24

## Status
D-49 implemented; gate pending commit, PR for independent QA. Ticket D-49: read-only WordPress media inventory/checklist plus dashboard-managed Supabase Storage runbook (size M, tier T1).
Scope: issue #49 Data portion (owner decision 2026-11-22 in issue body).

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `20:47` **note** D-49: session initialized in worktree `claude/data-wp-media-inventory`; no code or docs changed yet. (Claude Code, Opus 5.5)
- `20:49` **change** D-49: added `src/lib/media/wordpress-inventory.ts` (+ colocated test), `scripts/media-inventory.ts`, generated `supabase/ops/media/wordpress-media-audit.sql` and `wordpress-media-checklist.md`, and runbook `supabase/ops/media/README.md`. Read-only; no bucket, upload, row write, policy or migration.
- `20:51` **note** D-49: seed-held (offline) = 111 distinct uploads (70 image, 41 mp3) over 114 refs: one_time_events.featured_image_url 49, recurring_events.featured_image_url 24, sermons.audio_url 41. Matches every WordPress match in `supabase/ops/2026-11-20-seed.sql` (test-asserted).
- `20:55` **note** D-49 live read (MCP `execute_sql`, SELECT-only per docs/ops/supabase-live-project.md rule 1): `storage.buckets` = 0 rows. Audit query (committed file minus the `row_ids` array column) = one_time_events.featured_image_url image 50, recurring_events.featured_image_url image 24, sermons.audio_url audio 41; other 22 columns 0. Second SELECT of public event slugs only: the extra one-time row is `thrive-youth-thursday-nights`, the stale duplicate already in docs/ops/db-reconciliation-2026-11-19.md item 3. No personal fields, URL values or credentials read.
- `20:56` **note** D-49 code-held (read-only scan, not edited): `src/components/content/photos.ts` 14 `${BASE}` photos (Codex/Experience moving to `public/images/**`); `CardImage.tsx:14` and `next.config.ts:19-20` WordPress allowances remain under the existing guard. Supabase public Storage host already allowed in both, so no Ops host request.
- `20:57` **blocker** D-49: sermon audio (41 mp3) hosting is an owner decision: Storage vs existing podcast/YouTube vs defer (recommended: podcast/YouTube if a feed exists, else Storage after a size + plan check). Images proceed independently.
- `20:57` **blocker** D-49: bucket creation, uploads, DB URL rewrite and usage check need the owner dashboard session and an artifact-specific go; steps are in `supabase/ops/media/README.md` § Owner setup.
- `20:58` **request** experience: after the photos.ts move lands, drop the `photos.ts` allowlist line from `tests/media/no-wordpress-media.test.ts` (with Ops) and confirm `npx tsx scripts/media-inventory.ts --code` reports only the CardImage/next.config branches.
- `20:58` **request** ops: link `supabase/ops/media/README.md` from `docs/ops/media-inventory.md` § Cross-lane requests (Data item is now delivered) and add the audit-zero-rows condition to `docs/ops/cutover-runbook.md`. Remove the WordPress `remotePatterns` entry and CardImage branch only after the audit returns zero rows.
- `20:59` **note** D-49: local env: the worktree's `node_modules` was built under Node 18 (missing rolldown binding); reran `npm ci` under nvm Node 20 locally. No lockfile change.
