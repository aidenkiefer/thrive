# Ops, QA and Launch backlog (batch 3)

> **Status note (2026-11-19, after this doc was drafted).** #5 was replaced by #86 and #16 by #85 (both merged; originals closed); #9 was closed as superseded; #20 is being replaced by a smaller PR (render tests only); #14 is being replaced by a split draft PR. Duplicate issues #65, #77 and #84 were closed in favor of #54, #55/#57 and #63. `docs/10-launch-checklist.md` is now on `main` (via #86). Where this doc says "PR #5", "PR #16" or "#9", read the replacement above. #75 no longer waits on #9. The Data stack (#15, #18, #23) was rebased by Claude and is under QA.

**Shaped:** 2026-11-19 by a PM session (Cursor). **Scope:** shipping safely and cutting over from WordPress: redirects, browser tests, CI quality signals, environment and database readiness, cutover, monitoring, release gates. Every ticket is on the GitHub Project 3 board with lane, tool, size, priority and stage set.

All tickets are real gaps verified against `main` at 5302848 and against open PRs #5, #9, #14, #16, #20, #21 and the existing board cards (see "Duplicate and overlap check"). No ticket touches another lane's paths; `next.config.ts`, `package.json` and `package-lock.json` are Ops hot files with a single named owner per ticket.

## Issues created

