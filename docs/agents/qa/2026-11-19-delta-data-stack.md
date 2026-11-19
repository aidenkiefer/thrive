# QA report: delta review of the Data stack (2026-11-19)

**Scope:** Claude's overnight fixes on #15, #18, #23, #90, #95, #96, checked against `docs/agents/qa/2026-11-19-data-stack-and-cms-slice.md`.
**Reviewer:** Cursor senior-QA subagent. Nothing was merged, pushed, commented on, or edited. Work ran in a scratch worktree on local `cursor/qa-delta-*` branches, against `origin/main` at `0f025b1`.
**Status of the stack:** still **unmerged drafts**. Every verdict below is conditional on the owner's "go" and a green Preview checklist on #41 (which needs Preview provisioned, #54).

## Gate results

| Tip | Gate | Tests |
|---|---|---|
| #15 | PASS | 129 |
| #18 | PASS | 145 |
| #23 | PASS | 250 |
| #90 | PASS | 167 |
| #96 | PASS | 183 |
| #95 | PASS | 250 |
| Combined stack on `0f025b1` | PASS | 318 |

Lint: 0 errors on every tip. No tip adds a root dependency; #95's `embedded-postgres` and `pg` live in `scripts/pg-rehearsal` with their own lockfile and are not in the gate or CI.

## Fix verification

| Finding | Status | Note |
|---|---|---|
| #23 S1 (`RATE_LIMIT_HASH_SECRET` undocumented) | Fixed | In `.env.local.example` and `docs/admin-setup.md` (apply step, run-twice check, release gate) |
| #23 S3 limiter side (silent fail-closed) | Fixed | `unavailable()` logs a fixed code and purpose, never the subject; tested; seen in production smoke |
| #23 N3 (validation before limiter) | Fixed | 422 and honeypot return before the limiter |
| #23 N4 (duplicate `clientKeyFrom`) | Fixed | Single definition; `x-forwarded-for` trust documented |
| #23 docs/06 fail-closed note | Fixed | `docs/06-integrations.md` |
| #23 F1 (schema assertion fragile) | Fixed | Test slices at the next `-- ====` rule; passes with R2 and R2b appended |
| #15 S4 (timing / `after()`) | Partial on #15/#18, fixed at #23 | By design; #23 defers send with `after()` and pads every response (verify padded to 700 ms) |
| #15 S5 (body cap) | Not on #15/#18, fixed at #23 | `readLimitedText` streams and stops at the cap (forms 16 KB, request-code 2 KB); 20 KB POST returns 413 |
| #15 S6 (`service_role` privileges) | Fixed | select/insert/update only plus `before truncate` trigger; proven on real Postgres 17.11 (42501 / P0001) and PGlite |
| #15 S3 forms side | Fixed | `[forms] unavailable code=… form=…` logged and tested |
| #15 N1 (`make-admin-hash.mjs`) | Fixed on branch | Deleted on #15; still on `main` until #15 lands |
| #15 N2 (env example) | Not on #15/#18, fixed at #23 | #18 alone still ships `resend` transport and `info@` default |
| #15 N6 (session doc) | Fixed | 4 h session and revocation routes documented |
| #90 F2 (revalidate on failure) | Fixed | `finally` in all editors |
| #90 F3 (save helper tests) | Fixed | `src/lib/cms/save.ts` plus 10 tests; PGlite rehearsal 378/378 on the combined tree |
| #90 F4 (schema.sql conflict) | Fixed | PR body procedure confirmed correct |
| #90 F5 (PR body numbers) | Fixed | Match |

## New findings

| ID | Severity | Where | Finding and fix |
|---|---|---|---|
| N-A | **Should-fix** | #23 | **Sign-in path logs nothing.** `requestStaffCode`'s deferred `send()` swallows errors and `verifyStaffCode` returns null silently on store/OTP failure. A broken Supabase SMTP or OTP template during the #41 Preview run would be invisible. Fix (~8 lines): log a fixed PII-free `[staff-code] send_failed` / `verify_error` in the two catch blocks, with a test using an injected `log`. |
| N-B | **Should-fix (process)** | landing | The earlier `git checkout <branch> -- <paths>` retarget recipe reverts `main`-only edits to shared docs (it reverted the GTM rows in `docs/06-integrations.md`). Use the per-PR patch method below. |
| N-C | Nit | #96 body | Summary says every `published_at` change is attributed; the guard covers UPDATE only. Reword: "UPDATEs of `published_at`; INSERT unguarded until #94". |
| N-D | Low (ops) | #96 | Re-running the seed after the guard aborts at the first row whose `published_at` staff changed (verified, `P0001`). Add one line to `docs/admin-setup.md`: never re-seed a database with staff edits. |
| N-E | Info | #96 | A role running raw SQL can bypass the guard via `set_config('thrive.cms_set_published','on',true)`. Not reachable over PostgREST; scope is stated in the migration header. INSERT, delete+insert and content-table TRUNCATE by `service_role` stay open (TRUNCATE predates this PR). #94 addresses the INSERT side. |
| N-F | Nits | #15, #95, #96 | #15 body has stale sentences; #95 README vs body disagree on mutation counts (5–13 vs 5–21) and runtime (~20 s vs ~17 s); #96 `landing-pages/page.tsx` does not use `saveWithFeedback`, so staff see a generic publish error. |
| N-G | Info | #18 | Landing #18 without #23 leaves a pre-filled `resend` transport and `info@` example. Keep #18 and #23 in one landing window. |

