# Experience lane backlog (PM roadmap batch 3)

**Date:** 2026-11-19 · **Lane:** experience (public site UI, content kit, pages, SEO metadata, accessibility, front-end performance) · **Suggested tool:** Cursor for all tickets (lane default; browser tool for QA-style tickets).

All 12 issues are on [Project 3](https://github.com/users/aidenkiefer/projects/3) with lane, agent, priority, size, release, delivery stage and next action set. Paths are checked against `docs/workflow/roles-and-lanes.md`: nothing below edits Data, Ops or QA paths (`next.config.ts`, `package.json`, `src/lib/**`, `src/app/api/**`, `supabase/**`, `docs/**`, tests).

## Issues created

| # | Title | Milestone | Size | Priority | Stage | Depends on |
|---|---|---|---|---|---|---|
| [#34](https://github.com/aidenkiefer/thrive/issues/34) | Helpful 404 and error pages | M1 | S | P1 | Ready | none |
| [#36](https://github.com/aidenkiefer/thrive/issues/36) | Sermon detail: audio player and safe media fallbacks | M1 | S | P1 | Ready | none |
| [#38](https://github.com/aidenkiefer/thrive/issues/38) | Generated default social share image (`/og`) | M2 | S | P1 | Ready | none |
| [#43](https://github.com/aidenkiefer/thrive/issues/43) | Open Graph and Twitter metadata on every public route | M2 | M | P1 | Backlog | soft: #38 |
| [#47](https://github.com/aidenkiefer/thrive/issues/47) | Mobile and tablet QA pass with fixes (360 to 1024px) | M2 | M | P1 | Ready | none |
| [#51](https://github.com/aidenkiefer/thrive/issues/51) | Restore the footer "Website feedback" link | M2 | S | P1 | Blocked | [PR #15](https://github.com/aidenkiefer/thrive/pull/15) (soft: [#18](https://github.com/aidenkiefer/thrive/pull/18)) |
| [#56](https://github.com/aidenkiefer/thrive/issues/56) | Favicon, app icons and header logo from owner-supplied files | M3 | S | P1 | Waiting on owner | owner files |
| [#59](https://github.com/aidenkiefer/thrive/issues/59) | Re-host the curated site photos under our control | M3 | M | **P0** | Waiting on owner | owner files |
| [#61](https://github.com/aidenkiefer/thrive/issues/61) | Accessibility audit pass with keyboard and focus fixes | M3 | M | P1 | Ready | none (re-run after #59 if first) |
| [#67](https://github.com/aidenkiefer/thrive/issues/67) | Front-end performance budget pass: images, fonts, layout shift | M3 | M | P1 | Backlog | soft: #59 |
| [#76](https://github.com/aidenkiefer/thrive/issues/76) | Sermon archive search and filters (speaker, series, topic) | M5 | M | P2 | Backlog | none |
| [#78](https://github.com/aidenkiefer/thrive/issues/78) | Events calendar-style month view | M5 | M | P2 | Backlog | none |

Tool for every row: Cursor. Tiers: T1 throughout (T0 for the footer link). M4 (Cutover and Stabilize) has no experience tickets: everything cutover-critical in this lane is finished by M3, and M4 is Ops/QA/Owner work.

## Rationale for ordering

1. **M1 (what the pastor sees first).** A real 404/error page and working sermon audio are visible immediately in the Preview and need no other lane. About 41 of 104 migrated sermons have an MP3 that the detail page ignores today (`audio_url` is on the `Sermon` type but never rendered).
2. **M2 (Preview and staff ready).** Share previews (`/og`, then per-route OG/Twitter metadata) matter as soon as links circulate. Mobile QA fixes the draft before wider review. The footer feedback link waits on Data #15 and is a 10-minute change after it lands.
3. **M3 (launch readiness).** The photo re-host is the only launch-blocking item here: all 19 curated photos hot-link `thrivevineyard.com/wp-content/uploads`, the same domain that is repointed at cutover, so images disappear unless they are re-hosted first. It is P0 but gated on owner files. Accessibility and performance passes come last in M3 so they measure the near-final site (the perf pass is best run after the re-host).
4. **M5 (post-launch).** Sermon filters and the month calendar view are documented as "can follow after MVP" in `docs/08-mvp-status-roadmap.md`; the filter ticket also unlocks replacing the temporary `/topics`, `/book`, `/service-type` redirects (docs/04).

## Verified already built or already carded (not re-created)

- Events month filter, grid/list toggle and `.ics` download exist in `src/app/(public)/events/page.tsx` (only the month grid is a gap, #78).
- Group and ministry signup CTAs (link/embed only) are built (`groups/[slug]`, #19 ministry schedule and signup).
- Per-page `title`, `description` and canonical metadata and JSON-LD exist (#29); only Open Graph/Twitter and share images are missing (#43, #38).
- Skip link, mobile-nav focus management, `aria-current` and reduced-motion support exist; #61 audits rather than rebuilds.
- Not-found and error pages exist but are minimal, so #34 improves them rather than adding them.
- Visitor feedback form (#17) and footer wiring (#22) are merged; the link is hidden, which #51 reverses. Existing Blocked card "[Experience] Add public and admin website feedback" overlaps in theme; #51 only covers the footer link.
- Sitemap, robots and redirects are Ops-owned and out of scope.

## Related tickets from other lanes (checked, not duplicates)

- [#49](https://github.com/aidenkiefer/thrive/issues/49) Data: admin image handling and DB image re-hosting (partner of #59).
- [#73](https://github.com/aidenkiefer/thrive/issues/73) Ops: media inventory and a guard against new `wp-content/uploads` references (land #59 first, then the guard can be strict).
- [#66](https://github.com/aidenkiefer/thrive/issues/66) Ops: informational axe and Lighthouse CI job (feeds and re-checks #61/#67); [#64](https://github.com/aidenkiefer/thrive/issues/64) Playwright smoke tests (covers 404 status for #34).
- [#37](https://github.com/aidenkiefer/thrive/issues/37) existing "Add public and admin website feedback" card (theme overlap with #51 only).
- [#52](https://github.com/aidenkiefer/thrive/issues/52) QA: verify release URLs and media (checks the output of #36/#59).

## Considered, not created

- **Site-wide search:** no doc requests it; skipped to avoid inventing scope.
- **Print styles for events and Plan a Visit:** no doc grounding; revisit only if the pastor asks.
- **Spanish or other languages:** `docs/01-current-site-audit.md` lists La Viña as a Spanish-language Sunday service but no doc calls for a translated site. Not created; ask the owner first.
- **Event share controls and speaker/book archive pages:** listed as post-MVP in docs/08; left for a later batch.
- **Admin feedback and global-error boundary:** other lanes or not explicitly lane-owned.

## Owner decisions needed (digest)

| Ticket | Decision |
|---|---|
| [#59](https://github.com/aidenkiefer/thrive/issues/59) | Supply original photos, or approve copying the 19 published photos from the live site; confirm the four stock "kids" photos may be reused or supply replacements; confirm staff photos may stay. |
| [#56](https://github.com/aidenkiefer/thrive/issues/56) | Supply the logo (SVG or highest-resolution PNG) and favicon source; decide whether the header uses the logo image or stays text-only. |
| [#51](https://github.com/aidenkiefer/thrive/issues/51) | May the footer feedback link go live before form email delivery is provisioned (otherwise submissions are stored but nobody is notified)? |

No ministry data, contact details, URLs or dates were invented in any ticket.

## Cross-lane items to schedule

| For | Request | Source ticket |
|---|---|---|
| Ops | Remove the `thrivevineyard.com/wp-content/uploads` remote pattern in `next.config.ts` after photos and DB images are re-hosted | #59 |
| Data | Re-host database `featured_image_url`/thumbnail values (events, groups, sermons) to the same hosting | #59 |
| Ops | Repoint temporary `/topics/*`, `/book/*`, `/service-type/*` redirects (and decide `/speaker/*`) once filter URLs exist | #76 |
| Ops | Any dependency needed for automated a11y or Lighthouse runs (`package.json`) | #61, #67 |
| PM/Owner | Confirm ownership of root-level `src/app` file-convention files (`opengraph-image`, `global-error`): not listed in roles-and-lanes. #38 uses `src/app/(public)/og/route.tsx` to stay in lane | #38 |

## Next assignment candidates

**Experience lane (Cursor), next session (all unblocked, no cross-lane contract needed):**

1. [#34](https://github.com/aidenkiefer/thrive/issues/34) 404/error pages (S).
2. [#36](https://github.com/aidenkiefer/thrive/issues/36) sermon audio and media fallbacks (S).
3. [#38](https://github.com/aidenkiefer/thrive/issues/38) `/og` image, then [#43](https://github.com/aidenkiefer/thrive/issues/43) OG/Twitter metadata (contract inside the lane: `/og?title=` and a `pageMetadata()` helper in `src/components/seo/metadata.ts`).
4. [#47](https://github.com/aidenkiefer/thrive/issues/47) mobile QA pass. `globals.css` has a single writer per session: give it to #47 and run [#61](https://github.com/aidenkiefer/thrive/issues/61) in the following session (or after #47 merges) to avoid conflicts.

**When unblocked:** #59 and #56 as soon as the owner supplies files; #51 right after Data #15 merges.

**Contracts with other lanes:** none required for this set. Data #15 is a hard dependency only for #51; Ops follows after #59 and #76 as listed above.

**Other lanes (for reference only):** Ops: the cross-lane items above; QA: verify `/og`, metadata tags and the footer link at integration time.
