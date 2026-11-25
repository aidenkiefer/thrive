/**
 * Read-only WordPress media inventory (#49).
 *
 * Pure helpers used by `scripts/media-inventory.ts` to list every WordPress
 * upload still referenced by seed data, to generate the SELECT-only database
 * audit, and to map each upload to a deterministic Supabase Storage object key.
 * Nothing here performs network, storage or database writes.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Both legacy forms checked by the source guard in `tests/media/no-wordpress-media.test.ts`. */
export const WORDPRESS_MEDIA_PATTERN = /thrivevineyard\.com\/wp-content|wp-content\/uploads/i

/** The same pattern in PostgreSQL regex syntax, for the `~*` operator. */
export const WORDPRESS_MEDIA_SQL_PATTERN = 'thrivevineyard\\.com/wp-content|wp-content/uploads'

/** Proposed public bucket. The owner may choose another name at setup; pass `--bucket`. */
export const DEFAULT_BUCKET = 'site-media'

/** Object-key prefix that keeps the WordPress upload path as provenance. */
export const WORDPRESS_KEY_PREFIX = 'wordpress'

export type MediaKind = 'image' | 'audio' | 'video' | 'document' | 'other'

export type MediaColumn = { table: string; column: string; array?: boolean }

/**
 * Every media URL column in `supabase/schema.sql` (25). The unit test fails if a
 * listed column disappears or a new media-named column is added without being
 * listed, so the audit cannot silently skip one.
 */
export const MEDIA_URL_COLUMNS: readonly MediaColumn[] = [
  { table: 'speakers', column: 'photo_url' },
  { table: 'sermon_series', column: 'thumbnail_url' },
  { table: 'sermon_series', column: 'og_image_url' },
  { table: 'sermons', column: 'audio_url' },
  { table: 'sermons', column: 'video_url' },
  { table: 'sermons', column: 'youtube_url' },
  { table: 'sermons', column: 'thumbnail_url' },
  { table: 'sermons', column: 'og_image_url' },
  { table: 'recurring_events', column: 'featured_image_url' },
  { table: 'recurring_events', column: 'gallery_urls', array: true },
  { table: 'recurring_events', column: 'video_urls', array: true },
  { table: 'recurring_events', column: 'og_image_url' },
  { table: 'one_time_events', column: 'featured_image_url' },
  { table: 'one_time_events', column: 'og_image_url' },
  { table: 'groups', column: 'featured_image_url' },
  { table: 'groups', column: 'og_image_url' },
  { table: 'ministries', column: 'featured_image_url' },
  { table: 'ministries', column: 'og_image_url' },
  { table: 'announcements', column: 'featured_image_url' },
  { table: 'announcements', column: 'og_image_url' },
  { table: 'staff', column: 'photo_url' },
  { table: 'landing_pages', column: 'hero_image_url' },
  { table: 'landing_pages', column: 'og_image_url' },
  { table: 'outreach', column: 'featured_image_url' },
  { table: 'outreach', column: 'og_image_url' },
]

/** Column names that hold media rather than form, CTA or navigation links. */
export const MEDIA_COLUMN_NAME = /(?:image|photo|thumbnail|audio|video|youtube|gallery)_urls?$/

const KINDS: Record<string, MediaKind> = {}
for (const ext of ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'tif', 'tiff', 'bmp', 'heic']) KINDS[ext] = 'image'
for (const ext of ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'oga']) KINDS[ext] = 'audio'
for (const ext of ['mp4', 'm4v', 'mov', 'webm']) KINDS[ext] = 'video'
KINDS.pdf = 'document'

export function isWordPressMedia(value: unknown): value is string {
  return typeof value === 'string' && WORDPRESS_MEDIA_PATTERN.test(value)
}

