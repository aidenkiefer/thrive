# Session log: `cursor/pm-architecture`

**Assignment:** carry-over brief (coordinator) · **Lane:** pm / docs (Cursor standing in for Codex's idle PM lane; owner approved) · **Tool:** cursor · **Started:** 2026-11-19

## Status
Replaces draft PR #14 (`codex/pm-session-2026-11-18`, originally by Codex, base `d9d7df4`). Only the durable files were taken. Opened as a **draft**: the `AGENTS.md` forms-constraint rewrite needs owner approval before ready.

## Entries
- `00:20` **change**: took from `origin/codex/pm-session-2026-11-18`: `AGENTS.md`, `floorplan.md`, `docs/06-integrations.md`, `docs/workflow/{agent-onboarding,skill-map}.md`, `docs/plans/specs/2026-11-18-mvp-development-architecture.md`, `docs/plans/specs/2026-11-18-mvp-preparation.md` (trimmed), `.agents/skills/product-manager/{SKILL.md,project-board.md}`. `main` had changed none of these paths since `d9d7df4` (`git diff d9d7df4 origin/main` empty for each), so no hand merge was needed; the existing `GTM-NQV3Z3N7`/Ads rows in `docs/06` were already on `d9d7df4`.
- `00:20` **decision (not taken)**: `docs/agents/assignments/2026-11-18-development-kickoff.md` (batch superseded by `2026-11-18-batch-2.md`) and `docs/plans/specs/2026-11-18-laptop-handoff.md` (PR #9 / dated laptop review). Both are session checkpoints.
- `00:21` **decision**: kept `2026-11-18-mvp-preparation.md` but cut it to its durable part (renamed heading "MVP release dependencies"). Removed: the 7-step session order, "Current handoff" (links the kickoff and laptop handoff, PR #8/#9 status), "Modular backlog" (carry-over PRs #5/#8/#9/#12 and "retire the superseded RC2 draft"; the board tracks tickets), and the dated 2026-11-18 passive-request paragraph. Kept: the week-of-Nov-23 planning target (stated in the file), and the "Connected services to verify" table. Reason: floorplan and `docs/06` link to it and the table is release-gating, not a checkpoint. No #17/#19/#20 references existed in it.

## QA findings
Applied:
- Removed "baseline d9d7df4" sentence and the kickoff link from the architecture spec; removed the stale "parked at the owner's request" sentence.
- `agent-onboarding.md`: Node 22 -> Node 20 (`.github/workflows/ci.yml` uses `node-version: 20`; `package.json` has no `engines` field).
- Architecture spec: new "Owner decisions since this was drafted" (Postgres limiter #23, announcements newest-featured-wins with no priority/scheduling per `docs/staff/announcements.md`, GTM `GTM-PRJX6P9H` with no consent notice).
- `docs/06-integrations.md`: added `GTM-PRJX6P9H` row beside `GTM-NQV3Z3N7` (labelled live WordPress vs new site) plus one note that Ads `AW-16575196430` is not loaded directly (owner to confirm). The original PR #14 two-line intro under the title is also kept (it links the floorplan); its trailing "staff identity requirements" claim was dropped because the trimmed spec no longer covers it.
- `floorplan.md` / `docs/06`: retitled link text to match the trimmed preparation spec.
Not applied:
- None skipped. Existing text in the architecture spec about announcement "scheduling" and "featured placement/expiration" was left in place and is explicitly superseded by the new decisions section rather than rewritten.

## Not verified
- That the owner approves the `AGENTS.md` forms-constraint rewrite (blocks ready-for-review).
- Whether the Ads tag really lives inside `GTM-PRJX6P9H` (owner).
