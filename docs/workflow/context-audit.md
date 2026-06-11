# Context Audit Guide

**Purpose:** Systematically verify that reference documents are accurate, consistent, complete, and up-to-date. Run quarterly or after major structural changes.

---

## When to Run

- **Quarterly:** Every 3 months
- **After major changes:** New architecture, renamed files, new integrations, deprecated patterns
- **Before a major sprint:** Ensure reference docs are reliable
- **When agents cite wrong paths or stale info:** Reactive trigger

---

## Audit Scope

### Standard workflow docs (always audit)

| Doc | Location |
|-----|----------|
| Project memory | `.claude/CLAUDE.md`, `CLAUDE.md` |
| Workflow entrypoint | `docs/workflow/workflow.md` |
| Execution rules | `docs/workflow/execution-rules.md` |
| Ticket template | `docs/workflow/ticket-template.md` |
| Skill map | `docs/workflow/skill-map.md` |
| Task-type reference map | `docs/workflow/task-type-reference-map.md` |
| Context flow | `docs/workflow/context-flow.md` |
| Claude optimization | `docs/workflow/claude-opt.md` |

### Project-specific reference docs

| Doc | Location |
|-----|----------|
| Architecture vision | `floorplan.md` |
| Project brief | `docs/00-project-brief.md` |
| Information architecture | `docs/03-information-architecture.md` |
| Content models | `docs/05-content-models.md` |
| Integrations | `docs/06-integrations.md` |
| SEO migration map | `docs/04-seo-url-migration-map.md` (pending) |
| Design system | `docs/07-design-system.md` (pending) |
| Database schema | `supabase/schema.sql` |
| Doc index | `docs/INDEX.md` |
| Progress log | `docs/plans/PROGRESS.md` |

---

## Audit Criteria

| Dimension | Questions |
|-----------|-----------|
| **Accuracy** | Do file paths, routes, table names, and env var names still match the codebase? |
| **Consistency** | Do docs agree with each other? Do route names in `03-information-architecture.md` match what's in `src/app/`? |
| **Completeness** | Are new tables from `supabase/schema.sql` reflected in `05-content-models.md`? New routes in the IA doc? |
| **Clarity** | Is the doc understandable to an agent with no prior context? |
| **Relevance** | Is any content obsolete (WordPress-era patterns, planned-but-removed tables)? |

---

## Audit Process

1. **Define scope** — list docs to audit this session (10–25 max)
2. **Read and assess each doc** — compare against actual codebase (spot-check file paths, route names, table names)
3. **Check cross-references** — do paths in one doc match where files actually are?
4. **Classify issues** — Outdated / Missing / Inconsistency / Broken link / Obsolete / Low clarity
5. **Prioritize and ticket** — High (fix this sprint), Medium (this quarter), Low (ongoing)
6. **Write audit results** → `docs/workflow/audits/audit-results-[YYYY-MM].md`

---

## Audit Checklist Template

```markdown
### [Document Name]

- **Location:** [path]
- **Last updated:** [date or "unknown"]
- **Status:** ✅ Sufficient / ⚠️ Needs Update / ❌ Missing or Broken

**Accuracy:** [Notes]
**Consistency:** [Notes]
**Completeness:** [Notes]
**Clarity:** [Notes]
**Relevance:** [Notes]

**Issues found:**
- [Issue 1 — priority: High/Medium/Low]

**Recommended actions:**
- [Action 1]
```

---

## Maintenance Schedule

| Cadence | Trigger | Scope |
|---------|---------|-------|
| **Quarterly** | Calendar | Full audit of all core reference docs |
| **Post-major-change** | New route group, new Supabase table, new integration | Affected docs + cross-references |
| **Pre-sprint** | Before a high-cost sprint | Docs used by that sprint's tickets |
| **Ad hoc** | Agent cites wrong path or stale info | That doc + related docs |

---

## Success Criteria

- [ ] All High-priority issues ticketed
- [ ] At least one doc updated per audit session
- [ ] Audit results saved to `docs/workflow/audits/`
- [ ] `context-flow.md` updated if structural changes found
- [ ] `docs/INDEX.md` updated if new or removed docs found
- [ ] `task-type-reference-map.md` updated if doc paths changed
