# Roadmap milestones (2026-11-19)

> **Status note (2026-11-19, after this doc was drafted).** #5 was replaced by #86 and #16 by #85 (both merged; originals closed); #9 was closed as superseded; #20 is being replaced by a smaller PR (render tests only); #14 is being replaced by a split draft PR. Duplicate issues #65, #77 and #84 were closed in favor of #54, #55/#57 and #63. `docs/10-launch-checklist.md` is now on `main` (via #86). Where this doc says "PR #5", "PR #16" or "#9", read the replacement above. #75 no longer waits on #9. The Data stack (#15, #18, #23) was rebased by Claude and is under QA.

Source of truth for scope: `docs/08-mvp-status-roadmap.md`, `docs/plans/PROGRESS.md`, GitHub milestones M1-M5 and Project 3. No due dates are set; the owner decides. Issue/PR numbers link on GitHub (`#N`). Facts only; unknowns are listed under "Owner decisions needed".

Board backup before converting draft cards: `docs/plans/board-backup-2026-11-19.json`.

## Milestones

| Milestone | Purpose | Exit criteria (full text in the GitHub milestone) |
|---|---|---|
| **M1 Pastor Draft Review** | Pastors can review the draft site | Draft-handoff frontend merged (#24); motion, sitemap, JSON-LD, GTM merged (#25, #27, #29, #28); Experience stack integrated (#58); owner shares Preview and collects content gaps (#55); signup render tests/fixtures (#16, #20) |
| **M2 Preview and Staff Ready** | Protected Preview staff can use | Pre-launch Supabase project (the production project, per 2026-11-19 owner decision) + migration rehearsal (#41, #60); individual staff email-code identities (#31, #15); form email to sandbox mailbox (#35, #18); shared Postgres limiter (#23); attributed publishing first slice (#32, #80); announcement expiry verified on Preview (#46) |
| **M3 Launch Readiness** | Church can approve a launch candidate | URL table complete and redirects tested (#52, #62, #63/#84); owner-approved page content and form URLs (#77); photos re-hosted (#59, #73); tracking confirmed (#57); QA, a11y, performance, go/no-go (#74, #61, #67) |
| **M4 Cutover and Stabilize** | Switch production and watch it | Approved cutover date/domain/rollback (#69); production schema + reviewed import (#70); redirects verified on production; post-cutover Search Console and Ads checks; CI e2e (#66) |
| **M5 Post-launch** | Items docs/08 says can follow MVP | Owner orders the list: sermon filters (#76), calendar month view (#78), form storage (#50), activity log (#53), dependency hygiene (#71), podcast RSS, carousel, etc. |

### What is done and what remains

| Milestone | Done | Remains |
|---|---|---|
| M1 | PRs #24-#29 merged 2026-11-19; #58, #81, #82, #83 closed; older foundation PRs #1-#7, #10, #11, #13 | Owner content review (#55); open PRs #14 (kickoff docs), #16 and #20 (fixtures, render tests); #30 worktree hygiene; #34, #36 Experience polish |
| M2 | #12 (Data RC2) merged; #79 R1 rebase closed | Open PRs #15, #18, #23, #21; issues #31, #32, #33, #35, #37, #41, #60, #46, #65 (owner), plus #38-#44, #47, #51, #54, #62, #64, #68 |
| M3 | none closed | Open PRs #5 (URL inventory, checklist) and #9 (QA checkpoint); #45, #48, #49, #52, #56, #57, #59, #61, #63, #67, #69, #70, #72-#75, #77, #84 |
| M4 | none | #66; cutover tasks (see #69, #70) |
| M5 | none | #50, #53, #71, #76, #78 |

## PR milestone assignments (and why)

| PR | Milestone | Reason |
|---|---|---|
| #24, #25, #27, #28, #29 | M1 | Merged parts of the pastor-review draft |
| #26 | M1 | Merged batch-2 assignment doc |
| #1-#4, #6, #7, #10, #11, #13 | M1 | Merged foundation/assignment work that fed the draft |
| #14 | M1 | Kickoff and architecture docs every lane references |
| #16, #20 | M1 | Ministry fixtures and signup render tests for a page already in the draft (#20 stacks on #19, contained in #24). #16's URL/form matrix also feeds M3 QA |
| #12 | M2 | Form-URL allowlist, admin input retention, contact privacy: staff-facing hardening, not visible to pastors |
| #15, #18, #23, #21 | M2 | Data stack (staff identity, form registry, Resend transport, limiter) and the limiter assignment doc |
| #5, #9 | M3 | Live URL inventory/launch checklist and QA readiness checkpoint |
| #8, #17, #19, #22 | none | Closed unmerged; contained in #24 |

## Dependency map

```
Owner: pre-launch Supabase (production project) + Resend DNS/key/inbox + Supabase Auth SMTP + staff roster (#65, #54)
   |-> #41 migration rehearsal + protected Preview (Ops)   -> #46 announcement timing check
   |-> #35 form email live delivery (needs #15 registry, #18 transport)
   |-> #31 staff accounts verified (two identities, removal)

Data stack:  #15 staff actor + form registry -> #18 Resend transport -> #23 limiter
   #60 (D1L-C, disposable Postgres rehearsal) must pass before #23 merges
   #15 -> #80 attributed publishing -> #32 draft preview -> #33 restore previous version
   #15 /api/forms/feedback -> #51 footer feedback link, #37 public/admin feedback

Owner content/URL decisions (#77, #57) -> #63/#84 redirects, #52 release URL QA, #56 branding
   Re-hosted photos (#59, #73) -> WordPress retirement (#69)
   Experience stack integrated (#58, done) -> #52 QA
```

## Critical path to M3

1. Owner prepares the production Supabase project for pre-launch use, Resend and Supabase Auth email (#65); owner answers the decisions below.
2. Rebased Data stack lands in order #15, #18, #23; D1L-C (#60) passes first.
3. Ops rehearses migrations and verifies the protected Preview (#41).
4. Form email is verified to a sandbox mailbox (#35); two staff identities are verified (#31).
5. Owner confirms destinations, forms, Search Console and Ads URLs (#77, #57); Ops finalizes redirects (#62, #63/#84).
6. Photos are re-hosted (#59, #73), then QA runs release URLs, a11y and the go/no-go list (#52, #61, #74).
7. Church approves content, redirect map and checklist (docs/08 P3).

## Risks

- **WordPress hot-linked media:** photos still point at `thrivevineyard.com/wp-content/uploads`; they break when WordPress is retired. Re-host first (#59, #73).
- **Tracking:** owner chose container GTM-PRJX6P9H (#28); the docs/audit record GTM-NQV3Z3N7. Ads tag AW-16575196430 is not loaded directly; the owner must confirm it lives inside the container. No consent notice for now.
- **Form email:** live delivery needs Resend DNS verification (updates.thrivevineyard.com), key, sender and inbox from the owner; the SQL for the limiter has never run on real Postgres (#60).
- **Redirects / SEO:** TBD rows `/prayer/`, `/expresso/`, `/volunteering/`, `/speaker/[slug]/`, root campaign slugs; `/youth-alpha/` redirect is held until the destination returns 200. Search Console and Ads destinations unconfirmed (`docs/04`).
- **Supabase state unverified:** the project the owner chose to use before launch (the production project) has no verified schema, import or env vars; whether it is empty is an open question (#54).
- **Process:** #14 and #5 carry docs other lanes reference and have been open since 2026-11-07/18; overlapping issues need merging by QA/PM: #54 vs #65 (provisioning), #55 vs #57 vs #77 (owner content/launch decisions), #63 vs #84 (redirects), #37 vs #51 (feedback link).

## Owner decisions needed

- Production Supabase preparation (env vars, Auth settings), Resend sender/inbox/DNS, Supabase Auth email template, staff roster (#65, #54).
- Pastor review of the #24 Preview and content gaps (#55, #77).
- Published destination for Youth Alpha; replacement ChurchSuite/Google form URLs and ministry schedules.
- Dispositions for `/prayer/`, `/expresso/`, `/volunteering/`; Search Console and active Ads destinations.
- Confirmation that the Ads tag lives in the GTM container; whether a consent notice is wanted later.
- Launch/cutover date (target week of Nov 23 on the board), domain and rollback plan; milestone due dates.

## Board views to add (owner, in the Project 3 UI; the CLI cannot create views)

Current views: "View 1" (table) and "View 3" (board). The built-in Milestone field works (verified on converted items).

1. **Roadmap** (layout Roadmap), group by **Milestone**, markers by Milestone; filter `-delivery stage:Done` for the forward view.
2. **Board by Delivery stage** (layout Board, columns Delivery stage: Backlog, Ready, In progress, In review, Waiting on owner, Blocked, Done); filter `milestone:"M2: Preview and Staff Ready"` or the active milestone.
3. **Table by Lane** (layout Table, group by Lane, fields Milestone, Priority, Size, Agent, Delivery stage, Next action, Stacked on).
4. **Owner queue** (Table), filter `lane:Owner` or `delivery stage:"Waiting on owner"`, sorted by Priority.
5. Optional **Merge order** (Table filtered to PR cards, sorted by Merge order) for QA.
