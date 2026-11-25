import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MEDIA_COLUMN_NAME,
  MEDIA_URL_COLUMNS,
  auditSql,
  checklistMarkdown,
  codeReferences,
  inventory,
  isWordPressMedia,
  likelyOriginal,
  loadSeedSources,
  mediaKind,
  needsSafeRename,
  publicStorageUrl,
  storageKey,
  uploadPath,
} from './wordpress-inventory'

const root = process.cwd()
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')
/** Synthetic WordPress URLs live outside src/ so the source guard needs no exception. */
const fixture = JSON.parse(read('scripts/media/fixtures/wordpress-urls.json')) as {
  urls: Record<'full' | 'www' | 'relative' | 'encoded' | 'theme', string>
  records: Record<string, unknown>[]
  code: string[]
}

/** `create table <name> ( ... );` blocks from schema.sql, mapped to their column names. */
function schemaColumns(): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>()
  for (const match of read('supabase/schema.sql').matchAll(/create table (?:if not exists )?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    const columns = new Set<string>()
    for (const line of match[2].split('\n')) {
      const column = /^\s+([a-z_][a-z0-9_]*)\s+[a-z]/i.exec(line)?.[1]
      if (column && !/^(constraint|primary|unique|check|foreign)$/i.test(column)) columns.add(column)
    }
    tables.set(match[1], columns)
  }
  return tables
}

describe('media column registry', () => {
  it('lists exactly the media URL columns in schema.sql', () => {
    const schema = schemaColumns()
    const listed = MEDIA_URL_COLUMNS.map(c => `${c.table}.${c.column}`)
    for (const { table, column } of MEDIA_URL_COLUMNS) {
      expect(schema.get(table)?.has(column), `${table}.${column} missing from schema.sql`).toBe(true)
    }
    const inSchema = [...schema].flatMap(([table, columns]) =>
      [...columns].filter(column => MEDIA_COLUMN_NAME.test(column)).map(column => `${table}.${column}`))
    expect(inSchema.sort()).toEqual([...listed].sort())
    expect(listed).toHaveLength(25)
    expect(MEDIA_URL_COLUMNS.filter(c => c.array).map(c => c.column)).toEqual(['gallery_urls', 'video_urls'])
  })

  it('excludes form, CTA and navigation links', () => {
    for (const column of ['churchsuite_form_url', 'external_url', 'cta_url', 'website_url']) {
      expect(MEDIA_COLUMN_NAME.test(column)).toBe(false)
    }
  })
})

describe('URL helpers', () => {
  it('detects both legacy forms and nothing else', () => {
    expect(isWordPressMedia(fixture.urls.full)).toBe(true)
    expect(isWordPressMedia(fixture.urls.www)).toBe(true)
    expect(isWordPressMedia(fixture.urls.relative)).toBe(true)
    expect(isWordPressMedia('https://x.supabase.co/storage/v1/object/public/site-media/wordpress/a.jpg')).toBe(false)
    expect(isWordPressMedia(null)).toBe(false)
  })

  it('extracts the upload path without query or fragment', () => {
    expect(uploadPath(fixture.urls.encoded)).toBe('2024/04/a b.jpg')
    expect(uploadPath(fixture.urls.theme)).toBeNull()
  })

  it('classifies kinds and WordPress derivatives', () => {
    expect(mediaKind('2025/05/511-smaller.mp3')).toBe('audio')
    expect(mediaKind('2024/04/a.JPEG')).toBe('image')
    expect(mediaKind('2024/04/a.avif')).toBe('image')
    expect(mediaKind('2024/04/a')).toBe('other')
    expect(likelyOriginal('2024/04/Mollywall-scaled-e1714258419441.jpeg')).toBe('2024/04/Mollywall.jpeg')
    expect(likelyOriginal('2024/04/a-1024x683.jpg')).toBe('2024/04/a.jpg')
    expect(likelyOriginal('2022/12/kids-newborns_600x400-1.jpg')).toBeNull()
  })

  it('maps uploads to a provenance-preserving, URL-encoded key', () => {
    expect(storageKey('2024/04/a.jpg')).toBe('wordpress/2024/04/a.jpg')
    expect(needsSafeRename('2024/04/a b.jpg')).toBe(true)
    expect(needsSafeRename('2024/04/A-b_1.jpg')).toBe(false)
    expect(publicStorageUrl('wordpress/2024/04/a b.jpg', 'site-media', 'ref'))
      .toBe('https://ref.supabase.co/storage/v1/object/public/site-media/wordpress/2024/04/a%20b.jpg')
  })
})

