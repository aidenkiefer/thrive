# QA report: 2026-11-24-google-forms-review

**Assignment:** staged 2026-11-22 managed signup sprint on PR #146. **Reviewer:** Codex senior QA. **Owner go:** explicit authorization in this chat for ready, validated PRs.

## Results

| PR | Lane | Verdict | Gate | Evidence |
|---|---|---|---|---|
| #157 | Claude Data | MERGED, 7c8f0ee | PASS | C1 offline contract; no live service changes |
| #159 | Claude Data | FIX-FIRST, open | PASS on QA integration b374c8f | Three live-write safety gaps posted on PR |

Main after merge: full gate PASS at 7c8f0ee using Node 20; typecheck, 620 tests, lint with 0 errors and 4 existing warnings, and production build. Integrated #159: clean QA rebase on 7c8f0ee; full gate PASS with 654 tests. Green checks do not resolve the findings.

## Findings worth remembering

- A response-body read failure after forms.create can reset the manifest to planned and permit a duplicate on retry.
- The executor can rewrite a form published directly in Google. Forms revision IDs exclude publish settings.
- If forms.get omits revisionId, the content batch runs without requiredRevisionId. This must fail closed.
- Templates remain DRAFT; non-sandbox launches are blocked until owner approval. Manifest examples contain fake IDs and URLs.
- Public pages use the existing admin signup URL field, not the operator manifest.

## Carry-over

- #159: Claude Data to fix the three paths, add fixture tests, rebase on current main and rerun the full gate; independent QA must review again.
- #146: staged planning PR remains open and needs separate independent handling.
- Live Google account, API, OAuth, quota and billing, sandbox create/publish/read-back, hosted response, private review and notifications are unverified. No live API calls, database writes, credentials, paid activation or DNS changes occurred here.
- Owner approval of template wording and real entity titles and links remains required.

## Next session

1. Review corrected #159 and run the full gate on its integrated commit.
2. After independent PASS, merge #159 under the existing owner authorization and gate main.
3. Run owner-assisted Google setup later and record real evidence separately from fixtures.

## Workflow friction

- #159 stacked C1 commits after #157 was squash-merged. QA rebase with --onto origin/main a0f5048 was clean; the duplicate wording patch dropped automatically.
- GitHub rejected a formal change-request review because the connected account owns the PR; findings were posted as a top-level comment.
- WSL defaulted to Node 18; select Node 20 before npm ci and gates.

## Model usage

Senior QA depth was appropriate for manifest reconciliation and live-write failure paths.
