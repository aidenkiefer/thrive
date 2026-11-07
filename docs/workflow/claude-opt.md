# Claude optimization guide

**Purpose:** General guidelines for prompting Claude Code / Cursor / Codex agents so work stays **bounded, correct, and token-efficient**. Use when writing specs, tickets, multi-repo orchestration prompts, or any long agent session.

**Audience:** Humans writing prompts; **planning agents** (spec/ticket writers); **orchestration agents** (workflow sync, portfolio updates).

**Canonical location:** `~/projects/workflow-core/claude-opt.md`  
**Project copy:** `docs/workflow/claude-opt.md` in this repo.

**Official references:**
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices) — context window, concise CLAUDE.md, subagents, `/clear`
- [Reduce token usage](https://code.claude.com/en/costs#reduce-token-usage) — cost and context strategies

---

## 1. How context usage works

Claude's context window holds **the entire conversation**, **every file read**, and **every command/tool output**.

| Category | What it is |
|----------|------------|
| **Messages** | User + assistant turns, including **tool results** (file contents, `diff`, `grep`, bash output). Usually the largest share. |
| **File reads** | Often reported separately; those payloads still live inside the message stream. |
| **System prompt / tools / skills** | Fixed per session; harder to shrink; keep CLAUDE.md and enabled plugins lean. |

**Implication:** Cutting **narration** helps, but **fewer reads, smaller tool outputs, and shorter sessions** help more.

---

## 2. Session hygiene (highest leverage)

| Practice | When |
|----------|------|
| **`/clear` or new thread** | Switching unrelated work (different repo, different feature, planning → implementation). |
| **`/compact`** | Long threads after a subtask completes; summarizes history and drops accumulation. |
| **One session = one scope** | One ticket batch, one repo's sync — not "all repos + full narrative." |
| **Spec session → implementation session** | After specs/tickets are written, start fresh for execution with only the spec summary + ticket. |

---

## 3. Subagents for bulk work

Use **subagents** when a task requires many file reads or exploration.

**Pattern:**
- Main thread: goal, constraints, output format.
- Subagent (per repo / per investigation): reads files, applies edits, returns **≤10–15 lines** — paths changed, conflicts, blockers.

**Do not** paste full file bodies or large diffs back into the main thread unless the user asked for review.

---

## 4. File reads and tool output

| Do | Avoid |
|----|--------|
| Point to **specific paths** and line ranges | "Search the whole codebase" without scope |
| Use **`rg` with limits** for large files | Re-reading the same canonical doc every ticket |
| **Read once**, reference earlier in thread | Pasting entire task-type-reference-map into chat |
| **Offset/limit** on large reads | Full-file read of 500+ line docs when only one section changed |

`.gitignore` / `.claudeignore`: exclude `node_modules/`, `.next/`, build artifacts — accidental reads can cost tens of thousands of tokens.

---

## 5. Default output contract (for orchestration and planning)

Add these rules to **orchestration prompts** or project `CLAUDE.md` when you want minimal chatter:

```text
Context budget: prefer total assistant output under ~800 words unless blocked.

Default to silent execution: apply edits; do not stream full file contents or large diffs unless asked.

Reply format (unless user asks for more):
- Summary: up to 3 bullets
- Files changed: path list only
- Follow-ups: yes/no, one line each

No step-by-step play-by-play. No repeating the user prompt. No quoting canonical docs longer than 25 lines.
```

---

## 6. Planning agents: specs and tickets

| Rule | Why |
|------|-----|
| **Specs read once per session** → Spec Summary (10–20 lines) | Avoid re-attaching full specs every ticket turn |
| **Tickets name 1–2 required refs max** | Required refs load first; optional only within budget |
| **Shorter ticket = cheaper run** | Omit rules already in CLAUDE.md / execution-rules |
| **Name skill pack explicitly** (0–2 core, 0–2 domain) | No full skill registry |
| **Include output contract in multi-ticket batches** | e.g. "execute tickets; PROGRESS.md only; no implementation narration" |

---

## 7. Model choice

See **`model-routing.md`**: tiers T0 (fast) → T3 (max) mapped per tool, switching rules, and defaults by activity. The short version: heavy models plan, review, and debug unknowns; standard models implement; fast models (scribe) document.

---

## 8. Static context: CLAUDE.md and skills

- **`CLAUDE.md` loads every session** — keep minimal. Move occasional domain detail to skills (on-demand).
- **Do not load the full skill library** — only skills named on the ticket or listed in `skill-map.md` Layer 3.

---

## 9. Quick reference card

```
/clear     → new unrelated work
/compact   → long thread, same overall goal
Subagent   → many reads; main thread gets summary only
Reads      → path + line range; never re-read canonical docs
Output     → 3 bullets + file list + table
Specs      → once → Spec Summary → tickets
Skills     → ticket pack only; Layer 3 map for paths
Models     → model-routing.md tiers; T1 default; scribe on T0
Parallel   → one worktree per tool; artifacts (assignment → session log → PR → QA report), not shared edits
```

---

## 10. Multi-tool notes

- **One canonical brief:** `AGENTS.md`. Claude imports it from `CLAUDE.md`; Cursor's always-apply rule points to it. Don't duplicate rules across files; duplication drifts and costs tokens in every tool.
- **Codex:** prompts carry goal, context, constraints, and done-when (our compact ticket form). Use `/review` for second opinions and `/compact` for long chats.
- **Cursor:** plan mode (Shift+Tab) for M tickets; best-of-N across model families for UI choices; start a new chat when the agent repeats mistakes.
- **Every tool:** each subagent pays its own startup context. Spawn one only when it saves more context than it costs, which usually means broad reads or independent parallel work.

---

## Related workflow docs

| Doc | Role |
|-----|------|
| `docs/workflow/workflow.md` | Session hydration, specs vs tickets |
| `docs/workflow/execution-rules.md` | Budgets, anti-patterns, completion rules |
| `docs/workflow/ticket-template.md` | Bounded ticket shape |
| `docs/workflow/skill-map.md` | Skill paths + refresh protocol |
| `docs/workflow/task-type-reference-map.md` | Task types → refs, skills, agent types |
| `docs/workflow/context-flow.md` | What loads at startup vs per ticket |
