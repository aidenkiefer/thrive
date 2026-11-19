# Assignment: Thrive MVP development kickoff

**Goal:** Start three non-overlapping lanes on the release candidate and the new staff and form workflows. Use the [MVP architecture](../../plans/specs/2026-11-18-mvp-development-architecture.md), [laptop handoff](../../plans/specs/2026-11-18-laptop-handoff.md), and [GitHub Project](https://github.com/users/aidenkiefer/projects/3). The planning baseline is `d9d7df4`. Confirm current branch heads at kickoff. This is a prepared assignment for the development phase.

| Lane | Tool and branch | Initial work |
|---|---|---|
| Data | Claude Code, `claude/data-mvp-foundations` | D1 staff actor and D2 native form registry/transport. Keep PR #12's existing admin edits in its carry-over branch. |
| Experience | Cursor, `cursor/experience-mvp-feedback` | E1 feedback page and reusable form from the agreed field contract. Resume E4 on the existing RC2 branch after the visitor changes are integrated or the affected files are explicitly reconciled. |
| Ops | Codex, `codex/ops-mvp-fixtures` | O1 own E4 fixtures and O2 prepare the URL/forms disposition matrix. Carry-over QA/merge stays with the separate QA role. |

## First batch

| ID | Ticket and owner | Allowed paths | Done when |
|---|---|---|---|
| D1 | Individual staff identity contract · Data · M | `src/lib/admin-auth.ts`, `src/lib/admin-identities.ts`, `src/app/api/auth/**`, `supabase/migrations/**`, `supabase/schema.sql` | A stable actor contract and fail-closed checks are available to protected callers. The transition from the shared account and provider choice are explicit. Real enrollment and cutover remain provisioned steps. |
| D2 | Native form registry and delivery boundary · Data · M | `src/lib/forms/**`, `src/app/api/forms/**` | F1 supports feedback fields, deduplicates the configured recipients server-side, and distinguishes invalid input from delivery failure. A fake transport can exercise the boundary. |
| E1 | Feedback page and form · Experience · S | `src/app/(public)/feedback/**`, `src/components/forms/**` | A visitor can identify and submit a bug or feature report. Form state stays usable after a validation error. Build the UI against F1 in parallel. Connect footer and admin navigation after the lane owners clear the shared file dependencies. |
| O1 | E4 render fixtures · Ops · S | `tests/**` | Fixtures cover configured schedule and approved form, absent values, and rejected URL. Pair the fixtures with the Experience renderer and use the landed ministry contract. |
| O2 | URL and form disposition matrix · Ops · S | `docs/plans/specs/**` for its own matrix | Map each launch-critical existing route and form to a canonical target or recorded owner input. Mark Youth Alpha redirect as gated on a 200 from a published destination. Keep external hosted forms and first-party email routes distinct. |

The Data lane owns server-side auth/form modules, all Supabase migrations, and admin routes. Experience owns its proposed public route and components. Ops owns `tests/**`, SEO config, and shared package changes. D1 and D2 use distinct files. Experience can build E1 from the documented fields and result states while Data implements D2. Ops can write the E4 fixture data and URL matrix before either is wired into app code.

## Carry-over and integration

1. Review [#12](https://github.com/aidenkiefer/thrive/pull/12) for invalid-save input loss and retain privacy migration review. Keep its admin edits separate from D1/D2. Stage auth and data changes only in the overlapping order agreed by QA.
2. Review [#8](https://github.com/aidenkiefer/thrive/pull/8) with its recorded mobile evidence and gate the Youth Alpha redirect. Rebase [#5](https://github.com/aidenkiefer/thrive/pull/5) afterward for the documented URL merge order. Reconcile [#9](https://github.com/aidenkiefer/thrive/pull/9) checkpoint wording with the current base and removed draft. The exact integration heads need QA.
3. Land the identity contract before CMS publishing and restore. Land the native delivery contract before enabling submission in the feedback UI. Wire the public footer and admin navigation with their owners. Leave additional editable pages and hosted sync outside this first batch.
4. The PM reconciles ticket and PR status at handoff. QA records verification and obtains the owner's production merge go through the existing workflow.

Open staffing and form-provider choices, approved church copy, and missing Preview environment values are provisioning inputs. Proceed with design and fixture-backed development without them. Avoid production writes or using production inboxes for verification.

## Start a lane

Use `scripts/agents/worktree.sh new <tool> <lane-slug> --no-install` from the Thrive checkout to start a new lane. The E4 implementation resumes on its already-published branch. Open the new worktree in the relevant tool, invoke `lane-builder`, and pass this assignment from the shared planning worktree if it has not yet landed on the base branch.

## Kickoff checkpoint — 2026-11-18

| Lane | Branch / PR | Current result | Next gate |
|---|---|---|---|
| Data D1/D2 | `claude/data-mvp-foundations` · [#15](https://github.com/aidenkiefer/thrive/pull/15) (draft) | Staff actor and native form contracts; QA's global-default-recipient correction pushed | Admin OIDC sign-in entry point before staff enrollment; real mail transport and configured sender/inbox before submissions can deliver |
| Experience E1 | `cursor/experience-mvp-feedback` · [#17](https://github.com/aidenkiefer/thrive/pull/17) (draft) | Public feedback UI with F1 result handling; Cursor authored the UI and Codex completed the gate/PR after Cursor's shell restrictions | Integrate #15, then wire footer/admin links and reserve the route in the campaign slug handler |
| Ops O1/O2 | `codex/ops-mvp-fixtures` · [#16](https://github.com/aidenkiefer/thrive/pull/16) (draft) | Hosted-form fixture/allowlist tests, expanded route/form matrix, Vitest discovery for colocated tests | Experience E4 must render the populated, absent, and rejected fixtures; confirm destination and form owner inputs |

The three branches merged cleanly into the **local-only** `codex/integration-check-2026-11-18` worktree. Its full `scripts/agents/gate.sh` passed: typecheck, 68 tests across five files (including D1/D2's colocated tests), lint with 12 existing warnings, and production build. This is a compatibility check, not a production merge or live form verification. `.env` values are still absent.

Carry-over remains: [#8](https://github.com/aidenkiefer/thrive/pull/8) has a Youth Alpha redirect whose Preview destination returned 404; [#5](https://github.com/aidenkiefer/thrive/pull/5) supplies the November URL/form inventory; [#9](https://github.com/aidenkiefer/thrive/pull/9) and [#12](https://github.com/aidenkiefer/thrive/pull/12) need QA reconciliation. Do not enable the Youth Alpha redirect before a published 200 destination exists. Resume E4 after the #8 ministry-page overlap is reconciled, then add render-level fixture checks. The PM keeps [GitHub Project 3](https://github.com/users/aidenkiefer/projects/3) aligned with these dependencies. Senior QA and the owner handle the production merge go under the existing workflow.
