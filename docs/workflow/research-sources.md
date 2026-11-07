# Research behind workflow v2 (gathered 2026-11-07)

Primary sources first. Each line says what we took from the source and where it shows up in our workflow. Re-check the vendor docs during the quarterly context audit, because tool features move fast.

## Official vendor docs

| Source | Takeaway → where applied |
|---|---|
| [Claude Code: Skills](https://code.claude.com/docs/en/skills) | Skills load from `.claude/skills/` (not `.agents/skills`). Frontmatter supports `model`, `effort`, `context: fork`, `agent`, `background`. → scribe forks onto Haiku/low; PM/QA pin Opus/high; `.claude/skills` symlink |
| [Claude Code: Model configuration](https://code.claude.com/docs/en/model-config) | Aliases `haiku`/`sonnet`/`opus`/`opusplan`/`fable`/`best`. Effort `low`→`max`, default `medium` on 5.5 models. Subagents inherit the main model unless pinned. → `model-routing.md` |
| [Claude Code: Worktrees](https://code.claude.com/docs/en/worktrees) | `--worktree` makes `worktree-<name>` branches under `.claude/worktrees/`; `.worktreeinclude` copies gitignored env files; `isolation: worktree` for subagents. → our own script for `<tool>/` naming; `.worktreeinclude` |
| [Claude Code: Common workflows](https://code.claude.com/docs/en/common-workflows) | Parallel sessions via worktrees; plan mode; delegate research to subagents; scheduled tasks (routines, GitHub Actions). → lifecycle, automations |
| [Codex best practices](https://learn.chatgpt.com/guides/best-practices) | Prompts carry goal/context/constraints/done-when. Short AGENTS.md, add rules only after repeated mistakes. Skills in `.agents/skills`. Don't run live tasks on the same files without worktrees. `/review`. Scheduled tasks once workflows are stable. Model + effort guidance (GPT-6.1 Sol, GPT-6 Luna at High, GPT-6 Astra at Light). → ticket shape, AGENTS.md, model-routing, automations |
| [Cursor: Agent best practices](https://cursor.com/blog/agent-best-practices) | Rules in `.cursor/rules/`; add rules only after repeat mistakes; plan mode with saved plans; worktrees for parallel agents; compare models; Bugbot/Agent Review; hooks (`stop` loop). → Cursor lane fit, hooks section |
| [Cursor: Skills](https://cursor.com/docs/context/skills) | Loads `.agents/skills`, `.cursor/skills`, and for compatibility `.claude/skills`, `.codex/skills`. → `.agents/skills` as the canonical cross-tool location |
| [Cursor: Worktrees](https://cursor.com/docs/configuration/worktrees) | `.cursor/worktrees.json` setup commands with `$ROOT_WORKTREE_PATH`; cleanup cap `cursor.worktreeMaxCount` (25) can delete externally created worktrees. → push-per-ticket rule, `.cursor/worktrees.json` |

## Anthropic engineering

| Source | Takeaway → where applied |
|---|---|
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | A progress file plus git history lets fresh contexts re-orient. One feature at a time. Descriptive commits. Leave a clean, mergeable state each session. Verify before marking done. → session logs, ticket loop, gate |
| [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) | Planner / generator / evaluator split; "sprint contracts" agreed before coding; file-based handoffs; a **separate skeptical evaluator** beats self-evaluation; hard pass thresholds; drop harness parts as models improve. → PM / builder / QA roles, contracts, QA verdict thresholds, "stress-test the harness" in context audit |

## Community (lower trust, used only where consistent with official docs)

- [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice), [claudedirectory worktrees guide](https://www.claudedirectory.org/blog/claude-code-worktrees-guide), [devtoollab parallel agents guide](https://devtoollab.com/blog/claude-code-git-worktrees-parallel-agents-guide): start with 2–3 parallel agents; parallelism only pays with clean boundaries; every subagent pays its own startup context cost. → "never invent filler lanes", subagent rules
- [Model selection in Codex CLI](https://codex.danielvaughan.com/2026/03/26/codex-cli-model-selection/), [GPT-5 Codex model names explained](https://www.verdent.ai/guides/gpt-5-codex-model-names-explained): use cheaper "mini" models for subagents; effort is a setting, not a model. → T0 tier for subagents
- [Cursor rules vs AGENTS.md vs skills](https://webreference.com/ai/prompting/rules-vs-agents-vs-skills/): with more than one agent tool, prefer `AGENTS.md` and `.agents/skills/`. → single canonical `AGENTS.md`
