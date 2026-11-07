# Model routing: right model, right effort, right cost

**Purpose:** Heavy models for heavy thinking, cheap models for grunt work. Every agent picks a **tier** per ticket and switches when the work changes.

> **Model names go stale fast.** The tiers are stable; the names in §2 were checked on 2026-11-07. If a name isn't in your picker, use the closest model in the same tier and update this table (an ops-lane docs ticket).

---

## 1. Tiers

| Tier | Use for | Signal you're in this tier |
|---|---|---|
| **T0 Fast** | Scribe logs, PR bodies, PROGRESS entries, file moves, renames, copying data into tables, formatting, simple copy edits | You could write exact step-by-step instructions |
| **T1 Standard** *(default)* | Implementing a well-specified ticket, UI components, queries against a known schema, tests, redirect tables, CI config | Scope is clear and patterns exist in the repo |
| **T2 Heavy** | PM planning, senior QA review, schema or auth design, migration mapping, cross-cutting refactors, debugging when the root cause is unknown | Ambiguity, irreversible decisions, or "why is this broken?" |
| **T3 Max** | Architecture decisions, security audits, a bug that survived one T2 attempt, long autonomous hard runs | Getting it wrong costs days. **Ask the owner first** (usage-heavy) |

---

## 2. Tool mapping (checked 2026-11-07)

| Tier | Claude Code | Codex | Cursor |
|---|---|---|---|
| T0 | `haiku`, effort `low` | GPT-6 Astra, effort Light (`low`) | A fast model: Auto or Cursor's in-house fast model, or Haiku / Astra if listed |
| T1 | `sonnet`, effort `medium` | GPT-6 Luna, effort High (official starting point) | Sonnet or GPT-6 Luna |
| T2 | `opus`, effort `high`, or `opusplan` (Opus plans, Sonnet executes) | GPT-6.1 Sol, default effort | Opus or GPT-6.1 Sol |
| T3 | `fable` / `best` if your plan has it, else `opus` at `xhigh` | GPT-6.1 Sol, Extra High | Opus / Sol at max thinking |

**How to switch**

- **Claude Code:** `/model <alias>` and `/effort <level>`. Press `s` in the `/model` picker to apply the choice to this session only. Skills and subagents can pin their own `model` and `effort` in frontmatter; the `scribe` skill pins `haiku`/`low`.
- **Codex:** use the model picker or `/model`, with effort set beside it. Personal defaults go in `~/.codex/config.toml`.
- **Cursor:** use the model dropdown in the agent panel. For hard UI choices, run **best-of-N** across two model families and pick a winner.

---

## 3. Routing rules

1. **Start at the lowest tier that can plausibly succeed.** T1 is the default for implementation tickets.
2. **Escalate once, on evidence:** after one failed attempt, a wrong assumption you discover, or a decision that's hard to reverse (schema, auth, data migration, URL structure). Log it: `scribe log note: escalated to T2, <reason>`.
3. **De-escalate after the thinking is done.** Plan on T2, then execute on T1 (`opusplan` does this for you in Claude Code). Don't implement a fully specified plan on Opus.
4. **Never run T0 work on T2/T3.** Docs, logs, PR bodies, and formatting always go to the scribe or a T0 subagent.
5. **Exploration goes to subagents.** Broad "find where X happens" searches go to a T0/T1 read-only subagent that returns paths and 3–6 bullets. Your main context, and your heavy model, stay clean.
6. **Cross-family second opinion for high-risk changes.** For auth, schema, migrations, or redirects, QA may ask a different model family to review (for example Codex `/review` on a Claude-written PR). Different families miss different things.
7. **Plan limits are a budget.** Claude Pro has a limited heavy-model allowance. Spend T2/T3 on PM, QA, and the hardest lane ticket, not on routine implementation. Each tool has its own quota, which is one reason the three lanes run on three different tools.

---

## 4. Default tier by activity (this repo)

| Activity | Tier |
|---|---|
| `product-manager` session | T2 |
| `senior-qa` review + merge decisions | T2 (T1 is fine for a docs-only PR) |
| `scribe` (all modes) | T0 |
| Schema change, RLS, auth, NextAuth config | T2 |
| WordPress/MEC import mapping (dates, recurrence, DST) | T2 to design, T1 to implement |
| Admin CRUD form following an existing pattern | T1 |
| New public page / component from an existing design system | T1 |
| Visual polish, copy placement, MDX content wiring | T1 (T0 for pure text moves) |
| Redirect table from an approved map, sitemap, robots | T1 |
| CI / GitHub Actions / scripts | T1 |
| Build failure with obvious error | T1; unknown root cause → T2 with `systematic-debugging` |
| PROGRESS.md, session summaries, PR descriptions | T0 |

---

## 5. Record what you used

Every session log entry for a finished ticket notes the tier and model (`T1 sonnet/medium`). QA reports where a tier was clearly too low (rework) or too high (trivial work on Opus). The PM uses that to calibrate the next assignment.