| # | Title | Milestone | Lane | Tool | Size | Priority | Stage | Depends on |
|---|---|---|---|---|---|---|---|---|
| [#62](https://github.com/aidenkiefer/thrive/issues/62) | [Ops] 301 redirect manifest and verification harness for docs/04 | M2 | ops | Codex | M | P1 | Ready | none |
| [#64](https://github.com/aidenkiefer/thrive/issues/64) | [Ops] Playwright smoke tests against the built app: routes, forms, redirects, 404 status | M2 | ops | Codex | M | P1 | Ready | none |
| [#68](https://github.com/aidenkiefer/thrive/issues/68) | [Ops] Vercel and Preview environment audit: env var matrix, VERCEL_ENV behavior, protection, Preview smoke checklist | M2 | ops | Cursor | M | P1 | Backlog | none to start; owner provisioning and #15/#18/#23 for final values |
| [#63](https://github.com/aidenkiefer/thrive/issues/63) | [Ops] Activate the owner-decided /prayer, /expresso and /volunteering redirects | M3 | ops | Codex | S | P1 | Backlog | #62, PR #16 |
| [#73](https://github.com/aidenkiefer/thrive/issues/73) | [Ops] Media inventory and a guard that fails on new wp-content/uploads references | M3 | ops | Codex | S | P1 | Ready | none |
| [#69](https://github.com/aidenkiefer/thrive/issues/69) | [Ops] Cutover runbook: DNS, TTLs, rollback, WordPress retirement, Search Console | M3 | ops | Cursor | M | P1 | Backlog | PR #5; owner launch-decisions card |
| [#70](https://github.com/aidenkiefer/thrive/issues/70) | [Ops] Supabase production readiness and backup/restore checklist | M3 | ops | Claude Code | M | P1 | Waiting on owner | none to draft; owner access for evidence |
| [#72](https://github.com/aidenkiefer/thrive/issues/72) | [Ops] Monitoring, uptime and error reporting proposal for launch | M3 | ops | Cursor | S | P2 | Waiting on owner | none |
| [#74](https://github.com/aidenkiefer/thrive/issues/74) | [QA] M3 release checklist and go/no-go criteria | M3 | qa | Senior QA | S | P1 | Backlog | PRs #5, #9; #62, #64, #68, #69, #73 |
| [#75](https://github.com/aidenkiefer/thrive/issues/75) | [QA] PROGRESS.md and docs drift hygiene after the Nov 18-19 merge wave | M3 | qa | Senior QA | S | P2 | Backlog | PR #9; Data stack merged |
| [#66](https://github.com/aidenkiefer/thrive/issues/66) | [Ops] CI job for e2e plus informational axe and Lighthouse reports | M4 | ops | Codex | M | P2 | Backlog | #64 |
| [#71](https://github.com/aidenkiefer/thrive/issues/71) | [Ops] Dependency and security hygiene: npm audit triage, stale doc note, Dependabot proposal | M5 | ops | Codex | S | P2 | Backlog | none |

No P0 was assigned: nothing here blocks the pastor draft review. The launch-critical items are the P1s.

## Ordering rationale

1. **M2 first: make "did we break a route or a redirect?" machine-checkable** (#62, #64). They are independent, Ready, DB-free, and protect every later change. #62 covers the SEO map; #64 covers rendering, real HTTP status and forms, including the soft-404 regression found in QA today (a route-group `loading.tsx` made detail 404s return 200). They both live in Ops-owned paths (`tests/**`, `e2e/**`, `next.config.ts`, `package.json`), so schedule them in one Codex session with `package.json` assigned once (to #64).
2. **#68 in M2** because provisioning the isolated Preview (owner card) needs the exact variable list, `VERCEL_ENV` behavior and a repeatable Preview smoke checklist. It also records the finding that `src/app/robots.ts` allows all crawlers and hard-codes the production sitemap host.
3. **M3 turns decisions into gates.** #73 stops WordPress media from spreading and gives the retirement rule; #63 activates the three already-decided redirects once #62 exists; #69, #70 and #72 are the documents the owner has to sign before cutover; #74 pulls it into one go/no-go page; #75 keeps PROGRESS honest.
4. **M4/M5 are informational.** #66 (axe, Lighthouse, e2e in CI) is deliberately non-blocking and comes after #64 touches the same files. #71 is Post-MVP: the lockfile currently has only 6 moderate, dev-only findings (checked with `npm audit --package-lock-only` on 2026-11-19), so risk is low and Dependabot noise is not worth it before launch.

## Owner decisions needed (digest)

Cutover (#69, feeds #74):
- Target cutover date and window (target week of Nov 23); canonical host (apex or www).
- DNS provider, who holds credentials, who executes; TTL value and how early it is lowered.
- Rollback decision maker, trigger, and how long WordPress stays online afterwards.
- Search Console property type and who has owner access; export top URLs and active Ads destinations (already on the card "Ministry content, destinations and launch decisions").
- Confirm Ads tag `AW-16575196430` lives inside GTM container `GTM-PRJX6P9H`.

Data safety (#70):
- Production Supabase project identity and plan tier (PITR is a cost decision); acceptable data-loss window (RPO) and restore time (RTO); approve a restore drill into a disposable project.

Environment (#68):
- Confirm Preview protection mode (Vercel Authentication) and who may open Previews; owner provisioning is on the card "Provision Preview, auth email and form email".

Observability (#72):
- Provider(s), account owner, alert recipients and channel, budget ceiling.

Redirects (#63, #62):
- Re-confirm the confidential prayer path exists on `/get-connected` before the `/prayer` redirect goes live. Youth Alpha, speaker, campaign and taxonomy rows stay `pending-owner` until the owner decides (listed by #62's test output).

Hygiene (#71, #74):
- Enable Dependabot now, after launch, or never; ratify the blocking vs known-issue-allowed split and name who calls go/no-go.

## Duplicate and overlap check

- **#16 / #20 (ops fixtures, render tests):** they add `tests/fixtures/ministry-display.ts`, `tests/ministry-*.test.ts`, a colocated-test include in `vitest.config.mts`, and the URL/form disposition spec. #62 uses different files under `tests/redirects/`; #63 depends on #16 for the disposition spec.
- **#5 (audit, launch checklist):** has the coarse "review deployment/domain/DNS" and "agree on rollback" rows. #69 is the executable runbook behind those rows, not a copy.
- **#9 (QA checkpoint) and #14 (kickoff docs):** both touch `PROGRESS.md` or workflow docs. #75 depends on #9 merging first; no other ticket touches these.
- **#21 (limiter assignment):** no overlap.
- **Board draft cards, referenced not duplicated:** "[Ops] Rehearse database migration and verify protected Preview" (Preview DB rehearsal; #70 covers production backups and restore, #68 supplies the Preview checklist); "[QA] Verify release URLs, media and hosted destinations" (manual Preview header and media check; #62/#64/#73 are the automated versions); "[Data] D1L-C Rehearse migration chain on disposable Postgres"; "[Ops] Worktree and branch hygiene"; "[Owner] Provision Preview, auth email and form email"; "[Owner] Ministry content, destinations and launch decisions".
- **Not created on purpose:** Search Console/Ads export (already an owner card item), an `[Owner]` cutover card (decisions are listed in #69/#70/#72 and the digest above), actual media re-hosting (Experience and Data lanes; #73 writes the cross-lane requests), and any monitoring implementation (needs a `src/app/api/**` health route, which is Data).

## Facts found while shaping (for the other agents and QA)

- `docs/04` still shows `/prayer/`, `/expresso/`, `/volunteering/` as TBD, but the owner decided on 2026-11-07 (302 / 301 to `/plan-a-visit#services` / 302). The decisions live in the PR #16 spec.
- `docs/06` says `next-mdx-remote` v5 is installed; `package.json` is `^6.0.0`.
- `docs/plans/PROGRESS.md` says "npm audit 2 critical / 7 high" and "5 legacy redirects"; the lockfile shows 6 moderate dev-only and `next.config.ts` has 8 rules.
- `docs/10-launch-checklist.md` (PR #5) lists the speaker/staff contact-column decision as open; `supabase/README.md` records it as fixed by the 2026-11-07 owner decision and a migration.
- `src/app/robots.ts` allows `/` for every environment and hard-codes `https://thrivevineyard.com/sitemap.xml`.
- Only two source files plus `next.config.ts` reference `thrivevineyard.com/wp-content/uploads` today (`src/components/content/photos.ts`, `src/components/events/CardImage.tsx`); DB rows are unchecked.
- Legacy URLs have trailing slashes; Next normalises them with its own redirect before applying `redirects()`, so `/im-new/` may take two hops. #64 records the real hop count.

## Next assignment candidates

**Ops (Codex), one session, `package.json` owned by #64:**
1. #62 redirect manifest harness (M)
2. #64 Playwright smoke harness (M)
3. #73 media guard and inventory (S)
4. Later in the same lane: #63 once #62 and PR #16 are merged (S)

Contract: #62 exports the manifest in `tests/redirects/redirect-manifest.ts`; #63 and #64 may import it. #73 writes the cross-lane requests (Experience: re-host photos into `public/**`; Data: audit script for DB rows pointing at `wp-content`).

**Docs/Ops (Cursor), parallel and conflict-free (docs only):**
1. #68 Vercel and Preview audit (M)
2. #72 monitoring proposal (S)
3. #69 cutover runbook after PR #5 merges (M)

Contract: #68's checklist is the shared Preview smoke list used by the Ops DB-rehearsal card and the QA URL-verification card; #69 links the media rule from #73 and the go/no-go from #74.

**Data-aware Ops (Claude Code, only if capacity):**
1. #70 Supabase production readiness (needs owner answers first, so it may start as a draft with blanks).

**Senior QA (end of the next merge wave):**
1. #74 go/no-go, drafted once PRs #5 and #9 are in.
2. #75 PROGRESS and docs drift note, last, after #9 and the Data stack merge; never in parallel with another PROGRESS writer.

**Hold:** #66 until #64 merges (same files); #71 until after launch unless the owner wants Dependabot sooner.
