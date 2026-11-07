# DevOps and automation

**Purpose:** The mechanical checks that make parallel agent work safe to merge, plus automations that remove manual loops. If a rule can be enforced by a script, it lives here and not in prose.

---

## 1. Verification policy (replaces "no verification runs")

The old rule ("never run build/test") saved tokens for a single agent. With three agents merging into production, unverified pushes cost more than they save. The new policy is **cheap during work, mandatory at the boundaries:**

| When | What | Who |
|---|---|---|
| While working | Nothing by default. `scripts/agents/gate.sh --quick` (typecheck + lint) only when it answers a real question | Builder |
| **Before every push that opens or updates a PR** | `scripts/agents/gate.sh` must end with `GATE: PASS` | Builder |
| Before every merge | Gate on the branch **rebased on current `main`** | Senior QA |
| After the last merge | Gate on `main` | Senior QA |
| Every PR + push to `main` | Same gate in GitHub Actions (`.github/workflows/ci.yml`) | CI |

Still banned: re-running full builds after every edit, re-reading files after editing "to double-check", and starting dev servers nobody will look at.

**What the gate runs** (`scripts/agents/gate.sh`): `npm ci` if `node_modules` is missing → `tsc --noEmit` → `npm run lint` (once an ESLint config exists) → `npm run build`. It then prints the files changed vs `origin/main` for the scope check. Warnings are reported and don't fail the gate. Errors fail it.

---

## 2. CI (GitHub Actions)

`.github/workflows/ci.yml` runs the gate on every PR and on pushes to `main`.

**One-time owner setup:**

1. **Secrets** (repo Settings → Secrets and variables → Actions): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXTAUTH_SECRET`. Use read-only/public values. Don't add the service-role key unless the build truly needs it.
2. **Branch protection on `main`:** require the `CI / gate` check and disallow force-pushes. Through the UI (Settings → Branches), or:
   ```bash
   gh api -X PUT repos/aidenkiefer/thrive/branches/main/protection \
     -f required_status_checks[strict]=true -f 'required_status_checks[contexts][]=gate' \
     -F enforce_admins=false -F required_pull_request_reviews=null -F restrictions=null
   ```
3. **Vercel previews:** with the Vercel GitHub integration, every PR gets a preview URL. QA uses it for visual checks of experience-lane PRs, which is cheaper than running a local dev server.

---

## 3. Repo-level agent config (what lives where)

| File | Read by | Purpose |
|---|---|---|
| `AGENTS.md` | Codex, Cursor, Claude (via `@AGENTS.md` import in `CLAUDE.md`) | **Canonical** project brief + hard constraints. One source of truth |
| `CLAUDE.md` | Claude Code | Imports `AGENTS.md` and adds Claude-only notes |
| `.cursor/rules/00-core.mdc` | Cursor | Always-apply pointer to `AGENTS.md` + workflow |
| `.agents/skills/*` | Codex, Cursor (native); Claude via `.claude/skills` → symlink | Cross-tool skills: product-manager, lane-builder, scribe, senior-qa |
| `.worktreeinclude` | Claude Code | Copies `.env*` into Claude-created worktrees |
| `.cursor/worktrees.json` | Cursor | Setup commands for Cursor-created worktrees |
| `.github/pull_request_template.md` | GitHub, scribe | PR shape QA expects |
| `scripts/agents/worktree.sh`, `gate.sh` | Everyone | Worktree naming + quality gate |

**Suggested Claude Code permission allowlist.** The owner adds these to `.claude/settings.json`. Agents should not edit their own permission files. Running `/fewer-permission-prompts` can generate a similar list from your history.

```json
{ "permissions": { "allow": [
  "Bash(scripts/agents/gate.sh*)", "Bash(scripts/agents/worktree.sh list*)", "Bash(scripts/agents/worktree.sh status*)",
  "Bash(git status*)", "Bash(git diff*)", "Bash(git log*)", "Bash(git show*)", "Bash(git fetch*)", "Bash(git worktree list*)",
  "Bash(gh pr list*)", "Bash(gh pr view*)", "Bash(gh pr diff*)", "Bash(gh pr checks*)",
  "Bash(npx tsc --noEmit*)", "Bash(npm run build*)"
] } }
```
`git push`, `gh pr merge`, and anything touching `main` stay behind a prompt on purpose.

---

## 4. Automations worth adding (in order of payoff)

Build an automation only after the manual version has run cleanly 2–3 times. **The skill defines the method; the schedule only sets the timing.**

| Automation | Where | Cadence | What it does |
|---|---|---|---|
| **PR review assist** | Codex GitHub review or Claude Code GitHub Action | On PR open | First-pass review comment before senior QA; catches the obvious issues cheaply |
| **Repo health** | Claude routine (`/schedule`) or Codex Scheduled task | Weekly | `npm audit`, `worktree.sh status`, stale branches, PROGRESS.md vs merged PRs drift. Opens one `ops` issue or PR, never merges |
| **Docs drift check** | Same | Monthly | Runs `docs/workflow/context-audit.md` checks. Flags dead paths and stale model names in `model-routing.md` |
| **Dependency PRs** | Dependabot (`.github/dependabot.yml`) | Weekly, grouped | Only once CI is trustworthy, or it just adds noise |

## 5. Hooks (optional, later)

Hooks enforce rules deterministically, but only add one after the rule has been broken in practice:

- **Claude Code `PreToolUse` on Edit/Write:** refuse edits outside the lane's owned paths (read the lane from the session log header). This is the strongest lane guard, and worth adding if scope crossings show up in QA reports.
- **Cursor `stop` hook:** loop the agent until `scripts/agents/gate.sh --quick` passes (cap of ~5 iterations).
- **Pre-push git hook** (`.git/hooks/pre-push` → `scripts/agents/gate.sh`): blocks every tool from pushing a failing build. It's local to each clone, so the owner installs it.
