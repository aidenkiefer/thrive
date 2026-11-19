# WordPress media retirement inventory

Audit date: 2026-11-19. This ticket inspected code and schema definitions only. No database media values, personal records or credentials were read. Live database media migration remains unverified.

## Existing code dependencies

| Reference | What it supports | Re-hosting owner and action |
|---|---|---|
| `src/components/content/photos.ts:13` | A WordPress uploads base used by 18 static photography entries: worship, prayer, family, water, pastoral/staff portraits and four children’s stock images. | Experience copies approved original assets into `public/**`, preserves useful dimensions/alt text, and changes the photo source paths. Owner confirms reuse rights, including stock licences, before copying. |
| `src/components/events/CardImage.tsx:14` | Allows existing WordPress upload URLs through the optimized image component on event/content cards; unknown hosts otherwise use the existing plain-image fallback. | Experience removes the WordPress-specific optimization rule after callers and database media have been re-hosted. This guard is not evidence that database URLs are clean. |
| `next.config.ts:15` | WordPress upload remote pattern permitted by Next image optimization. | Ops removes the pattern after the static inventory and Data’s database audit are clean. Keep the Supabase and YouTube patterns that remain necessary. |

The focused scan of `src/**`, `content/**`, `public/**` (when present) and `next.config.ts` found only these three source references. The guard permits each exact existing source line once. A new reference, including another one in an allowlisted file, fails. Removing a reference passes and reports the stale exception so the allowlist can shrink.

## Database columns requiring a media audit

Read-only source: `supabase/schema.sql`. These 25 media URL columns can contain external references; the array columns need an element-by-element check. A column name does not establish the host currently stored in it.

| Table | Image and media URL columns |
|---|---|
| speakers | `photo_url` |
| sermon_series | `thumbnail_url`, `og_image_url` |
| sermons | `audio_url`, `video_url`, `youtube_url`, `thumbnail_url`, `og_image_url` |
| recurring_events | `featured_image_url`, `gallery_urls` (array), `video_urls` (array), `og_image_url` |
| event_occurrences | No media URL column in the current schema. Parent event media is audited on `recurring_events`. |
| one_time_events | `featured_image_url`, `og_image_url` |
| groups | `featured_image_url`, `og_image_url` |
| ministries | `featured_image_url`, `og_image_url` |
| announcements | `featured_image_url`, `og_image_url` |
| staff | `photo_url` |
| landing_pages | `hero_image_url`, `og_image_url` |
| outreach | `featured_image_url`, `og_image_url` |

Form, CTA and external navigation URLs are not media columns and are outside this media-only inventory. Keep approved external video services external where intended; audit their actual hosts before changing a value.

## Cross-lane requests

- **Experience:** re-host the static photo kit into `public/**` after owner rights approval, update `photos.ts`, then remove the obsolete WordPress branch in `CardImage.tsx`. No assets were copied by this ticket.
- **Data:** provide a read-only audit script or query under Data-owned paths that checks every column above for both `thrivevineyard.com/wp-content` and `wp-content/uploads`, including array elements. Publish counts by table/column and affected row IDs only; omit personal fields and complete URLs. Track admin-managed originals and replacements in Supabase Storage, including buckets, policy review and object backups. Any database update still requires the artifact-specific owner go, backup confirmation, Data executor and change ledger under [the live-project policy](supabase-live-project.md).
- **Ops:** after Experience and Data supply clean evidence, remove the WordPress `remotePatterns` entry and its test exception. Re-run image and route checks, then remove any remaining stale guard exceptions.

## Cutover rule

Do not switch off WordPress until the guard allowlist is empty, the full code scan is clean, and Data’s media audit finds zero remaining WordPress references across all scalar and array media columns. Confirm the replacement assets render and remain accessible after WordPress is unavailable. Record rights approval and Data/Experience/QA sign-off in their owned records. This checklist grants no migration or cutover authority.

## Repeatable check

Run `npm test -- tests/media/no-wordpress-media.test.ts`. The synthetic regression fixtures prove that a new component reference fails, growth in an allowlisted file fails, and removal passes with an identifiable stale exception. The production scan skips symbolic links and binary/non-UTF-8 assets; their filenames alone are not media URLs. The ordinary full gate must pass before this change is pushed.
