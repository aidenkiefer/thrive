# Assignment: <YYYY-MM-DD>-<session-name>

**Session goal:** <one sentence>
**Inputs read:** <docs, QA report, PRs consulted>
**Owner approval:** <pending | approved YYYY-MM-DD>

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| data | claude | `claude/data-<slug>` | `../thrive-worktrees/claude-data-<slug>` | T1 |
| experience | cursor | `cursor/experience-<slug>` | `../thrive-worktrees/cursor-experience-<slug>` | T1 |
| ops | codex | `codex/ops-<slug>` | `../thrive-worktrees/codex-ops-<slug>` | T1 |

<!-- Delete a row if that lane has no real work this session. -->

## Hot-file owners (this session)

| File | Owner lane |
|---|---|
| `package.json`, `package-lock.json` | ops |
| `supabase/schema.sql`, `src/lib/supabase/types.ts` | data |
| `next.config.ts` | ops |
| `src/app/layout.tsx`, `tailwind.config.ts` | experience |

## Contracts

| ID | Provider → consumer | Signature / shape | File | Lands by |
|---|---|---|---|---|
| C1 | data → experience | `getFoo(limit?: number): Promise<Foo[]>` | `src/lib/queries/foo.ts` | data ticket D1 (contract PR) |

## Merge order

1. Contract PRs (`[contract]`), fast-merged as they land
2. <lane>: <reason>
3. <lane>
4. <lane>

---

## Lane: data, <short title>

**Tool:** claude · **Branch:** `claude/data-<slug>` · **Default tier:** T1
**Owned paths:** <globs from roles-and-lanes §2, narrowed if possible>
**Read first (≤3):** <paths>
**Out of scope:** <tempting adjacent work that belongs elsewhere or later>

### Tickets

**D1 · <name>** · S · T1 · contract C1
- Task: <one sentence>
- Files: <paths>
- Done when: <verifiable statements>
- Skills: <0–2, e.g. postgres-best-practices>

**D2 · <name>** · M · T2→T1 (design on T2, implement on T1)
- Task:
- Files:
- Done when:
- Skills:

**Lane done when:** all tickets done or parked with a reason · gate passes · PR open with scribe body.

---

## Lane: experience, <short title>
<!-- same shape; ticket ids E1, E2… -->

---

## Lane: ops, <short title>
<!-- same shape; ticket ids O1, O2… -->

---

## QA focus

- <highest-risk area and what "correct" looks like>
- <hard constraint most at risk this session>

## Owner decisions needed

- <decision>: <recommended answer> (blocks: <ticket ids>)
