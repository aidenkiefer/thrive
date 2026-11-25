# WordPress media inventory and dashboard-managed Storage (#49)

**Owner decision, 2026-11-22 (issue #49):** keep optimized photos and logos committed to the site. Use Supabase Storage for new and changing images, managed by the owner in the Supabase dashboard at first. A custom staff uploader is deferred past MVP. No new vendor and no public media DNS change. Approved public Storage URLs go into the existing HTTPS image fields in admin. Anonymous writes must never be allowed. The owner confirmed reuse rights for all WordPress media (2026-11-24).

This folder is read-only tooling plus a runbook. Nothing here creates a bucket, uploads an object, writes a row or changes a policy. Those steps are listed under [Owner setup](#owner-setup) and need the owner's dashboard session.

## Files

| File | What it is |
|---|---|
| `wordpress-media-checklist.md` | Generated. Every WordPress upload referenced by seed data (`migration-files/parsed/*.json`), with its Storage key. |
| `wordpress-media-audit.sql` | Generated. One `SELECT` over all 25 media URL columns. It returns counts and row IDs by table, column and kind, never URL values or row content. |
| `../../../scripts/media/wordpress-inventory.ts` | Generator. `npx tsx scripts/media/wordpress-inventory.ts --sql --checklist` rewrites both files. `--code` prints code-held references. `--json` prints the full inventory. |
| `../../../src/lib/media/wordpress-inventory.ts` | Pure helpers and the 25-column registry. Its test fails if `schema.sql` gains or loses a media column, or if a generated file is stale. |

## Inventory, 2026-11-24

**Seed-held (offline, this branch):** 111 distinct uploads, 70 images and 41 sermon mp3s, across 114 references. These are 49 `one_time_events.featured_image_url`, 24 `recurring_events.featured_image_url` and 41 `sermons.audio_url`. That accounts for every WordPress match in `supabase/ops/2026-11-20-seed.sql`; the unit test asserts it. Three image paths are WordPress derivatives (`-scaled`, `-e<timestamp>`, `-WxH`); the checklist names the likely original to fetch.

**Database-held (live, read-only):** the audit query ran through the MCP under the `SELECT`-only rule of [the live-project policy](../../../docs/ops/supabase-live-project.md). For a smaller response, the run dropped the `row_ids` column; the filters and grouping were the same as the committed file.

| Table | Column | Kind | References | Rows |
|---|---|---|---|---|
| one_time_events | featured_image_url | image | 50 | 50 |
| recurring_events | featured_image_url | image | 24 | 24 |
| sermons | audio_url | audio | 41 | 41 |

The other 22 columns returned nothing. The one extra `one_time_events` row is `thrive-youth-thursday-nights`. It is the stale published duplicate of a recurring event recorded in `docs/ops/db-reconciliation-2026-11-19.md` (decision card item 3). Its image is already in the checklist through the recurring event. If the owner retires that row, the count drops to 49.

`storage.buckets` returned no rows, so no bucket exists yet.

**Code-held (Experience and Ops own these files; this lane does not edit them):** `photos.ts` has 14 photos on its WordPress `BASE`. The WordPress branches in `CardImage.tsx` and `next.config.ts` are allowlisted by `tests/media/no-wordpress-media.test.ts`. Codex is moving the 14 photos into `public/images/**` in a separate Experience worktree, so they do not need Storage. `next.config.ts` and `CardImage.tsx` already allow `*.supabase.co/storage/v1/object/public/**`, so a Storage URL needs no host change.

## Decision needed: sermon audio

The 41 mp3s are 37% of the WordPress media and probably most of its bytes. Storage egress on a free plan is limited. Serving sermon audio from the same bucket as images could use up the allowance much faster than images do. Before audio is re-hosted, the owner should choose one of these:

1. Upload the mp3s to Supabase Storage after checking their total size and the actual plan limits on the Usage page.
2. Keep audio on the existing podcast or YouTube distribution and point `audio_url` or `youtube_url` there. This needs an approved data change.
3. Defer audio past cutover and accept that the links break when WordPress goes away.

The checklist lists audio separately, so images can proceed regardless. Recommended: option 2 if a podcast feed already exists, otherwise option 1 after the size check.

## Storage layout

- **Bucket:** `site-media` (proposed; the owner may pick another name and pass `--bucket <name>` to the generator), **public**.
- **WordPress re-hosts:** `wordpress/<the exact upload path>`, for example `wordpress/2024/06/SunnySideThumb-scaled.jpg`. Mirroring the path keeps provenance and makes the old-to-new URL map deterministic. Do not rename unless the checklist flags a key; it currently flags none.
- **New images:** `uploads/<table>/<yyyy>/<entity-slug>-<n>.<ext>`, for example `uploads/groups/2026/young-adults-1.webp`. Use lowercase ASCII names. Never keep a camera or phone filename.
- **Public URL:** `https://<project-ref>.supabase.co/storage/v1/object/public/site-media/<key>`, copied from the dashboard's "Get URL".

## Access rules

- A public bucket serves objects by URL with no read policy. Do not add `storage.objects` policies for `anon` or `authenticated` with `INSERT`, `UPDATE` or `DELETE`. With no write policy, the database denies every API write except the dashboard and service role.
- The bucket's allowed MIME types and size limit apply to dashboard uploads too. Recommended for images: `image/jpeg, image/png, image/webp, image/avif` and 5 MB. If the owner chooses option 1 for audio, use a separate `sermon-audio` bucket with `audio/mpeg` and its own limit, rather than loosening the image bucket.
- Agents never hold the service-role key and never upload. Read-only checks below use `SELECT` only.

## Owner setup

All in the Supabase dashboard, in the later setup window. Do nothing that enables billing or a paid add-on.

1. **Check the plan.** On **Usage**, note the current Storage size and egress limits and the current usage. Record the numbers in `docs/ops/supabase-change-ledger.md`, or ask Data to. No quota is assumed.
2. **Create the bucket.** Go to **Storage → New bucket**, name it `site-media`, set it to public, set the file size limit to 5 MB and the allowed MIME types as listed above. This is a live change: give the artifact-specific go first and record it in the ledger.
3. **Verify access (read-only, an agent may run it):**
   ```sql
   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'site-media';
   select policyname, roles, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects';
   ```
   Expect one public bucket with the limits you set, and no `INSERT`, `UPDATE`, `DELETE` or `ALL` policy that includes `anon`, `authenticated` or `public`.
4. **Re-host the images.** For each image row in `wordpress-media-checklist.md`, download the original from WordPress (the "likely original" for the three derivatives, if it exists). If it is over 5 MB, export a copy with a long edge of at most 2400 px at about quality 82, in the same format or WebP. Keep the original file locally as provenance. Upload it to **Storage → site-media** at the checklist's key, using **Create folder** for the year and month.
5. **Check the upload count (read-only):**
   ```sql
   select count(*) from storage.objects where bucket_id = 'site-media' and name like 'wordpress/%';
   ```
   Expect 70 once every image is up, or 111 if audio shares the bucket.
6. **Point the database at Storage.** This step writes. Data prepares the `UPDATE` from the checklist's path-to-key map, and it runs only with the owner's go, the backup confirmation and a ledger entry under the live-project policy. No such SQL ships in this PR.
7. **New and changing images.** Upload under `uploads/...`, copy the public URL, paste it into the record's image field in `/admin`, and write alt text for any image shown on a public page.
8. **Monitor.** Check **Usage** for Storage size and egress monthly and before large uploads. Record the actual figures.

## Cutover gate

WordPress media is retired only when all of these hold:

- `wordpress-media-audit.sql` returns **zero rows** (live, read-only).
- The `tests/media/no-wordpress-media.test.ts` allowlist is empty and `--code` reports 0.
- The Storage object count matches the checklist for every kind the owner chose to re-host.
- Re-hosted URLs render on the preview, and still render with WordPress unreachable.

This runbook grants no migration, upload or cutover authority on its own.
