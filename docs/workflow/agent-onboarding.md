# Open Thrive in Codex, Cursor, or Claude Code

Open the repository or your lane worktree as the workspace root. In Windows, use Cursor's Editor Window connected to Ubuntu and open the Linux path. From Ubuntu, `cd ~/projects/thrive && cursor --classic .` opens that workspace. Use an Ubuntu integrated terminal so the editor and shell work on the same files. Start implementation in the lane worktree described in [the workflow](workflow.md).

| Tool | Entry point | Shared skills |
|---|---|---|
| Codex | [AGENTS.md](../../AGENTS.md) | `.agents/skills/` |
| Cursor | [Core rule](../../.cursor/rules/00-core.mdc) and [AGENTS.md](../../AGENTS.md) | `.agents/skills/` |
| Claude Code | [CLAUDE.md](../../CLAUDE.md) imports `@AGENTS.md` | `.claude/skills` points to `.agents/skills` |

For local development, clone `skills` and `workflow-core` into `~/projects` beside Thrive. Keep Thrive's own `AGENTS.md` and `docs/workflow/` as the project instructions. Read shared skills and templates as needed from the sibling repos.

- **Cursor:** the repository's `thrive.code-workspace` includes both sibling directories when opened from the main checkout. For an isolated worktree, use a local multi-root workspace that points at the worktree and the two absolute WSL paths. The local `~/projects/thrive-agents.code-workspace` opens the planning worktree this way.
- **Claude Code:** from the Thrive worktree, run `claude --add-dir ~/projects/skills --add-dir ~/projects/workflow-core` and open any relevant external skill by its file path. Keep Thrive as the session's working directory.
- **Codex:** use the same Ubuntu paths from a WSL shell, or access them from Windows under `\\wsl.localhost\Ubuntu\home\aidenkiefer\projects`. Keep edits on the assigned Thrive branch.

The four tracked skills are `product-manager`, `lane-builder`, `scribe`, and `senior-qa`. Read the relevant skill and its linked template or reference in the same checkout. The [skill map](skill-map.md) lists optional libraries. If a named optional skill is absent, use the relevant repository docs and primary vendor references. Mark the missing reference in the ticket when it affects the result.

On Ubuntu, `claude --version` checks the installation. Use `claude auth login` for interactive sign-in and `claude auth status` to verify it. In a fresh agent session, ask it to identify the canonical instructions, name the four skills, and locate the assignment template. Claude Code's `/memory` shows loaded instruction files, and the Cursor Agent slash menu can confirm skill discovery.

Use Node 22 and the committed npm lockfile. With Node active in your Ubuntu terminal, run `npm ci` and `scripts/agents/gate.sh`. Consult [admin setup](../admin-setup.md) for local runtime variables and the planning checklist before pointing a checkout at a shared service.
