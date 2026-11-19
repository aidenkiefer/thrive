# Assignment: 2026-11-19 experience metadata

**Session goal:** Every public route shares with a real Open Graph and Twitter card, using the merged `/og` image and existing page copy.
**Inputs read:** `docs/workflow/roles-and-lanes.md`; `docs/plans/PROGRESS.md` (current status on `origin/main` `07c9f30`); `docs/agents/assignments/2026-11-19-session-2.md`; `docs/plans/backlog/experience.md`; issue #43; open PRs; uncommitted `cursor/experience-draft-media` and `cursor/experience-flames`.
**Owner approval:** approved 2026-11-19

Data and Ops are empty this session. Their open PRs are carry-over for QA, not new build work.

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| experience | cursor | `cursor/experience-metadata` | `../thrive-worktrees/cursor-experience-metadata` | T1 |

## Hot-file owners (this session)

| File | Owner lane |
|---|---|
| `src/app/layout.tsx` | experience (default `twitter` card and OG image only) |
| `package.json`, `package-lock.json` | nobody |
| `supabase/schema.sql`, `src/lib/supabase/types.ts` | nobody |
| `next.config.ts` | nobody |
| `tailwind.config.ts`, `src/app/globals.css` | nobody |

## Contracts

None. `/og` already exists on `main` (#116).

## Merge order

1. Experience: one PR for #43, then the home-sermon embed fix if it is in the same branch.

## Do not touch (uncommitted on other Cursor branches)

| Branch | Leave these alone |
|---|---|
| `cursor/experience-draft-media` | `photos.ts`, `ChurchPhotoSection.tsx`, `CtaBand.tsx`, `HubCardsSection.tsx`, `about/page.tsx` JSX, `kids-youth/page.tsx` JSX, `public/images/church/**` |
| `cursor/experience-flames` | `Footer.tsx`, `src/app/(public)/thrive-flames/**`, `public/images/flames/**` |

On `/about` and `/kids-youth`, edit only the `metadata` export. Do not change photo props, gallery markup, or the CTA band.

---

## Lane: experience, share cards

**Tool:** cursor · **Branch:** `cursor/experience-metadata` · **Default tier:** T1
**Owned paths:** `src/components/seo/metadata.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/[slug]/page.tsx`, `metadata` / `generateMetadata` in `src/app/(public)/**/page.tsx`, `src/components/home/LatestSermonSection.tsx`
**Read first (≤3):** issue #43; `src/app/(public)/og/route.tsx`; one existing `generateMetadata` (sermon detail).
**Out of scope:** #47 mobile pass (`globals.css` stays untouched); #99 Flames; photo re-host; footer feedback link (#51); robots, sitemap, redirects, JSON-LD.

### Tickets

**E1 · Open Graph and Twitter metadata (#43)** · M · T1
- Task: Add `pageMetadata({ title, description, path, image })` and use it on every public route listed in #43.
- Files: `src/components/seo/metadata.ts` (new); `src/app/layout.tsx` (default twitter card and OG image only); metadata exports in the routes named in #43.
- Done when: the helper returns title, description, canonical, openGraph (title, description, absolute url, siteName, type, images), and twitter `summary_large_image`. Image order is the record image already on the query (`og_image_url`, then thumbnail / featured / YouTube thumbnail), then `/og`. No new descriptions. Canonicals, `seo_title` / `seo_description`, and `JsonLd` stay as they are. `curl` of at least 8 routes, including one sermon, one event, and one landing page, shows absolute `og:` and `twitter:` tags with a non-empty image. Gate passes.
- Skills: lane-builder

**E2 · Home sermon embed uses the shared YouTube parser** · S · T1
- Task: `LatestSermonSection` embeds YouTube through the host-allowlisted parser from #36, not a string replace on `youtube_url`.
- Files: `src/components/home/LatestSermonSection.tsx` only.
- Done when: a non-YouTube or unparseable URL does not become an iframe; a normal YouTube watch URL still embeds; gate passes.
- Skills: lane-builder

**Lane done when:** both tickets done or E2 parked with a reason · gate passes · PR open with a scribe body · Codex (or a different model family) reviews it.

---

## QA focus

- Share tags are absolute and use stored images only. A missing image falls back to `/og`, never a made-up URL.
- `/about` and `/kids-youth` diffs are metadata-only, so they can merge beside the uncommitted photo branch.

## Owner decisions needed

- None for this session. #47 waits until `cursor/experience-draft-media` and `cursor/experience-flames` are committed, because that pass edits `globals.css`, the footer, and the CTA band.
