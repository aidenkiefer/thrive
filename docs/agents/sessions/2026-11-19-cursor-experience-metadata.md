# Session log: `cursor/experience-metadata`

**Assignment:** `docs/agents/assignments/2026-11-19-experience-metadata.md` · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-19

## Status
<!-- ≤3 lines, kept current by scribe: done / in progress / parked / blocked -->
In progress: E2 done, E1 starting.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `16:50` **change** E2: `LatestSermonSection` now embeds via `parseYouTubeId`/`youtubeEmbedUrl` from `src/components/sermons/media.ts` instead of a string replace on `youtube_url`. Non-YouTube/unparseable urls fall back to the empty state. (T1) [pending]
