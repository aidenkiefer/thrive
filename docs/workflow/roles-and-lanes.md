# Roles and lanes

**Purpose:** Define who does what, and which files each agent may touch, so three agents can work in parallel without merge conflicts or duplicated effort.

---

## 1. Roles

| Role | Runs as | Skill | Owns (writes) | Never does |
|---|---|---|---|---|
| **Owner** (you) | Human | — | Priorities, approvals, merges to prod | — |
| **Product manager (PM)** | Fresh session in any tool, heavy model | `product-manager` | `docs/agents/assignments/*`, new tickets | Writes app code |
| **Lane builder** ×3 | Claude Code, Cursor, Codex, each in its own worktree | `lane-builder` | Files in its lane + its own session log | Edits another lane's files, merges its own PR |
| **Scribe** | Subagent (fast model) called by any builder or QA | `scribe` | Session logs, PR bodies, `PROGRESS.md` (only when QA calls it) | Writes code, invents facts |
| **Senior QA engineer** | Fresh session, heavy model, main checkout or QA worktree | `senior-qa` | Merges, `docs/plans/PROGRESS.md`, `docs/agents/qa/*` | Merges without your "go" |

Roles are **per session, not per tool.** Any tool can run PM or QA. Builders are always three separate tools so that every lane has its own context, its own usage quota, and its own model family.

---

## 2. Lanes (Thrive Vineyard)

Each lane owns paths. **A file belongs to exactly one lane.** If a path below is ambiguous, the assignment file settles it.

### Lane `data`: Data & Platform
Correctness-critical backend: schema, import/migration, queries, auth, admin CRUD.

- `supabase/**`
- `src/lib/**` (except `src/lib/mdx.ts`)
- `src/app/admin/**`, `src/components/admin/**`
- `src/app/api/**`, `src/middleware.ts` / `middleware.ts`
- `scripts/**` (except `scripts/agents/**`), `migration-files/**`
- `.env.local.example`

### Lane `experience`: Public Experience
Everything a visitor sees: pages, components, design system, MDX content.

- `src/app/(public)/**`, `src/app/page.tsx`, `src/app/[slug]/**`
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/not-found.tsx`, `src/app/error.tsx`
- `src/components/**` (except `src/components/admin/**`)
- `content/**`, `src/lib/mdx.ts`, `public/**`
- `tailwind.config.ts`, `postcss.config.js`

### Lane `ops`: Ops, SEO & Quality
Shipping safely: redirects, SEO plumbing, CI, tests, tooling, docs.

- `next.config.ts` (redirects, headers), `src/app/sitemap.ts`, `src/app/robots.ts`
- `.github/**`, `scripts/agents/**`, test files (`**/*.test.*`, `e2e/**`), test config
- `package.json`, `package-lock.json`, `tsconfig.json`, lint config
- `docs/**` (except `docs/agents/sessions/*` and `docs/plans/PROGRESS.md`), `AGENTS.md`, `CLAUDE.md`, `.agents/**`, `.claude/**`, `.cursor/**`

### Shared artifacts (never lane-owned)

| File | Single writer |
|---|---|
| `docs/agents/sessions/<date>-<tool>-<slug>.md` | The branch it belongs to (through its scribe) |
| `docs/plans/PROGRESS.md` | Senior QA only, at merge time |
| `docs/agents/assignments/*` | PM only |
| `docs/agents/qa/*` | Senior QA only |

---

## 3. Hot files

Hot files attract conflicts because every lane wants them. The assignment names **one owner per hot file per session**. Everyone else files a cross-lane request instead of editing.

| Hot file | Default owner | Typical request from others |
|---|---|---|
| `package.json` / `package-lock.json` | ops | "add dependency X@^1.2" |
| `supabase/schema.sql` | data | "need column Y on table Z" |
| `src/lib/supabase/types.ts` | data | regenerate after a schema change |
| `src/lib/queries/index.ts` | data | "export getFoo()" |
| `next.config.ts` | ops | "redirect /old → /new" |
| `src/app/layout.tsx`, `tailwind.config.ts` | experience | "add font / token" |

**Cross-lane request:** `scribe log request: <lane> needs <exact change> because <reason>`. QA collects open requests in its report and the PM schedules them. If the request blocks you today, tell the owner (human) so they can relay it. Never "just make the one-line edit" in someone else's lane.

---

## 4. Interfaces between lanes: land contracts early

The common dependency is experience → data, for example a page that needs a new query.

1. The **PM writes the contract** into the assignment: function name, arguments, return type, and the file it lives in.
2. The **provider lane's first ticket is the contract.** It builds the real function (minimal but correct) and opens a small PR at once, marked `contract`.
3. **QA or the owner fast-merges the contract PR** after its gate passes, without waiting for end of session.
4. The **consumer lane** runs `git fetch && git rebase origin/main` and builds on the merged function.
5. Until the contract lands, the consumer works on its other tickets. It never stubs inside the provider's paths.

If the contract can't land early, the PM moves the consumer ticket to the next session. Waiting idle on another lane is a planning bug.

---

## 5. Default tool ↔ lane fit

The PM may override these. They come from each tool's strengths, not from a hard rule.

| Tool | Best-fit lane | Why |
|---|---|---|
| **Claude Code** | `data` | Strongest at multi-step reasoning over schema, auth, and migrations. Native subagents, skills with per-skill model routing, worktree-isolated subagents. |
| **Cursor** | `experience` | IDE with live diff review, browser tool for visual checks, best-of-N across models for UI variants, plan mode saved to `.cursor/plans/`. |
| **Codex** | `ops` | Good at long autonomous well-specified runs (redirect tables, CI, tests, scripts). Built-in `/review` makes it a cheap second-opinion reviewer. |

**Rotate when it helps:** for a UI-heavy sprint with no ops work, give Codex a second, cleanly separated experience sub-area (for example `src/app/(public)/sermons/**`) and split the experience lane's paths in the assignment.
