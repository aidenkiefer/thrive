# Git, worktrees, PRs, and merging

**Purpose:** One agent = one worktree = one branch. This doc holds the naming rules, the setup script, commit and PR conventions, and the merge policy QA follows.

---

## 1. The golden rule: never share a checkout

Two agents in one working directory will overwrite each other's branch switches, staged files, and edits. This happened in this repo on 2026-11-07: Codex switched the shared checkout to its branch while Claude was editing docs there.

- The **main checkout** (`~/projects/thrive`) belongs to the **human and senior QA only**.
- Every builder works in its own worktree under `../thrive-worktrees/`.
- **Before the first edit of every session**, a builder runs `git branch --show-current && pwd` and confirms the branch starts with its own tool prefix. If it doesn't, the builder stops and fixes the setup before editing anything.

---

## 2. Naming

| Thing | Pattern | Example |
|---|---|---|
| Branch | `<tool>/<lane>-<slug>` | `claude/data-mec-importer`, `cursor/experience-about-team`, `codex/ops-redirects` |
| Tiny fix branch | `<tool>/fix-<slug>` | `cursor/fix-footer-link` |
| Worktree dir | `../thrive-worktrees/<tool>-<lane>-<slug>` | `../thrive-worktrees/codex-ops-redirects` |
| Session log | `docs/agents/sessions/<YYYY-MM-DD>-<tool>-<lane>-<slug>.md` | `…/2026-11-08-codex-ops-redirects.md` |

`<tool>` is always one of `claude`, `cursor`, `codex`, chosen by **which tool does the work**, not which model. Slugs are kebab-case, 2–4 words.

---

## 3. Creating worktrees

Use the script. It enforces naming, branches from fresh `origin/main`, copies `.env.local`, and installs dependencies:

```bash
scripts/agents/worktree.sh new claude data-mec-importer
scripts/agents/worktree.sh new cursor experience-about-team
scripts/agents/worktree.sh new codex  ops-redirects
scripts/agents/worktree.sh list
```

Then open each tool **in its worktree folder**:

| Tool | How to start in the worktree |
|---|---|
| Claude Code | `cd ../thrive-worktrees/claude-… && claude` |
| Cursor | File → Open Folder → the worktree dir (a separate window per worktree) |
| Codex | Open the worktree dir as the project/workspace in the Codex app or CLI |

**Why not each tool's built-in worktree feature?** Each tool names branches its own way: Claude's `--worktree` makes `worktree-<name>`, and Cursor and Codex auto-name theirs. Our tool-prefix rule is what lets QA tell at a glance who wrote what. Built-in worktrees are still fine for a **subagent's** temporary scratch work inside a lane (for example Claude's `isolation: worktree`), because those branches never become PRs.

**Cursor caveat:** Cursor's worktree cleanup (`cursor.worktreeMaxCount`, default 25) can delete worktrees it didn't create. Push your branch at least at every checkpoint. The branch is durable; the worktree is disposable.

---

## 4. Commits

- **Atomic and frequent:** one logical change per commit, and at least one commit per ticket.
- **Format:** `<type>(<lane>): <summary>`, where `<type>` is one of `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, or `ci`. Example: `feat(data): import MEC JSON events with DST-safe times`.
- **Never commit:** `.env*` (except `.env.local.example`), `*:Zone.Identifier`, `__pycache__/`, worktree folders, or large raw exports unless the ticket says so.
- Before each commit, run `git status --short` and stage paths explicitly (`git add <paths>`, not `git add -A`). An out-of-lane path showing up in status is a red flag: stop and check.

---

## 5. Pull requests

1. **Gate first:** `scripts/agents/gate.sh` must pass. See [devops-automation.md](./devops-automation.md).
2. Push: `git push -u origin <branch>`.
3. Generate the body with `scribe pr`, then run `gh pr create --base main --title "[<lane>] <summary>" --body-file <path>`.
4. Open as **draft** if anything in the assignment is unfinished, and mark ready only when the lane's done criteria are met.
5. **Contract PRs** (see roles-and-lanes §4) use the title prefix `[contract]` and should be under 150 changed lines.
6. Builders **never merge their own PRs.**

The PR template (`.github/pull_request_template.md`) is the shape QA expects.

---

## 6. Merge policy (senior QA)

- **Order:** follow the assignment's merge order, which is usually contracts → data → experience → ops.
- **Strategy:** squash-merge (`gh pr merge <n> --squash --delete-branch`). Each PR becomes one revertable commit on `main`.
- **After each merge:** the next branch rebases on `origin/main` and re-runs the gate before it merges. Lanes don't share files, so rebases should be conflict-free. A conflict means a lane boundary was crossed, and QA records it in the report.
- **`main` deploys to production** (Vercel). QA presents the merge plan and waits for the human's explicit "go" before the first merge of a batch.
- **Rollback:** `git revert <squash-sha>` and open a PR. Never force-push `main`.

---

## 7. Cleanup

```bash
scripts/agents/worktree.sh remove codex ops-redirects   # one worktree, keeps branch if unmerged
scripts/agents/worktree.sh prune                         # removes worktrees whose branch is merged
```

QA runs `prune` at the end of each session. Unmerged branches are kept and listed in the QA report as carry-over.
