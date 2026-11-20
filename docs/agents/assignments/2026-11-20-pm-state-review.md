# PM review — 2026-11-20

This checkpoint reconciles origin/main at 2a022dd with GitHub issues, open PRs and private Project 3. It proposes next work for owner review; no new builder assignment is launched.

## Deployment and verification

GitHub deployment 7952342027 reports success for Production at 2a022dd (2026-11-20 20:57 UTC). [Deployment](https://thrive-vineyard-8gtt5f6lf-aiden-kiefers-projects.vercel.app). This confirms Vercel deployment, not DNS cutover or end-to-end correctness of every feature. The church-domain launch remains owner-gated.

## Merged functionality

- Public home, About/team, Plan a Visit, Kids/Youth, Give, Get Connected, groups, outreach, ministries, campaign pages, sermons/series and events with month filtering, grid/list and iCalendar.
- Audited visitor copy, church photos and Flames artwork/page (#125–127), church mark and both pastors (#139). Remaining curated and database WordPress media must be audited before retirement.
- Sermon audio and safe media fallbacks (#109), helpful error/404 pages (#106), responsive navigation and reduced-motion-aware animation.
- Sitemap/robots, Church/Event structured data, social metadata and default share image (#124/#116), production-only GTM. Ads conversion verification remains open.
- Individual staff email-code sign-in, staff role checks, admin CRUD, shared Postgres limiter, native form registry and Resend delivery (#15/#18/#23/#114).
- Publisher attribution across editors, system seed actor and database publication guards (#90/#96/#133); shared reserved slugs on admin/public (#120/#136), entity cache revalidation (#122).
- Feedback UI/footer and prayer form/API (#140/#141). Prayer sends only to FORMS_PRAYER_RECIPIENT; production configuration and delivery require verification.
- Exact decided redirects (#138/#140): /expresso -> /plan-a-visit#services (301), /prayer -> /get-connected#prayer (302), /volunteering -> /get-connected (302).
- Redirect tests, media ratchet, API/limiter and RLS coverage, dependency remediation, cutover/monitoring proposals are merged.

The November 19 import was applied and verified in the change ledger (#101/#108). The regenerated supabase/ops/2026-11-20-seed.sql is committed but NOT applied. These are different artifacts; do not rerun a seed solely to reconcile documentation.

## Open PRs

| PR | State | Remaining work |
|---|---|---|
| [#117](https://github.com/aidenkiefer/thrive/pull/117) browser smoke | Draft, fix-first | Rebase; fix stale 404 heading, wait for hydration, correct evidence; investigate React #418 on Plan a Visit/Kids; two passing runs. Existing 28/31 result is historical, not a current-main result. |
| [#105](https://github.com/aidenkiefer/thrive/pull/105) sender DNS runbook | Draft | Root DNS/Resend verification is recorded; SMTP setup is owner-reported. Auth-template/forms-key/delivery follow-ups and independent review remain. Title saying setup pending needs more precise wording. |

There is no other completed application PR awaiting merge. Merged code with pending operational verification stays on its issue rather than being described as an unmerged stack.

## Recommended order for the owner's next decision

1. Finish production email configuration and verify feedback/prayer delivery; complete staff denial/revocation and concurrent limiter checks (#35/#31/#41/#54). Do not expose real personal submissions in logs.
2. Correct/rebase #117 and resolve hydration findings, then run two browser suites. After that enable e2e CI (#66).
3. Finish photo/database image independence (#59/#49), favicon/app icons (#56), mobile/keyboard/accessibility checks (#47/#61), then performance (#67).
4. Verify announcement changes (#46), release URLs/media/hosted destinations (#52), remaining ministry/Ads/URL decisions (#55/#57), backup restore and snapshot retention (#70/#118).
5. Choose monitoring (#72), fill cutover DNS/TTL/rollback inputs (#69), and ratify release go/no-go (#74). Cutover follows owner approval.
6. Next CMS feature candidates: speaker/series editors (#42), draft preview and restore (#32/#33), activity history (#53). Sermon search (#76) and calendar month view (#78) remain later work.

## Reconciliation

Closed stale completed issues #40, #44, #51, #63, #99 and #101 with merge/ledger evidence. Kept partially complete operational and umbrella tickets open. Updated Project delivery/status and next actions for completed historical cards and current carry-over. Preserved #105/#117 drafts. The roadmap now points here for this checkpoint; PROGRESS.md remains QA-owned.
