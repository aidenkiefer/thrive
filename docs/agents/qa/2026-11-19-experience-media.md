# QA report: 2026-11-19-experience-media

**Assignment:** uncommitted `cursor/experience-draft-media` and `cursor/experience-flames` (no prior assignment file) · **Reviewer:** Cursor senior QA · **Owner go:** 2026-11-19 16:54

## Results

| PR | Lane / tool | Verdict | Gate | Notes |
|---|---|---|---|---|
| #125 | experience / cursor | MERGED | PASS | Owner church photos on hub, kids hero, and About. `f66565b`. |
| #126 | experience / cursor | MERGED | PASS | `/thrive-flames` plus footer link, rebased onto #125. `ace6160`. |

**`main` after merge:** gate PASS at `ace6160`.

## Findings worth remembering

- The photo set and Flames page were uncommitted, so this review committed them before the gate. `node_modules` in those worktrees stayed untracked.
- Flames copy matches the live `thrivevineyard.com/thrive-flames` text, including the five theme lines and scriptures. The Gravity Form was not rebuilt; questions use `SITE.email`.
- Kids ministry and baptism alts match the frames that were opened (kids sign; outdoor baptism). Staff portraits and the four `kids*` age-group photos are still WordPress URLs. Home welcome still uses `familyWorship`.
- `CtaBand` now uses a `div` for the MDX lead so a nested paragraph cannot cause hydration error 418.
- `/thrive-flames` is the same path as the WordPress page, so no new redirect was required.

## Carry-over

- `cursor/experience-metadata` is still building share cards and has uncommitted edits on `about/page.tsx` and `kids-youth/page.tsx`. It must rebase onto `ace6160` or it will drop the photo markup.
- Open data and ops drafts were not part of this merge.
- Local worktrees `cursor-experience-draft-media` and `cursor-experience-flames` are still dirty because of untracked `node_modules`, so prune left them.

## Next session (for the PM)

1. Let the metadata lane rebase onto `ace6160` and finish #43, including Open Graph tags for `/thrive-flames`.
2. #47 mobile pass can start once the metadata branch commits; it shares `globals.css`, the footer, and the CTA band.
3. Home welcome still shows the WordPress `familyWorship` photo. A later photo pass can replace it if the owner picks a frame from this set.

## Workflow friction

- There were no PRs until review time. The media lived only in dirty worktrees, so QA had to commit it before a gate or merge was possible. Builders should commit and open the PR when the photos are selected.
- `gh pr merge --delete-branch` could not delete the local branches because the worktrees still have them checked out. Remote branches were deleted.

## Model usage

- Review and gate were done in this Cursor session. No builder tier was recorded because the original work had no session log.
