# Session log: `cursor/experience-sermon-media`

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Lane:** experience · **Tool:** cursor · **Started:** 2026-11-19

## Status
E2 #36 done. Gate PASS (typecheck, 91 tests, lint 0 errors / 4 pre-existing warnings, production build). Awaiting independent QA (Codex).

## Entries
- `14:08` **change** #36: New `src/components/sermons/media.ts` (parseYouTubeId: hosts youtube.com, www., m., youtube-nocookie.com and www., youtu.be; watch?v=, embed/, shorts/, live/, v/, youtu.be; 11-char id), youtubeEmbedUrl, safeHttpsUrl (https only), formatDuration.
  SermonPlayer iframe only for a parsed YouTube id (youtube_url first, then a YouTube video_url); https audio_url native audio (controls, preload none, no autoplay, aria-label, download); both → video then labelled Listen; audio-only replaces Video not available and keeps SITE.social.youtube; non-YouTube video_url outbound never iframe; non-YouTube youtube_url → fallback; http audio rejected; autoplay removed from iframe allow; referrerPolicy strict-origin-when-cross-origin.
  SermonMeta Length from duration_seconds (e.g. 1 hr 5 min); SermonCard thumbnail uses shared parser; sermons/[slug]/page.tsx passes video_url, audio_url, duration_seconds. No Supabase client in components; nothing invented. (S, T1) [73fdcf2]
- `14:08` **note** #36: Temporary harness route (removed, not committed) rendered 6 cases on a local dev server; DOM inspected. YouTube+audio: one iframe embed/dQw4w9WgXcQ then Listen; audio only: Listen to this message + download + channel link, no iframe; neither: Video not available + channel link; non-YouTube youtube_url: fallback, no iframe; non-YouTube video_url + audio: audio plus Watch the video outbound; http audio: rejected, fallback.
  Audio preload=none, autoplay=false, controls=true. Length 1 hr 5 min for 3900 seconds. (T1)
- `14:08` **note** #36: Not tested: a real seeded sermon page against the database (no Preview data yet); keyboard operation of the audio controls was not scripted (native controls). Hard-constraint checklist all satisfied or N-A. No loading.tsx added. git diff --shortstat origin/main...HEAD: 5 files, 146 insertions, 37 deletions (plus this session log: 6 files). (T1)
- `14:08` **request** ops (tests) #36: Add unit tests for `src/components/sermons/media.ts` (parseYouTubeId, safeHttpsUrl, formatDuration). A throwaway test of 6 allowed URL shapes and 9 rejected shapes passed locally but was not committed because tests are Ops-owned. (T1)
- `14:08` **note** #36: Follow-up: `src/components/home/LatestSermonSection.tsx` still builds its YouTube embed with string replace, not the shared parser. Fix belongs in E4 (#47), which owns `src/components/**`. (T1)
