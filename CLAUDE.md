@AGENTS.md

## Claude Code specifics

- **Skills:** `.claude/skills` is a symlink to `.agents/skills`, so `/product-manager`, `/lane-builder`, `/scribe`, and `/senior-qa` are available. `scribe` forks onto Haiku at low effort; PM and QA pin Opus at high effort.
- **Models:** switch per ticket with `/model` (press `s` for this session only) and `/effort`. Use `opusplan` to plan on Opus and execute on Sonnet. See `docs/workflow/model-routing.md`.
- **Worktrees:** create them with `scripts/agents/worktree.sh` (enforces `claude/` branch names), not `claude --worktree` (which names branches `worktree-*`). `isolation: worktree` subagents are fine for scratch work inside a lane.
- **Subagents:** read-only exploration on a cheap model; never give a subagent paths outside your lane.
- **Permissions:** don't edit `.claude/settings*.json` yourself. Suggest changes to the owner (`docs/workflow/devops-automation.md` §3).
