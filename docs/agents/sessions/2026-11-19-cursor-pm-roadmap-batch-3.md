# Session log: cursor / pm-roadmap-batch-3 (2026-11-19)

Branch `cursor/pm-roadmap-batch-3`. Planning only, docs only; no app code.

- **decision**: created GitHub milestones M1-M5 (no due dates: none known; owner decides). Milestone descriptions carry exit criteria derived from `docs/08`, `docs/00`, the RC2 assignment and the audit docs.
- **change**: converted the 18 board draft cards into real issues (#30-#83 range) so they can carry milestones; every field value was copied and verified against a backup before each draft was deleted. All 25 PRs received a milestone.
- **change**: four planning agents shaped issues: Experience (12), Ops/QA/Launch (12), Data/CMS/Owner (12). Deliverables: `docs/plans/roadmap-milestones.md`, `docs/plans/backlog/{experience,ops-qa-launch,data-cms-owner}.md`.
- **note**: duplicates closed after planning: #65 (-> #54), #77 (-> #55, #57), #84 (-> #63). #37 and #51 kept (umbrella vs footer-link restore).
- **note**: the board backup (`board-backup-2026-11-19.json`) is intentionally not committed: it is a stale snapshot with board item IDs.
- **note**: several PR references in the docs changed the same day (#5 -> #86, #16 -> #85, #9 closed); a status note at the top of the roadmap and Ops backlog docs maps them.
- **request**: owner: add Project 3 views (Roadmap grouped by Milestone; Board by Delivery stage; Table grouped by Lane; Owner queue), which cannot be created from the CLI.
- **request**: senior QA: `docs/plans/PROGRESS.md` consolidation (#75); owner decisions are collected in #54, #55, #57 and the three backlog docs.
