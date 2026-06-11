# Skill map — Layer 1: Workflow Process Skills

Skills are a **routing layer**, not "load the encyclopedia." The ticket names the exact skill(s) to invoke. Do not load any skills unless the ticket lists them.

**For domain skills and project-specific skills (Layers 2 & 3), see `task-type-reference-map.md`** — the "Skills" column for each task type lists the domain skills to invoke.

---

## Layer 1: Core workflow process skills

"How we work" patterns. Triggered by the **type of workflow event** (planning, debugging, reviewing), not by code domain.

| When | Skill | Description |
|------|-------|-------------|
| Starting a multi-step feature or sprint | `writing-plans` | Plan before code. Write a spec or implementation plan. |
| Clarifying requirements or design | `brainstorming` | Explore user intent, options, and design before implementation. |
| Executing a written implementation plan | `executing-plans` or `subagent-driven-development` | Follow the plan; checkpoint with review. |
| Implementing a feature or bugfix with tests | `test-driven-development` | Tests before implementation. |
| Any bug or test failure | `systematic-debugging` | Use before proposing any fix. |
| Before claiming work complete or merging | `verification-before-completion` | Verify against ticket criteria. |
| Completing a major feature or pre-merge | `requesting-code-review` | Request review; show evidence. |
| Responding to code review feedback | `receiving-code-review` | Verify feedback before implementing. |
| Creating or editing agent skills | `writing-skills` | Follow the skill-writing workflow. |

---

## Layer 2: Workflow management skills

| When | Skill |
|------|-------|
| Starting feature work that needs isolation | `using-git-worktrees` |
| Implementation is complete and ready to integrate | `finishing-a-development-branch` |
| Running multiple independent tasks in parallel | `dispatching-parallel-agents` |

---

## Layer 3: Domain skills — Thrive Vineyard project library

<!-- PRESERVE: Thrive Vineyard Layer 3 domain skills -->

**Last refreshed: 2026-06-11**

**Library root:** `~/projects/skills/`

### Frontend skills

| Skill | When to use | Path |
|-------|-------------|------|
| `frontend-design` | Building any React page, UI component, or layout — card designs, section layouts, hero sections | `~/projects/skills/frontend-design/SKILL.md` |
| `react-best-practices` | Server Components, client components, data fetching patterns, Suspense, Error Boundaries | `~/projects/skills/react-best-practices/SKILL.md` |
| `nextjs-app-router-patterns` | Route groups, ISR revalidation, layout nesting, catch-all routes, middleware | `~/projects/skills/nextjs-app-router-patterns/SKILL.md` |
| `tailwind-patterns` | Tailwind utilities, responsive design, design token usage, dark mode | `~/projects/skills/tailwind-patterns/SKILL.md` |
| `shadcn` | Installing/using shadcn/ui components (Button, Card, Dialog, Form, etc.) | `~/projects/skills/shadcn/SKILL.md` |
| `mobile-design` | Mobile-first layouts, touch targets, responsive breakpoints | `~/projects/skills/mobile-design/SKILL.md` |
| `seo` | Meta tags, Open Graph, JSON-LD structured data, sitemap, canonical URLs | `~/projects/skills/seo/SKILL.md` |

### Backend / Data skills

| Skill | When to use | Path |
|-------|-------------|------|
| `backend-dev-guidelines` | API routes, service layer patterns, error handling, input validation | `~/projects/skills/backend-dev-guidelines/SKILL.md` |
| `nextjs-supabase-auth` | NextAuth configuration, Supabase session integration, protected routes | `~/projects/skills/nextjs-supabase-auth/SKILL.md` |
| `postgres-best-practices` | Supabase queries, RLS policies, indexes, joins, pagination | `~/projects/skills/postgres-best-practices/SKILL.md` |

### Language / Tooling skills

| Skill | When to use | Path |
|-------|-------------|------|
| `typescript-pro` | Complex TypeScript types, generics, utility types, strict mode issues | `~/projects/skills/typescript-pro/SKILL.md` |
| `vercel-deployment` | Vercel config, env vars, ISR revalidation, redirects in next.config.ts | `~/projects/skills/vercel-deployment/SKILL.md` |

<!-- /PRESERVE -->

---

## Skill Map Refresh Protocol

**When to refresh Layer 3:**
- When writing a new spec that introduces a new technology not covered above
- When a ticket references a skill name with no entry in this map
- When running `update-workflow.md` Mode B
- When the tech stack meaningfully changes

**How to refresh:**
1. Identify gaps (new tech from PROGRESS.md or tickets)
2. Search: `ls ~/projects/skills | grep -i {term}`
3. Read candidate SKILL.md files (first 30–50 lines) to verify relevance
4. Add rows to the appropriate Layer 3 table
5. Update the "Last refreshed" date

**Do not add skills speculatively.** Only add for technologies actively in use.
