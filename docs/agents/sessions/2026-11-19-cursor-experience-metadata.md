# Session log: `cursor/experience-metadata`

**Assignment:** `docs/agents/assignments/2026-11-19-experience-metadata.md` · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-19

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
Done: E1 and E2 complete, gate passes, PR pending.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `16:50` **change** E2: `LatestSermonSection` now embeds via `parseYouTubeId`/`youtubeEmbedUrl` from `src/components/sermons/media.ts` instead of a string replace on `youtube_url`. Non-YouTube/unparseable urls fall back to the empty state. (T1) [8a3a8a3]
- `17:00` **change** E1 (#43): added `pageMetadata()` in `src/components/seo/metadata.ts` (+ unit tests); used on every public route metadata/generateMetadata export (home, `/[slug]`, sermons list/detail/series, events list/detail, groups list/detail, outreach list/detail, ministries detail, about, about/team, kids-youth, give, get-connected, plan-a-visit). `layout.tsx` default `openGraph`/`twitter` now point at `/og`. Image precedence: `og_image_url` → `thumbnail_url`/`featured_image_url` (sermon also tries a derived YouTube thumbnail) → `/og`. Curl-verified absolute `og:`/`twitter:` tags on 12 static routes; dynamic DB-backed routes (sermon/event/landing detail) could not be curled live in this worktree (no Supabase env configured) but share the same `generateMetadata` pattern and are covered by `pageMetadata` unit tests. (T1) [53ccb18]
- `17:05` **note** session end: both tickets done, gate passed (GATE: PASS), PR #124 opened against main.
