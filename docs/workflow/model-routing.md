# Model routing: right model, right effort, right cost

**Purpose:** Heavy models for heavy thinking, cheap models for grunt work. Every agent picks a **tier** per ticket and switches when the work changes.

> **Model names go stale fast.** The tiers are stable. The Claude and Codex columns were checked on 2026-11-07. The Cursor column was checked on 2026-11-20 for **legacy Cursor Pro** ($20/mo, two monthly pools). If a name isn't in your picker, use the closest model in the same tier and update this table (an ops-lane docs ticket).

---

## 1. Tiers

| Tier | Use for | Signal you're in this tier |
|---|---|---|
| **T0 Fast** | Scribe logs, PR bodies, PROGRESS entries, file moves, renames, copying data into tables, formatting, simple copy edits | You could write exact step-by-step instructions |
| **T1 Standard** *(default)* | Implementing a well-specified ticket, UI components, queries against a known schema, tests, redirect tables, CI config | Scope is clear and patterns exist in the repo |
| **T2 Heavy** | PM planning, senior QA review, schema or auth design, migration mapping, cross-cutting refactors, debugging when the root cause is unknown | Ambiguity, irreversible decisions, or "why is this broken?" |
| **T3 Max** | Architecture decisions, security audits, a bug that survived one T2 attempt, long autonomous hard runs | Getting it wrong costs days. **Ask the owner first** (usage-heavy) |

---

## 2. Tool mapping (Claude and Codex 2026-11-07, Cursor 2026-11-20)

| Tier | Claude Code | Codex | Cursor (legacy Pro) |
|---|---|---|---|
| T0 | `haiku`, effort `low` | GPT-6 Astra, effort Light (`low`) | Composer 2.5. Fast mode off. |
| T1 | `sonnet`, effort `medium` | GPT-6 Luna, effort High (official starting point) | Composer 2.5 for a patterned change. Grok 4.7 for several files or the browser. Fast mode off. |
| T2 | `opus`, effort `high`, or `opusplan` (Opus plans, Sonnet executes) | GPT-6.1 Sol, default effort | Grok 4.7 if this chat is already debugging. A fresh PM, QA, schema, or auth session runs in Claude Code or Codex. |
| T3 | `fable` / `best` if your plan has it, else `opus` at `xhigh` | GPT-6.1 Sol, Extra High | Not in Cursor. Claude Code or Codex, after the owner agrees. |

**How to switch**

- **Claude Code:** `/model <alias>` and `/effort <level>`. Press `s` in the `/model` picker to apply the choice to this session only. Skills and subagents can pin their own `model` and `effort` in frontmatter; the `scribe` skill pins `haiku`/`low`.
- **Codex:** use the model picker or `/model`, with effort set beside it. Personal defaults go in `~/.codex/config.toml`.
- **Cursor (legacy Pro):** use the model dropdown. Composer 2.5 and Grok 4.7 draw the Cursor Models pool. Claude, GPT, and Gemini draw the Other Models pool at API price, including when a subagent names one. Fast mode is 2x. Grok 4.7 over 256k input is 2x. Leave Fast off, and start a new chat per ticket. One layout bug that Grok 4.7 already missed may use Gemini 3.1 Pro. Log that spend. A second model family for everything else is a Claude Code or Codex session.

---

## 3. Routing rules

1. **Start at the lowest tier that can plausibly succeed.** T1 is the default for implementation tickets.
2. **Escalate once, on evidence:** after one failed attempt, a wrong assumption you discover, or a decision that's hard to reverse (schema, auth, data migration, URL structure). Log it: `scribe log note: escalated to T2, <reason>`.
3. **De-escalate after the thinking is done.** Plan on T2, then execute on T1 (`opusplan` does this for you in Claude Code). Don't implement a fully specified plan on Opus.
4. **Never run T0 work on T2/T3.** Docs, logs, PR bodies, and formatting always go to the scribe or a T0 subagent.
5. **Exploration goes to subagents.** Broad "find where X happens" searches go to a T0/T1 read-only subagent that returns paths and 3–6 bullets. Your main context, and your heavy model, stay clean.
6. **Cross-family second opinion for high-risk changes.** For auth, schema, migrations, or redirects, QA may ask a different model family to review (for example Codex `/review` on a Claude-written PR). Different families miss different things.
7. **Plan limits are a budget.** Claude Pro has a limited heavy-model allowance. Legacy Cursor Pro has two monthly pools, Cursor Models and Other Models, and they reset with the billing cycle. Spend Cursor's Other Models pool on a rare visual miss, not on Sonnet or Opus while Claude Code is already paid for. Spend T2/T3 on PM, QA, and the hardest lane ticket, not on routine implementation. Each tool has its own quota, which is one reason the three lanes run on three different tools.
8. **Cursor subagents inherit the bill.** A subagent launched from Cursor on a named Claude, GPT, or Gemini model draws Other Models even if the parent chat is Grok or Composer. Use Composer 2.5 or Grok 4.7 for those subagents.

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