## Per-PR verdicts

| PR | Verdict | Condition |
|---|---|---|
| #15 | MERGE | Refresh stale PR body sentences (N-F) |
| #18 | MERGE | Land with #23 (N-G) |
| #23 | **FIX-FIRST** | N-A logging (~8 lines) |
| #90 | MERGE | Resolve `schema.sql` per the procedure below |
| #96 | MERGE | Reword Summary (N-C); add re-seed line (N-D) |
| #95 | MERGE | Optional: reconcile README/body numbers |

## Merge simulation and smoke

Simulated on `0f025b1`, `--no-ff`: #15, #18, #23 clean; #90 conflicts in `supabase/schema.sql` only (both sides append) and resolves by keeping main's file then appending the R2 block; #96 and #95 clean. Combined gate PASS (318 tests). PGlite rehearsal 378/378; real Postgres 17 harness 589/589 on the combined chain, run twice.

Production smoke (combined build, Supabase env unset): public pages 200; `/admin*` 307 to `/admin/login`; unknown route 404; forms GET 405; empty POST 400; valid POST 503 with `Retry-After: 60` (limiter unconfigured, fail-closed); 20 KB POST 413; request-code empty 400, valid 503.

## Landing procedure (two chains, squash-merged)

Chain A: #15 → #18 → #23 → #95. Chain B: #15 → #90 → #96. Do this **only** after the owner's go and a green #41 checklist on one combined Preview branch.

**Step 0, capture patches and old tips before any merge** (after `git fetch origin`):

```sh
B15=origin/claude/data-mvp-foundations; B18=origin/claude/data-resend-transport
B23=origin/claude/data-shared-limiter; B90=origin/claude/data-cms-publish-attribution
B96=origin/claude/data-cms-r2b; B95=origin/claude/data-pg-rehearsal
mkdir -p /tmp/land
git diff $B15 $B18 > /tmp/land/18.patch
git diff $B18 $B23 > /tmp/land/23.patch
git diff $B15 $B90 -- . ':!supabase/schema.sql' > /tmp/land/90.patch
git diff $B90 $B96 -- . ':!supabase/schema.sql' > /tmp/land/96.patch
git diff $B23 $B95 > /tmp/land/95.patch
blk() { git show "$1:supabase/schema.sql" | awk -v h="$2" '$0~h{f=NR} {l[NR]=$0} END{for(i=f-1;i<=NR;i++)print l[i]}'; }
blk $B90 '^-- R2: publication_events' > /tmp/land/r2.sql
blk $B96 '^-- R2b: published_at guard' > /tmp/land/r2b.sql
# also record each old tip: git rev-parse origin/<branch>
```

**Rules:** squash-merge with `gh pr merge N --squash` and **without** `--delete-branch`; after each squash retarget dependents with `gh api -X PATCH repos/aidenkiefer/thrive/pulls/N -f base=main` (never `gh pr edit`), replace their head with a clean commit, run the gate on it, then squash-merge. Delete old branches only at the end.

**Order:** #15, then #18, #23, #90, #96, #95 (#23 retargets after #18, #96 after #90, #95 after #23). For each N:

```sh
git fetch origin && git checkout -B land-N origin/main
git apply --3way --index /tmp/land/N.patch
# #90: { echo; cat /tmp/land/r2.sql;  } >> supabase/schema.sql
# #96: { echo; cat /tmp/land/r2b.sql; } >> supabase/schema.sql
git add -A && git commit -m "<original PR title> (#N)"
scripts/agents/gate.sh
git push --force-with-lease=<head-branch>:<OLD_TIP_SHA> origin land-N:<head-branch>
gh api -X PATCH repos/aidenkiefer/thrive/pulls/N -f base=main   # skip if already retargeted
gh pr merge N --squash
```

The patch method reproduced the merge-simulation tree byte-for-byte. The `gh` and `git push` commands above were **not executed** in this review.

**Database and deploy order for the CMS pair:**
1. Apply migration `20261119000000` before deploying #90's code (the code calls `cms_set_published`).
2. Apply `20261119010000` only after #96's code is live (older editors writing `published_at` directly would be refused).
3. Same order on the production database.

For #41, deploy one combined branch rather than relying on each PR's own Preview: a single PR's Preview covers only its own chain (for example #96's has no shared limiter).

## Still unverified

- Hosted Supabase: roles and ownership, PostgREST/GraphQL exposure, unreachability of `set_config` over REST.
- Real Supabase Auth OTP and Resend delivery; whether 700 ms covers real `verifyOtp` latency; `after()` behaviour on Vercel.
- `cms_set_published` and the guard under concurrency (only single-connection PGlite so far).
- Postgres 15 and pooler behaviour.
- Rehearsal counts on single tips (264/264 on #90, 372 on #96); only the combined tree was re-run (378).
- Landing commands (`gh api PATCH`, `gh pr merge`, force-with-lease pushes).
- The #41 Preview checklist: none of it has been run.
