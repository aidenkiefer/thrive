# QA report: 2026-11-24 PR #161 photo re-host

**Assignment:** Independent review of [PR #161](https://github.com/aidenkiefer/thrive/pull/161). **Reviewer:** Codex senior QA. **Owner go:** November 24 chat authorized validated feature merges.

## Results

| PR | Lane / tool | Verdict | Gate | Notes |
|---|---|---|---|---|
| #161 | Experience / Codex | MERGED | PASS | Rebases cleanly on 7c8f0ee; merged as 8bb36c9. |

**Main after merge:** Full gate PASS at 8bb36c9 using Node 22.16.0, with typecheck, 620 tests, lint, and production build. The rebased PR head 09076e3 passed the same local gate and GitHub CI; Vercel preview passed. Lint had four existing warnings and no errors.

## Review evidence

- Reviewed all 14 WebP files in a contact sheet. Keys and retained alt text describe the pictured subjects and scenes.
- Fetched all 14 logged WordPress source URLs independently. Each returned an image. Pixel comparison after scaling to output dimensions showed mean absolute channel differences of 1.86 to 3.22, consistent with WebP optimization.
- Sharp decoded every committed file. Dimensions and byte counts match the provenance table; all are under 300 KB (858,722 bytes total).
- photos.ts contains no WordPress URL or wp-content reference. The diff retains alt text and dimensions, and Photo.tsx sizing and layout is unchanged. Git whitespace check passed.
- No live Supabase write, DNS change, or billing change was performed.

## Carry-over

- #59 stays open. Data #49 must inventory and re-host database-held WordPress image URLs before cutover.
- Ops must retain the WordPress next.config.ts remote pattern until DB media migration is complete, then remove it and shrink the media guard allowlist. The guard currently reports the stale photos.ts exception as a warning.
- Release QA still needs a network-blocked browser check and Lighthouse image CLS check on the integrated candidate.

## Next session

1. Data: finish DB media inventory, migration, provenance, and delivery checks for #49.
2. Ops: after DB URLs are migrated, remove the WordPress remote pattern and stale allowlist entries.
3. Release QA: verify the public image routes with WordPress blocked and check CLS before DNS cutover.

## Workflow friction

- The default WSL Node 18 is too old for this gate. Use installed Node 22.16.0 and install optional dependencies.
- GitHub CLI merged successfully but could not delete the author branch locally because it remains checked out in its worktree. The remote PR is merged; do not prune the author worktree without its owner.

## Model usage

No reliable account usage percentage was available.
