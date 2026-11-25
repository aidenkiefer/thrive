# QA report: 2026-11-24-experience-phone-a11y

**Assignment:** launch-critical phone and accessibility audit for #47 and #61 (coordinator kickoff; no assignment file) · **Reviewer:** Cursor senior-qa (Claude Opus, heavy tier; same model family as the #162 author) · **Owner go:** the owner authorized merging validated features. Tablet widths (1024–1279px) are out of MVP scope.

## Results

| PR | Lane / tool | Verdict | Gate | Notes |
|---|---|---|---|---|
| [#160](https://github.com/aidenkiefer/thrive/pull/160) | experience / cursor | MERGED (`aa7e093`) | PASS | Header overflow at 1024–1099px. Desktop nav, actions and drawer toggle move from `lg` to `xl` (1280px). One file (`GlobalNav.tsx`). Reviewed after merge for this close-out. |
| [#162](https://github.com/aidenkiefer/thrive/pull/162) | experience / cursor | MERGED (`401e3d7`) | PASS (rebased on `8bb36c9`) | Active nav and other accent text on dark surfaces moved from `accent-400` to `accent-300`. Footer "Get directions" target is now 44px tall. FeedbackForm puts focus back after a submit. |

**#162 integration:** the PR branch was based on `aa7e093`, two commits behind `main` (#157, #161). QA rebased it locally onto `8bb36c9` with no conflicts. #161 touches `public/images/**`, `photos.ts` and its own session log under `docs/agents/sessions/`, and #162 touches none of them. `scripts/agents/gate.sh` on that tree: `GATE: PASS` (typecheck, 620 tests, lint with 0 errors and 4 warnings that already exist on main, production build). PR CI: `gate` pass, Vercel pass.

**`main` after merge:** #162 squash-merged as `401e3d7` by a separate merge-capable Cursor agent (`gh pr merge --squash`). CI run 45537369622 on `main` passed, and the Vercel production deploy succeeded.

### #162 evidence (Playwright and axe 4, production build of the rebased tree)

- **21 route × width runs** over `/`, `/about`, `/plan-a-visit`, `/events`, `/sermons`, `/give`, `/feedback` at 360, 390 and 1280px. No horizontal overflow on any run (`scrollWidth <= innerWidth`).
- **axe** (wcag2a/aa, 21a/aa, 22aa, best-practice) found 0 serious issues, with one transient exception: `/give` at 1280 on first paint. A giving card under the fold is part-way through the scroll-driven `reveal-up` fade (`animation-timeline: view()`, opacity about 0.8), so `neutral-600` text blends to `#7d7d7d` (4.11:1). Scrolled into view the result is 0 violations, and it is also 0 with reduced motion. The card is in `content/pages/give.mdx`, unchanged since #24, so it predates this PR.
- **Skip link (390):** the first Tab focuses "Skip to main content", and Enter moves focus to `#main-content`.
- **Mobile menu (390):** the toggle sets `aria-expanded="true"` and `#mobile-navigation` becomes visible. axe on the open header reports 0. Escape closes it.
- **FeedbackForm focus** (keyboard submit, API mocked): a 422 with a category error lands on the first `category` radio. A 422 with only a message error lands on the `message` textarea. A 503 lands on the submit button, and so does "sent". Focus no longer drops to `<body>`.
- **Code review:** the focus effect only runs when focus is on `<body>`, so it never steals focus the user moved. The `aria-live` region still announces status. No hard-constraint hits (no Supabase in client code, no admin or middleware change, no new data, no URL change).

## Findings worth remembering

- **Animated reveals give false contrast failures.** axe measures text inside a `reveal-up` card while it is still fading in. Audit scripts should either scroll each section into view or run with `reducedMotion: 'reduce'` before calling axe. Otherwise results change with viewport height.
- **Rebase drift during review.** `main` moved twice during this review (#157, then #161), so the gate was re-run on each new tip. Builders' "rebased on main" claims need checking with `git merge-base --is-ancestor origin/main <branch>` at merge time.
- **#160 behaviour change:** 1024–1279px now gets the mobile drawer instead of the desktop bar. That's acceptable because tablet is out of MVP scope, but any later nav change must keep the `xl` breakpoint and the `matchMedia('(min-width: 1280px)')` drawer-close check in step.

## Carry-over

- **#61 populated states** (Experience): sermon, event and group detail pages, `SermonPlayer`, and signup panels need an axe pass with real Preview data. This audit only covered empty states.
- **Lighthouse scores** (Ops #66 / Experience #67): not recorded here. Reuse the CI Lighthouse reports.
- **Admin screens** (Data): not covered by this audit.
- **Tablet 1024–1279px**: out of MVP scope by owner decision. Revisit after launch.

## Next session (for the PM)

1. Close #47 now that #162 is on `main`. Keep #61 open (or split it) for the populated-state recheck after Preview data exists.
2. Unblocked: the Playwright smoke (#64) is on `main` (#117, `435e506`, main CI green). Have Ops add an axe step to it using the reduced-motion and scroll-into-view rule above, so contrast regressions fail CI.

## Workflow friction

- **The reviewing QA agent could not merge.** Its `gh` token was read-only and its PR tool has no merge action. A separate Cursor agent with merge rights merged #160 and #162 with `gh pr merge --squash`. Fix: route merges to a merge-capable agent, or give every QA agent merge rights.
- **Branch not rebased at review time.** The PR body said the branch was current, but it was behind by #157. Fix: `gate.sh` could print a warning when `origin/main` is not an ancestor of `HEAD`.

## Model usage

- Heavy tier was right for QA (a skeptical review that caught the stale base and checked the axe exception). The two builder PRs were small T1 changes and fit a standard tier.