describe('inventory', () => {
  const tables = [
    {
      table: 'one_time_events',
      file: 'fixture.json',
      records: fixture.records,
    },
  ]

  it('de-duplicates by path, checks arrays, and reports unparsed values', () => {
    const { items, unparsed } = inventory(tables)
    expect(items.map(i => i.path)).toEqual(['2024/01/x.jpg', '2024/02/y.png'])
    expect(items[0].references.map(r => r.slug)).toEqual(['a', 'b'])
    expect(items[1].references[0].column).toBe('gallery_urls')
    expect(unparsed).toEqual([{ table: 'one_time_events', column: 'featured_image_url', slug: 'd', file: 'fixture.json' }])
  })

  it('accounts for every WordPress reference in the generated seed SQL', () => {
    const { items, unparsed } = inventory(loadSeedSources(root))
    const refs = items.reduce((sum, item) => sum + item.references.length, 0) + unparsed.length
    const inSeed = read('supabase/ops/2026-11-20-seed.sql').match(/thrivevineyard\.com\/wp-content/g) ?? []
    expect(refs).toBe(inSeed.length)
    expect(unparsed).toEqual([])
  })
})

describe('audit SQL', () => {
  const sql = auditSql()

  it('is a single read-only SELECT returning counts and IDs, never values', () => {
    const body = sql.replace(/^--.*$/gm, '').trim()
    expect(body.startsWith('with hits as (')).toBe(true)
    expect(body.split(';').filter(s => s.trim())).toHaveLength(1)
    expect(body).not.toMatch(/\b(insert|update|delete|alter|create|drop|grant|truncate|copy)\b/i)
    expect(body).toMatch(/select table_name, column_name, kind, count\(\*\) as refs/)
    for (const { table, column, array } of MEDIA_URL_COLUMNS) {
      expect(body).toContain(array ? `unnest(r.${column})` : `where r.${column} ~*`)
      expect(body).toContain(`from public.${table} r`)
    }
    // UNION takes column names from its first branch, so every branch aliases them.
    expect(body.match(/ as table_name, '\w+' as column_name, /g)).toHaveLength(MEDIA_URL_COLUMNS.length)
    // Only constant labels, the computed kind and r.id are projected.
    expect(body).not.toMatch(/select[^\n]*r\.(?!id::text)\w+[^\n]*\n\s+from/i)
  })

  it('rejects unsafe identifiers', () => {
    expect(() => auditSql([{ table: 'x; drop table y', column: 'a' }])).toThrow(/identifier/)
  })
})

describe('generated files are current', () => {
  it('audit SQL matches the generator', () => {
    expect(read('supabase/ops/media/wordpress-media-audit.sql')).toBe(auditSql())
  })

  it('checklist matches the generator', () => {
    const { items, unparsed } = inventory(loadSeedSources(root))
    expect(read('supabase/ops/media/wordpress-media-checklist.md')).toBe(checklistMarkdown(items, unparsed))
  })
})

describe('code references', () => {
  it('finds template-literal paths under a WordPress base and full URLs', () => {
    const content = fixture.code.join('\n')
    expect(codeReferences('x.ts', content)).toEqual([
      { file: 'x.ts', line: 2, path: '2024/04/a.jpg' },
      { file: 'x.ts', line: 3, path: '2024/05/b.png' },
    ])
  })
})
