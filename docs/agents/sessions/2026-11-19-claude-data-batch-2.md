# Session log: `claude/data-cms-publish-attribution`

**Assignment:** `docs/agents/assignments/2026-11-18-batch-2.md` · **Lane:** data · **Tool:** claude (Claude Code, Opus 5.5) · **Started:** 2026-11-19

## Status
Draft PR #90 (R2, stacked on #15) open; R1 complete. Waiting on senior QA and the owner go for #15 → #18 → #23 → #90.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `00:11` **note**: Session log initialized from assignment batch-2. (claude/Opus 5.5)
- `00:11` **change** R1 T1: Data stack brought onto main: #15 rebased (4915b1a, gate PASS 127 tests), #18 merged forward (gate PASS 143 tests), #23 merged forward and retargeted to base claude/data-resend-transport (gate PASS 236 tests). (opus) [4915b1a]
  #15 rebased onto main fa6b395..558a012; only conflict supabase/schema.sql (kept #12 COLUMN PRIVACY grants, then D1R admin_staff_accounts block). No shared-password or OIDC code remains (only docs saying it was removed, plus a test asserting absence).
  Files: supabase/schema.sql, src/lib/admin-auth.ts, src/app/api/forms/[formId]/route.ts, src/app/api/admin-login/request-code/route.ts, supabase/README.md
- `00:11` **decision** R1 T1: Deviation from assignment (rebase + force-push per branch): a retry force-push was denied by the tool's permission classifier, so #18 and #23 were brought forward with merge commits (normal push). (opus)
  PR diffs unchanged: #18 = 6 files +196/-5 vs #15; #23 = its 14 limiter files vs #18. QA should squash-merge.
- `00:11` **change** R1 T1: New commit 4915b1a on #15 adds relative imports in src/lib/admin-auth.ts, src/app/api/forms/[formId]/route.ts, src/app/api/admin-login/request-code/route.ts (#23: route test imports and vi.mock paths too). (opus) [4915b1a]
  Reason: main's vitest.config.mts has no '@/' alias, so colocated tests failed to load.
- `00:11` **change** R1 T1: D1L-C PGlite rehearsal re-run on the integrated 5-migration chain (now includes 20261107020000_contact_column_privacy.sql): 353/353 pass, catalogs identical. (opus)
  supabase/README.md on #23 updated; it now notes the harness compares table ACLs, not column grants.
- `00:11` **request** ops: add `resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }` (or equivalent) to vitest.config.mts. Colocated tests importing '@/lib/...' fail to load since #27; after it lands, Data restores '@/' imports.
- `00:11` **note**: R2 (CMS attributed publishing) starting on this branch, stacked on #15.
- `00:30` **change** R2: Attributed publishing first slice: migration 20261119000000 (append-only publication_events + cms_set_published, active-actor check, whitelist, FOR UPDATE), schema.sql mirror, src/lib/cms (setPublished), announcements save wired (content writes no longer touch published_at). (opus) [d39735e]
  PGlite rehearsal 261/261 (fresh, June, June-no-patch; chain twice, catalogs identical; RLS, grants, append-only, error codes). Gate PASS (13 files, 151 tests). Migration also revokes service_role's default grants so it holds only select/insert.
  Left: drafts/preview copies, restore, revisions, wiring the other 8 editors, a public read of who published, ops to apply the migration.
- `00:30` **change** R2 T1: Draft PR #90 (stacked on #15): cms_set_published + append-only publication_events, announcements wired. /code-review high found 7, fixed 5 (d769a64); DB-level enforcement deferred to #91; kept the double requireAdmin (existing pattern). Gate PASS 155 tests; PGlite 264/264. (opus+sonnet-subagent) [d769a64]
  Files: 20261119000000_publication_events.sql, supabase/schema.sql, src/lib/cms/publication.ts, src/lib/cms/index.ts, src/lib/cms/publication.test.ts, src/app/admin/announcements/page.tsx
- `00:30` **decision** R2 T1: Save order is unpublish before the content write and publish after, so a partial failure is never more public than intended. A new-item cleanup delete runs only on a definite Postgres rejection (SQLSTATE present). (opus)
- `00:30` **note** R2 T1: Cross-lane request for the vitest '@' alias is fulfilled on main by Cursor's #89. Data branches keep relative imports (harmless, less churn); they can be restored later.
- `00:30` **note** R2 T1: Senior QA of Codex PRs #16 and #20 is superseded. Cursor closed them and landed #85 and #89 as replacements during review. QA worktree removed; verdict comments remain on the closed PRs.
- `00:30` **note** board: Added labels agent:claude/cursor/codex, stacked, needs-preview, and the Batch field (Cursor later reshaped its options into a roadmap). #15, #18, #23, #90, #79, #80, #91 on milestone M2. Filed #91 R2b (Batch 4). Closed R1 #79. Project README now describes milestones, batches and labels.
- `00:30` **note** session end: Data lane batch 2 done (R1 complete, R2 in draft #90). Open: senior QA plus owner go for #15 → #18 → #23 → #90. All four branches merge cleanly with main as of 2026-11-19 (7 behind). Next Claude work: #91 with #44 (same admin actions) after #90; #45 RLS matrix tests after #15.
- **merge** #15 QA fixes (S6, S3 forms, N1, N6) into #90; clean.
- **fix** F2 (#90 QA): announcements save revalidates `/admin/announcements` and `/` in a `finally`, so an unpublish that committed before a later failure cannot stay cached on `/` for 60s.
- **change** F3: the save/publish sequence moved out of the `'use server'` page into `src/lib/cms/save.ts` (`saveWithPublication`, structural `ContentDb`). `save.test.ts` uses a fake db and covers: actor id passed through, unpublish before write, publish after write, cleanup delete only for a SQLSTATE error, no cleanup on a code-less failure, cleanup failure, insert failure.
- **test** F3: committed the R2 PGlite rehearsal as `scripts/pglite-rehearsal/cms-rehearse.mjs` (same package/lockfile as #23's harness; reads the June schema from git). 264/264 pass, including draft/published visibility to anon. F1 (migration.test slice) is on #23.
