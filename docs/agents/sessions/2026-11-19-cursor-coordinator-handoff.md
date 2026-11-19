# Session log: cursor / coordinator handoff (2026-11-18 to 2026-11-19)

Cursor acted as Experience builder, PM/coordinator, Ops stand-in and senior QA coordinator, using subagents. This log records state, decisions and tooling quirks for the next fresh sessions (Claude, Cursor, Codex).

## State at handoff
- `main` carries: draft-handoff public site (#24), motion (#25), sitemap (#27), GTM `GTM-PRJX6P9H` production-only (#28), JSON-LD (#29), Data RC2 (#12), carry-over replacements (#85 #86 #87 #89 #21), planning docs (#88 #92 #93). 91 tests.
- Draft PRs held for Preview verification (checklist on issue #41): #15 -> #18 -> #23, #90 (base #15), #96 (base #90), #95 (base #23).
- Closed as superseded: #5 (by #86), #9, #14 (by #87), #16 (by #85), #20 (by #89), plus #8/#17/#19/#22 earlier.
- Board (Project 3): fields Delivery stage, Status, Lane, Agent, Priority, Size, Release, **Batch** (3-6, Owner track, Post-MVP), Milestone (M1-M5), Merge order, Stacked on, Next action. Next work: `docs/agents/assignments/2026-11-19-batch-3.md`.

## Decisions (owner)
Postgres shared limiter; newest-featured announcement wins; GTM `GTM-PRJX6P9H`, no consent notice for now; native email forms replace Google Forms in `AGENTS.md` (approved 2026-11-19); reserved **system actor** rows for automated publishing (#94); redirects `/expresso` 301 to `/plan-a-visit#services`, `/prayer` and `/volunteering` 302 to `/get-connected` decided, not built (#63).

## Learned rules (apply them)
- **`main` = production.** Never merge the Data stack before the Preview checklist passes: shared-password admins lock out, and without `RATE_LIMIT_HASH_SECRET` + migration `20261118010000` feedback and staff sign-in return 503.
- **Never add `loading.tsx` over a detail route** (`[slug]`): it turned real 404s into 200 + `noindex` (caught by QA on #25). Test unknown detail slugs on a production build.
- **Squash-merge breaks stacked bases.** Retarget with `gh api -X PATCH repos/aidenkiefer/thrive/pulls/N -f base=main`, branch from `origin/main`, and copy files with `git checkout <old-branch> -- <paths>` (verified procedure in `docs/agents/qa/2026-11-19-data-stack-and-cms-slice.md`). `git rebase --onto` fails on these merge-heavy histories.
- **`gh pr edit` fails** (Projects classic). Use `gh api -X PATCH repos/aidenkiefer/thrive/pulls/N -F body=@file`. `gh` needs full network permission in the Cursor sandbox.
- **Project 3 IDs:** project `gh project view 3 --owner aidenkiefer --format json --jq .id`; Delivery stage field `PVTSSF_lAHOCMzXu84BsQ5Gzhqf1lc` (Backlog `276935ff`, Ready `1f7ce36d`, In progress `fae7cda0`, In review `03436ca4`, Blocked `77f66906`, Done `69440ce1`); Status field `PVTSSF_lAHOCMzXu84BsQ5Gzhqf1JI` (Todo `f75ad846`, In Progress `47fc9ee4`, Done `98236657`); Batch field `PVTSSF_lAHOCMzXu84BsQ5GzhqhZIA` (option IDs change if the field is edited: re-read with `gh project field-list`).
- **Worktrees:** `node_modules` is shared by symlink to `../cursor-experience-draft-handoff/node_modules`; never `git add` it; delete the symlink and `tsconfig.tsbuildinfo` before committing. Do not delete that worktree until nothing links to it (or reinstall). Remove a worktree after its PR merges.
- **Colocated tests** (`src/**/*.test.ts`) are discovered since #27; `*.test.*` files are Ops-owned by pattern but lane builders may add tests for their own code when the assignment says so.
- **Never invent ministry data.** Photos still hot-link `thrivevineyard.com/wp-content/uploads` (P0 before WordPress retires; #59, #73).

## Open loose ends
Owner checklists #54 #55 #57; Project 3 views to add in the UI (Roadmap by Milestone, Board by Delivery stage filtered to the active milestone, Table by Lane, Owner queue); confirm the Ads tag sits inside `GTM-PRJX6P9H`; local-only branch `codex/integration-check-2026-11-18` (decide keep/delete, #30); `PROGRESS.md` is current as of 2026-11-19.