/** Path below `/wp-content/uploads/` with query and fragment removed, or null. */
export function uploadPath(url: string): string | null {
  const match = /\/wp-content\/uploads\/([^?#\s]+)/i.exec(url.trim())
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function mediaKind(path: string): MediaKind {
  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase()
  return (ext && KINDS[ext]) || 'other'
}

/**
 * WordPress serves resized copies as `name-600x400.jpg` and edited copies as
 * `name-e1714258419441.jpg`; `-scaled` is its large-upload derivative. Returns the
 * likely original so the operator can fetch the best source, or null.
 */
export function likelyOriginal(path: string): string | null {
  const original = path.replace(/(?:-scaled)?(?:-e\d{10,})?(?:-\d+x\d+)?(\.[a-z0-9]+)$/i, '$1')
  return original === path ? null : original
}

/** Deterministic Storage object key that mirrors the WordPress upload path. */
export function storageKey(path: string): string {
  return `${WORDPRESS_KEY_PREFIX}/${path}`
}

/** Keys outside this set are legal in Storage but awkward in URLs; flag them for a rename. */
export function needsSafeRename(path: string): boolean {
  return !/^[A-Za-z0-9._\-/]+$/.test(path)
}

/** Public URL shape for a key; the project ref stays out of git. */
export function publicStorageUrl(key: string, bucket = DEFAULT_BUCKET, projectRef = '<project-ref>'): string {
  return `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`
}

/** Parsed WordPress exports that feed the generated seed SQL (`scripts/seed-sql.ts`). */
export const SEED_SOURCES = [
  { table: 'one_time_events', file: 'migration-files/parsed/one_time_events.json' },
  { table: 'recurring_events', file: 'migration-files/parsed/recurring_events.json' },
  { table: 'sermons', file: 'migration-files/parsed/sermons.json' },
] as const

export function loadSeedSources(root: string): SourceTable[] {
  return SEED_SOURCES.map(({ table, file }) => ({
    table,
    file,
    records: JSON.parse(readFileSync(join(root, file), 'utf8')) as SourceRecord[],
  }))
}

export type SourceRecord = Record<string, unknown>
export type SourceTable = { table: string; file: string; records: SourceRecord[] }
export type Reference = { table: string; column: string; slug: string; file: string }
export type InventoryItem = {
  path: string
  kind: MediaKind
  key: string
  original: string | null
  rename: boolean
  references: Reference[]
}

function collect(value: unknown, column: string, found: Array<{ column: string; url: string }>) {
  if (isWordPressMedia(value)) found.push({ column, url: value })
  else if (Array.isArray(value)) value.forEach(entry => collect(entry, column, found))
}

/**
 * Inventory WordPress uploads in seed-source records. Only top-level fields are
 * columns; arrays are element-checked. Items are de-duplicated by upload path
 * and sorted, so the output is stable for the staleness test.
 */
export function inventory(tables: SourceTable[]): { items: InventoryItem[]; unparsed: Reference[] } {
  const byPath = new Map<string, InventoryItem>()
  const unparsed: Reference[] = []
  for (const { table, file, records } of tables) {
    records.forEach((record, index) => {
      const slug = typeof record.slug === 'string' ? record.slug : `#${index}`
      for (const [column, value] of Object.entries(record)) {
        const found: Array<{ column: string; url: string }> = []
        collect(value, column, found)
        for (const { url } of found) {
          const reference = { table, column, slug, file }
          const path = uploadPath(url)
          if (!path) {
            unparsed.push(reference)
            continue
          }
          const item = byPath.get(path) ?? {
            path,
            kind: mediaKind(path),
            key: storageKey(path),
            original: likelyOriginal(path),
            rename: needsSafeRename(path),
            references: [],
          }
          item.references.push(reference)
          byPath.set(path, item)
        }
      }
    })
  }
  const items = [...byPath.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.path.localeCompare(b.path))
  for (const item of items) item.references.sort((a, b) => `${a.table}.${a.column}.${a.slug}`.localeCompare(`${b.table}.${b.column}.${b.slug}`))
  return { items, unparsed }
}

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Unexpected identifier: ${name}`)
  return name
}

function kindSql(expression: string): string {
  return `case
      when ${expression} ~* '\\.(jpe?g|png|gif|webp|avif|svg|tiff?|bmp|heic)([?#]|$)' then 'image'
      when ${expression} ~* '\\.(mp3|m4a|wav|aac|ogg|oga)([?#]|$)' then 'audio'
      when ${expression} ~* '\\.(mp4|m4v|mov|webm)([?#]|$)' then 'video'
      when ${expression} ~* '\\.pdf([?#]|$)' then 'document'
      else 'other' end`
}

/**
 * One SELECT statement (CTE) over every media column. It returns counts by
 * table, column and media kind plus affected row IDs only: no URL values, names
 * or other row content. Safe for the live-project read-only rule.
 */
export function auditSql(columns: readonly MediaColumn[] = MEDIA_URL_COLUMNS): string {
  const pattern = `'${WORDPRESS_MEDIA_SQL_PATTERN}'`
  const parts = columns.map(({ table, column, array }) => {
    const t = quoteIdent(table)
    const c = quoteIdent(column)
    return array
      ? `  select '${t}' as table_name, '${c}' as column_name, ${kindSql('u.value')} as kind, r.id::text as row_id
    from public.${t} r cross join lateral unnest(r.${c}) as u(value)
    where u.value ~* ${pattern}`
      : `  select '${t}' as table_name, '${c}' as column_name, ${kindSql(`r.${c}`)} as kind, r.id::text as row_id
    from public.${t} r
    where r.${c} ~* ${pattern}`
  })
  return `-- Generated by scripts/media-inventory.ts --sql. Do not edit by hand:
-- src/lib/media/wordpress-inventory.test.ts fails if this file is stale.
--
-- Read-only WordPress media audit (#49). A single SELECT: run it in the Supabase
-- SQL editor or through the MCP execute_sql read-only rule. It returns counts and
-- row IDs only, never URL values or row content. Zero rows means no database
-- media column references WordPress. Array columns are checked per element; a
-- row with two WordPress elements counts twice and its ID appears twice.
with hits as (
${parts.join('\n  union all\n')}
)
select table_name, column_name, kind, count(*) as refs, count(distinct row_id) as rows,
       array_agg(distinct row_id order by row_id) as row_ids
from hits
group by table_name, column_name, kind
order by table_name, column_name, kind;
`
}

export function checklistMarkdown(items: InventoryItem[], unparsed: Reference[], bucket = DEFAULT_BUCKET): string {
  const refs = items.reduce((sum, item) => sum + item.references.length, 0)
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1)
  const summary = [...counts].map(([kind, n]) => `${n} ${kind}`).join(', ')
  const rows = items.map((item, index) => {
    const where = item.references.map(r => `${r.table}.${r.column}: \`${r.slug}\``).join('<br>')
    const notes = [
      item.original ? `derivative; try original \`${item.original}\`` : '',
      item.rename ? 'key needs a URL-safe rename' : '',
    ].filter(Boolean).join('; ')
    return `| ${index + 1} | ${item.kind} | \`${item.path}\` | ${where} | \`${item.key}\` | ${notes} |`
  })
  return `<!-- Generated by scripts/media-inventory.ts --checklist. Do not edit by hand:
src/lib/media/wordpress-inventory.test.ts fails if this file is stale. -->

# WordPress media re-host checklist (seed-held)

Source: \`migration-files/parsed/*.json\`, the input that \`scripts/seed-sql.ts\` turns into
\`supabase/ops/*-seed.sql\`. ${items.length} distinct uploads (${summary}) across ${refs} references.
Unparsed WordPress values: ${unparsed.length}.

Each upload maps to \`${bucket}/<key>\`, keeping the WordPress path as provenance. The live
database is checked separately with \`wordpress-media-audit.sql\`; code-held references are
reported by \`npx tsx scripts/media-inventory.ts --code\` and guarded by
\`tests/media/no-wordpress-media.test.ts\`. Do not tick items here: progress is measured by
the live audit and the Storage object check in \`README.md\`, which also holds the workflow.

| # | Kind | WordPress upload path | Referenced by (table.column: slug) | Storage key | Notes |
|---|---|---|---|---|---|
${rows.join('\n')}
${unparsed.length ? `\n## Unparsed values\n\n${unparsed.map(r => `- ${r.table}.${r.column}: \`${r.slug}\``).join('\n')}\n` : ''}`
}

export type CodeReference = { file: string; line: number; path: string | null }

/**
 * Code-held references: full WordPress URLs plus `${BASE}/path` template
 * literals where BASE is a WordPress uploads constant. Read-only; Experience and
 * Ops own the files it reports.
 */
export function codeReferences(file: string, content: string): CodeReference[] {
  const lines = content.split(/\r?\n/)
  const bases = new Set<string>()
  for (const line of lines) {
    const constant = /const\s+([A-Za-z_$][\w$]*)\s*=\s*['"`][^'"`]*wp-content\/uploads\/?['"`]/.exec(line)
    if (constant) bases.add(constant[1])
  }
  const found: CodeReference[] = []
  lines.forEach((line, index) => {
    for (const base of bases) {
      for (const match of line.matchAll(new RegExp(`\\$\\{${base.replace(/\$/g, '\\$')}\\}/([^\`'"\\s]+)`, 'g'))) {
        found.push({ file, line: index + 1, path: match[1] })
      }
    }
    for (const match of line.matchAll(/https?:\/\/[^\s'"`)]*wp-content\/uploads\/[^\s'"`)]+/gi)) {
      found.push({ file, line: index + 1, path: uploadPath(match[0]) })
    }
  })
  return found
}
