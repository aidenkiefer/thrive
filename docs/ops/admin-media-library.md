# File-backed admin photo library

The admin page `/admin/media` uses the existing active-staff guard and a deterministic file-backed catalog. `/admin/media/image/[id]` is also under admin middleware and rechecks active staff membership before looking up any image. It serves only catalog IDs and two known variants, never a request-supplied path. Responses are private/no-store WebP with nosniff.

`npm run media:catalog` scans repository image files while excluding hidden/generated folders, dependencies, build outputs and symlinks. `predev` and `prebuild` run it automatically. It includes images outside public, particularly media-library originals. Current source inventory: 92 images. Existing source and public image files are not moved or modified.

The script uses the directly declared Sharp build dependency to generate `.media-previews/catalog.json`, bounded thumbnails (600x450) and full-view previews (2200x1800), auto-oriented without enlargement. IDs depend on relative source path and bytes; cached output is reused when unchanged. Generation fails on an undecodable supported image rather than silently dropping it. The generated directory is ignored, reproducible, and not served from public. No image transformation occurs in the request handler.

`next.config.ts` includes the catalog/private previews in the admin page and image-handler serverless traces. Verify the route trace includes both variants for every catalog ID before deployment. A clean clone must run the normal dev/build command before serving the library. Restart development after regenerating a catalog for added/changed assets because the server memoizes the build's manifest.

The grid uses normal same-origin image requests so the staff cookie reaches the private route; it intentionally avoids the public image optimizer. The client receives only catalog metadata and the private preview URLs, with no Supabase/owner credential. File-backed admin tools omit the database table count rather than query a nonexistent table.

Browser interaction verification can use an isolated temporary component fixture with already-public sample photos. Remove it before build/push and keep this evidence separate from an actual staff session. No permanent preview route or auth bypass ships. Staff-session real-image verification remains an independent QA check when the owner session is available.
