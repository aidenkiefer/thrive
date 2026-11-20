# QA report: 2026-11-19-data-session-2

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Reviewer:** Claude Code senior-qa (Opus, heavy tier; **same model family as the author**) · **Owner go:** #108 on issue #101, 2026-11-19 23:11 UTC

## Results

| PR | Lane / tool | Verdict | Gate | Notes |
|---|---|---|---|---|
| #108 | data / claude | MERGED (`a8d8be0`) | PASS | #101 reconciliation and seed rails. Earlier GPT and Gemini rounds took it from BLOCK to FIX-FIRST to fixed; this pass re-checked the delta `9ba802e..75d1b06` (seed SQL generator) |
| #114 | data / claude | MERGE, held | PASS (combined) | Admin role (#102). GPT-family MERGE stands; draft until #41 and the owner's go on #102 |
| #123 | data / claude | MERGE, held | PASS (combined) | RLS matrix (#45). Landing fix needed when the chains combine (below); still needs a second-family policy review |
| #119 | data / claude | MERGE, held | PASS (combined) | Route inventory (#48); tests only |
| #120 | data / claude | MERGE, held | PASS (combined) | Reserved slugs (#40); redirect-overlap follow-up |
| #122 | data / claude | MERGE, held | PASS (combined) | Revalidation helper (#44); the new paths include every old path at all 10 call sites |

"Combined" means one scratch tree: `main` + #114 + #123 + #119 + #122 (which brings #15, #18, #23, #95, #90, #96, #120) + #108. Gate PASS (418 tests); PGlite `rehearse.mjs` 464/464, `cms-rehearse.mjs` 384/384; real Postgres `rehearse-pg.mjs` 1029/1032 as-is, 1041/1041 with the one-line fix below. Nothing from the scratch tree was pushed.

**`main` after merge:** gate PASS at `a8d8be0` (140 tests).

## Findings worth remembering

- **The two Data chains break the RLS matrix when combined.** #123's "every public table is classified" check fails in all three scenarios on `publication_events` (#90, chain B). Fix: add it to `SERVICE_TABLES` in `src/lib/security/rls-matrix.mjs:15` (verified: anon and authenticated get 42501). It can't go on #123's branch, where the table doesn't exist (`::regclass` errors), so whichever chain lands second carries it. `rehearse-pg` isn't in CI, so only a combined local run catches this.
- **`supabase/schema.sql` must not be merged hunk-by-hunk.** When chain A and chain B are combined, git aligns their shared `end; $$;` lines and interleaves the two appended blocks into invalid SQL. Two migration-mirror tests catch it. Chain B is a pure append over #15's file (+269 lines), so resolve by taking chain A's file and appending chain B's tail.
- **Siblings #114 and #123 conflict** in `scripts/pg-rehearsal/rehearse-pg.mjs` (A and B/C scenario calls) and the `supabase/README.md` check-count line. Keeping both sides resolves it. Restack #123 on #114 before landing.
- **Live write without a ledger row.** The #101 batch A and seed apply happened before #108 merged, and no ledger row was written. QA added it here. Builders should append the row in the same commit as the apply's session log.
- **Gate flake.** The first gate run on #108 rebased onto `5115b61` printed `GATE: FAIL` with 140/140 tests passing and 0 lint errors. The log wasn't captured. The next two runs, and the run on `main`, passed. If it recurs, capture the log (`gate.sh > log 2>&1`) before rerunning.

## Carry-over

- **Data stack** (#15, #18, #23, #90, #95, #96, #114, #119, #120, #122, #123): draft until the #41 checklist passes and the owner gives a go per PR. Landing order: chain A #15 → #18 → #23 → #95 → #114 → #123 → #119; chain B #90 → #96 → #120 → #122. Apply the `SERVICE_TABLES` line and the `schema.sql` append rule when the chains combine.
- **#123:** needs a different-family review of the policy audit (assignment rule for RLS/auth).
- **#120 follow-up (Ops):** single-segment redirect sources (`/im-new`, `/teaching`, `/kids`) aren't reserved, so a landing page with one of those slugs would be shadowed by its 301. #63 adds many more. Suggest a test that redirect sources and landing slugs don't overlap.
- **#120 cross-lane requests:** Experience `src/app/[slug]/page.tsx` should use `isReservedSlug()`; Ops docs/05 reserved-slug list. Both still open.
- **#101:** stays open per its PR (closes after seed and ledger). Seed applied and ledger row now present, so it can close once the owner agrees.

## Next session (for the PM)

1. Run the #41 checklist (Codex runbook, owner's branch-scoped Preview) on a combined Preview-candidate branch built with the two rules above. It's the only gate left between the Data stack and `main`.
2. Get a second-family review of #123 (Cursor or Codex) before that branch is assembled.
3. Owner decision: revoke TRUNCATE from `anon` and `authenticated` on the 12 content tables (new migration; #123 reports it as a note). PostgREST can't reach it, but it's an unneeded grant.
4. Close #39 (closed by #108) and decide on closing #101.

## Workflow friction

- **Stacked PRs are never gated together.** CI gates each tip alone. Fix: add a `do-not-merge` combined branch, rebuilt each session, that runs `gate.sh` plus `rehearse-pg` in CI.
- **Sibling stacks on one base edit the same harness lines.** Fix: when two tickets both extend `rehearse-pg.mjs`, stack the second on the first rather than on the shared base.
- **PR bodies drift after many fix rounds** (#108 still said 7 files / 120 tests at 13 files / 140 tests). Fix: the builder refreshes the numbers on every `FIXED` comment.

## Model usage

- One heavy-tier QA pass covered six PRs. It was cheap because each PR's diff was small and the effort went into the combined-tree rehearsal, which is where the only real defect was. The prior GPT and Gemini rounds on #108 were justified (they found two blockers).
