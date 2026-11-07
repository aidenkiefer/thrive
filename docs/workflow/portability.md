# Porting this workflow to another project

**Goal:** Reuse the multi-agent architecture (PM → 3 lanes → scribe → senior QA) on the next repo (e.g. the portfolio website) in under 30 minutes, and keep improvements flowing back.

---

## 1. What's generic vs project-specific

| Generic (copy as-is) | Project-specific (rewrite per repo) |
|---|---|
| `.agents/skills/{product-manager,lane-builder,scribe,senior-qa}/` | Lane definitions + hot files: `roles-and-lanes.md` §2–3 |
| `scripts/agents/worktree.sh`, `gate.sh` (adjust gate steps per stack) | Hard constraints in `AGENTS.md` |
| `docs/workflow/workflow.md`, `git-and-worktrees.md`, `model-routing.md`, `devops-automation.md`, `portability.md` | `task-type-reference-map.md`, `skill-map.md` Layer 3 |
| `.github/pull_request_template.md` (edit the constraint checklist) | `execution-rules.md` §3a |
| `.github/workflows/ci.yml` (edit env + runtime) | `.worktreeinclude` / `.cursor/worktrees.json` setup commands |
| `docs/agents/` structure | |

Thrive-specific text inside the generic skills is limited to example paths (`../thrive-worktrees/`) and the QA hard-constraint greps. The portfolio repo replaces those greps with its own list.

## 2. Port checklist

1. Copy the generic files (table above, left column) into the new repo.
2. Write `AGENTS.md`: mission (2 lines), stack, commands (dev/build/test), hard constraints, map. Keep it under ~60 lines.
3. `CLAUDE.md` = `@AGENTS.md` + Claude-only notes. `.cursor/rules/00-core.mdc` points to `AGENTS.md`.
4. `ln -s ../.agents/skills .claude/skills`
5. Define 2–3 lanes **by file paths** in `roles-and-lanes.md`. A small static site may only need two lanes (`content` and `experience`). Never create a lane just to keep a tool busy.
6. Edit `gate.sh` steps for the stack, and the CI env.
7. Run one PM → build → QA cycle with only 1–2 lanes, then read the QA report's **Workflow friction** section and adjust.

**Portfolio site hint:** likely lanes are `content` (MDX/project data, case studies: a good fit for Codex or a T0/T1 model), `experience` (layout, motion, design: Cursor), and `platform` (build, deploy, SEO, analytics: Claude). That repo already has `workflow-core/portfolio-extraction/` as an input source for the PM.

## 3. Upstream to workflow-core

`~/projects/workflow-core` is the canonical template home. Once this v2 workflow has run 1–2 real sessions here:

1. Copy the generic files into `workflow-core/docs/workflow/` and `workflow-core/agents-skills/` (or a similar folder).
2. Update `workflow-core/update-workflow.md` Mode A/B so new projects get v2 automatically.
3. Treat project repos as consumers. Fix generic issues in workflow-core first, then sync.
