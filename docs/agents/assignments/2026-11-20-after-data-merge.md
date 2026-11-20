# Assignment: 2026-11-20-after-data-merge

**Session goal:** Finish the pull requests already open, then start the next data and ops tickets on fresh branches from current `main`.
**Inputs read:** `docs/workflow/roles-and-lanes.md`; `docs/plans/PROGRESS.md` (current status only); open PRs #105, #111, #112, #113, #117, #119, #123, #124, #128, #129, #130; issues #71, #80, #94, #102; merges through #122 (`e49b146`).
**Owner approval:** approved 2026-11-20.

`main` now includes the staff role, attributed publishing, the publish guard, reserved slugs (including `thrive-flames`), and the revalidation helper. The live database already has `admin_staff_roles`, `publication_events`, and `published_at_guard`. The only staff account is an active admin. Its auth version was bumped, so the previous admin session is invalid.

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| data | claude | `claude/data-system-actors` | `../thrive-worktrees/claude-data-system-actors` | T2 |
| ops | codex | `codex/ops-dependency-triage` | `../thrive-worktrees/codex-ops-dependency-triage` | T1 |
| qa | cursor | existing QA worktree | `../thrive-worktrees/cursor-qa-merge-2026-11-20` | T1 |

Experience is empty. #124 is carry-over for QA. The photo-swap worktree is dirty and must not be pruned.

## Hot-file owners (this session)

| File | Owner lane |
|---|---|
| `package.json`, `package-lock.json` | ops |
| `supabase/schema.sql`, `src/lib/supabase/types.ts` | data |
| `next.config.ts` | nobody (do not edit) |
| `src/app/layout.tsx`, `tailwind.config.ts`, `src/components/layout/GlobalNav.tsx` | nobody (do not edit) |
| `eslint.config.mjs` | nobody (already in #130; QA merges it) |
| `docs/plans/PROGRESS.md` | qa |

## Contracts

None. QA's rebases of #119 and #123 cherry-pick the commits below and do not edit `supabase/schema.sql`. Data is the only writer of that file.

## Merge order

1. QA carry-over, in this order: #129, #130, #124, #111, #112, #113. Correct #128's `PROGRESS.md` (it still says the data stack is held) before merging it.
2. QA rebases and gates #119, then #123. Test-only commits: `478ee95` for #119; `00fbc73` then `4c1526c` for #123.
3. Data #94, after its gate.
4. Ops #71, after its gate.

#117 and #105 stay draft. Do not delete a remote branch that another open PR still uses as its base.

---

## This session's QA (Cursor)

No new feature branch. Rebase onto current `origin/main`, watch `scripts/agents/gate.sh` pass, then squash-merge. Do not use `--delete-branch` while a child PR still bases on that branch.

1. Merge #129, #130, #124, #111, #112, #113.
2. #128 claims the data stack is still held. Replace that with the merges through #122 before merging the docs PR.
3. Rebuild #119 from `478ee95` only, and #123 from `00fbc73` then `4c1526c`. Retarget each base to `main` with `gh api -X PATCH`. If either unique commit needs a `schema.sql` edit, stop and park it.
4. Close issues #102 and #80. The code and migrations are on `main`.

**QA done when:** those pulls are merged or parked with the failing command, and #117 and #105 are still draft.

---

## Lane: data, system actors and the insert guard

**Tool:** claude · **Branch:** `claude/data-system-actors` · **Default tier:** T2
**Owned paths:** `supabase/**`, `src/lib/cms/**`, `src/lib/admin-identities.ts`, `src/lib/admin-auth.ts`, `scripts/seed-current.ts`, `scripts/pglite-rehearsal/cms-rehearse.mjs`, this branch's session log
**Read first (≤3):** issue #94, `supabase/migrations/20261119010000_published_at_guard.sql`, `scripts/seed-current.ts`
**Out of scope:** #119, #123, and every branch that was force-pushed today. Do not apply the migration to the live database. Do not give a system actor a sign-in path.

### Tickets

**D1 · System actors and the INSERT guard** · M · T2
- Task: Add reserved system actor rows for automation, route seeding through `cms_set_published` as the seed actor, and refuse an INSERT that sets `published_at` outside that path. Staff lookups must not treat a system actor as a person who can sign in.
- Files: a new `supabase/migrations/*`, `supabase/schema.sql`, `src/lib/cms/**`, `src/lib/admin-identities.ts`, `src/lib/admin-auth.ts`, `scripts/seed-current.ts`, `scripts/pglite-rehearsal/cms-rehearse.mjs`
- Done when: system actors cannot sign in; a seed publish writes a `publication_events` row for the seed actor; an INSERT of non-null `published_at` outside that path fails; the PGlite rehearsal and the embedded-Postgres rehearsal cover it; the gate passes.
- Skills: `supabase-postgres-best-practices`

**Lane done when:** D1 is done or parked with the failing command, and the PR is open.

---

## Lane: ops, dependency triage

**Tool:** codex · **Branch:** `codex/ops-dependency-triage` · **Default tier:** T1
**Owned paths:** `package.json`, `package-lock.json`, `docs/06-integrations.md` (Dependency Notes only), `docs/ops/dependency-triage.md`, this branch's session log
**Read first (≤3):** issue #71, `docs/06-integrations.md` Dependency Notes, `package.json`
**Out of scope:** #130, #111, #112, #113, #117, `eslint.config.mjs`, `next.config.ts`, `.github/dependabot.yml`

### Tickets

**O1 · Dependency triage** · S · T1
- Task: Record a fresh `npm audit --package-lock-only` triage, apply non-breaking fixes only, and correct the stale `next-mdx-remote` note. Propose Dependabot in the doc. Do not add `.github/dependabot.yml` in this session.
- Files: `package.json`, `package-lock.json`, `docs/06-integrations.md`, `docs/ops/dependency-triage.md`
- Done when: the triage table lists every current finding with package, severity, direct or transitive, runtime or dev, fix available, and decision; `npm audit fix` was not run with `--force`; the Dependency Notes no longer say `next-mdx-remote` v5 is installed; the Dependabot proposal is weekly, grouped minor/patch, low open-PR limit, no auto-merge, label `lane:ops`; the gate passes.

**Lane done when:** O1 is done or parked with the failing command, and the PR is open.

---

## QA focus

- #94 is a live-database shape change. Review the migration and the sign-in exclusion before any later apply. Do not apply it today.
- #130's ESLint change must stay an error-level `no-restricted-imports` block for `src/app/**` and `src/components/**` only. It must not ban the server wrapper from `src/lib/**`.
- #128 must not republish the stale "data stack held" status.

## Owner decisions needed

- Dependabot: leave it as a written proposal this session. Enabling it opens PRs the owner has to route. (blocks: nothing, if O1 stays doc-only)
- Production smoke, owner only: sign in to `/admin` again, publish and unpublish one row, and send one feedback message. Preview env does not prove Production env.
