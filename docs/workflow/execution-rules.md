# Execution rules (agent runtime)

**For:** Claude Code, Cursor, and Codex agents working in this repo.
**Goal:** Bounded, verifiable, conflict-free work at the lowest model cost that gets it right.

---

## 1. Two modes

| Mode | When | Unit of work | Docs |
|---|---|---|---|
| **Session mode** (default for real progress) | Owner runs a PM → build → QA cycle | A lane in an assignment (2–6 tickets) | `workflow.md`, `lane-builder` skill |
| **Solo mode** | A tiny fix or a one-off ticket | One ticket on `<tool>/fix-<slug>` | This file + `ticket-template.md` |

Both modes use the same branch naming, quality gate, and PR template.

## 2. Before the first edit (every session, every tool)

1. `git branch --show-current && pwd`: you're on **your** tool prefix (`claude/`, `cursor/`, `codex/`) in **your** worktree, never the main checkout (see `git-and-worktrees.md` §1).
2. You know your owned paths: the lane in the assignment, or the ticket's Allowed Files.
3. You picked a model tier for the first ticket (`model-routing.md`).

## 3. Context + tool budgets (by ticket size)

| Size | File reads | grep/glob | Total tool calls |
|---|---|---|---|
| **S** (one concern, 1–3 files) | 8 | 6 | 15 |
| **M** (one feature slice, 3–8 files) | 15 | 10 | 30 |
| **L** | Not allowed. Split it, or plan it on T2 first | | |

- Estimate before acting. If you'll blow the budget: in **solo mode**, stop and ask. In **session mode**, finish the part that stands alone, `scribe log blocker`, and move to the next ticket. Don't stall the lane.
- Prefer targeted reads (path + offset/limit). No whole-repo scans; delegate broad exploration to a cheap read-only subagent.
- Skills: the ticket names the pack (0–2 core, 0–2 domain). The four agent skills (`product-manager`, `lane-builder`, `scribe`, `senior-qa`) are always allowed.

## 4. Constraints (always in effect)

- **Edit only owned paths:** the lane's paths (session mode) or the ticket's Allowed Files (solo mode). Anything else is a cross-lane request (`roles-and-lanes.md` §3), never a quick edit.
- **Hot files** have one owner per session (named in the assignment).
- **Scope:** implement only what the ticket asks. Log follow-ups instead of doing them.

### 4a. Project-specific constraints

<!-- PRESERVE: Thrive Vineyard project constraints -->

**[PROJECT-SPECIFIC] No Supabase client in React components.**
All data fetching via Server Components using `src/lib/supabase/server.ts`. The browser client (`src/lib/supabase/client.ts`) is for client-side-only interactions (e.g., auth state listeners). No direct Supabase queries in JSX files unless they are server-only files.

**[PROJECT-SPECIFIC] Admin routes require NextAuth session.**
`src/middleware.ts` protects all `/admin/**` routes. Never implement an admin page without verifying it is inside the protected route group. Do not add bypass logic.

**[PROJECT-SPECIFIC] Never invent ministry data.**
Do not fabricate event dates, staff names, phone numbers, email addresses, ministry descriptions, or ChurchSuite form URLs. All content comes from the Supabase database, MDX files, or source exports, never from AI generation without owner approval.

**[PROJECT-SPECIFIC] SEO redirects for WordPress migration.**
Any route added or changed that differs from the existing WordPress URL structure must be accompanied by a 301 redirect entry in `next.config.ts` (ops lane owns it; others file a request). See `docs/04-seo-url-migration-map.md`.

**[PROJECT-SPECIFIC] ChurchSuite is forms only.**
The website stores a `churchsuite_form_url` field on entities and renders a link/button or embed for it. No API calls to ChurchSuite. No sync or import of ChurchSuite data. For a form ChurchSuite doesn't provide, an embedded Google Form is allowed (owner decision, 2026-11-07).

<!-- /PRESERVE -->

## 5. Verification

Cheap during work, mandatory at the boundaries. Full policy: `devops-automation.md` §1.

- **Before every push that opens or updates a PR:** `scripts/agents/gate.sh` → `GATE: PASS`. Never push a failing build. Report warnings separately from failures.
- During work: `scripts/agents/gate.sh --quick` only when it answers a real question.
- Not allowed: full builds after every edit, re-reading files after edits "to double-check", or idle dev servers.

## 6. Git hygiene

- Stage explicit paths (`git add <paths>`), never `git add -A`. Run `git status --short` before each commit.
- Commits: `<type>(<lane>): <summary>`, one per logical change, at least one per ticket. Push at least once per ticket.
- Never force-push shared branches, commit to `main` without the owner's approval, or merge your own PR.
- Leave the worktree clean at session end: everything committed or deliberately discarded, and no temp artifacts.

## 7. Documentation duties

| Who | Writes | Via |
|---|---|---|
| Lane builder | Its own session log (decisions, changes, blockers, requests) + PR body | `scribe` (T0) |
| Senior QA | `docs/plans/PROGRESS.md` entry + QA report | `scribe consolidate` + own review |
| PM | Assignment file | `product-manager` |
| Milestone / architecture change | `docs/plans/summaries/<YYYY-MM-DD>-<name>.md`, linked from PROGRESS | QA or PM |

**Builders never edit `PROGRESS.md`.** It's the most conflict-prone file in a parallel workflow; QA writes it once per session.

## 8. Anti-patterns

- **Shared checkout:** two agents in one directory. Each agent gets its own worktree.
- **Feature-split lanes:** splitting by feature instead of by files. Lanes are file ownership; features cross lanes through contracts.
- **"Just one line" in another lane:** file a request instead.
- **Heavy model on grunt work:** Opus or Sol writing logs, PR bodies, or renames. Use the scribe or a T0 subagent.
- **Light model on irreversible decisions:** schema, auth, migration mapping, URL structure. Escalate.
- **Kitchen-sink threads:** use `/clear` or a new chat between unrelated work. One chat per lane per session.
- **Re-attaching big specs every turn:** read once, then work from the assignment + Spec Summary.
- **Self-approval:** builders don't review or merge their own work. A separate, skeptical QA does.

## 9. Where things are

`docs/workflow/workflow.md` (entrypoint) · `roles-and-lanes.md` · `git-and-worktrees.md` · `model-routing.md` · `devops-automation.md` · `ticket-template.md` · `skill-map.md` · `task-type-reference-map.md` · `claude-opt.md` · `docs/agents/` (assignments, sessions, QA) · `docs/plans/` (specs, tickets, PROGRESS) · `docs/INDEX.md` · `docs/03-information-architecture.md` · `docs/05-content-models.md` · `docs/06-integrations.md` · `supabase/schema.sql`

Read only what the current ticket needs.
