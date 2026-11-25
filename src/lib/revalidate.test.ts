import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const revalidatePath = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidatePath }))

import { entityPaths, revalidateEntity, SITEMAP_TABLES, type RevalidateEntity } from './revalidate'

const SERIES = { pattern: '/sermons/series/[slug]', type: 'page' }

/** Paths for slug "x". Publish, unpublish and edit share this set. */
const expected: Record<RevalidateEntity, unknown[]> = {
  announcement: ['/admin/announcements', '/'],
  one_time_event: ['/admin/events', '/events', '/events/x', '/', '/sitemap.xml'],
  recurring_event: ['/admin/recurring-events', '/admin/events', '/events', '/events/x', '/', '/sitemap.xml'],
  group: ['/admin/groups', '/groups', '/groups/x', '/'],
  outreach: ['/admin/outreach', '/outreach', '/outreach/x', '/'],
  ministry: ['/admin/ministries', '/ministries/x', '/sitemap.xml'],
  landing_page: ['/admin/landing-pages', '/x', '/sitemap.xml'],
  sermon: ['/admin/sermons', '/sermons', '/sermons/series', '/sermons/x', '/', '/sitemap.xml', SERIES],
  sermon_series: [
    '/admin/sermon-series', '/admin/sermons', '/sermons', '/sermons/series', '/sermons/series/x', '/', '/sitemap.xml',
    { pattern: '/sermons/[slug]', type: 'page' },
  ],
  speaker: [
    '/admin/speakers', '/admin/sermons', '/sermons', '/sermons/series', '/',
    { pattern: '/sermons/[slug]', type: 'page' }, SERIES,
  ],
  staff: ['/admin/staff', '/about/team', '/about'],
}

describe('entityPaths', () => {
  for (const [entity, paths] of Object.entries(expected) as [RevalidateEntity, unknown[]][]) {
    it(`${entity}: publish, unpublish and edit refresh its list, detail, home and sitemap pages`, () => {
      expect(entityPaths(entity, 'x')).toEqual(paths)
    })
    it(`${entity}: a slug change also refreshes the old detail path`, () => {
      const moved = entityPaths(entity, 'x', 'old')
      const detail = (paths as unknown[]).find(p => typeof p === 'string' && p.endsWith('/x'))
      if (detail) expect(moved).toContain((detail as string).replace(/x$/, 'old'))
      else expect(moved).toEqual(paths)
    })
  }
  it('lists each path once', () => {
    expect(entityPaths('landing_page', 'x', 'x')).toEqual(['/admin/landing-pages', '/x', '/sitemap.xml'])
  })
})

describe('revalidateEntity', () => {
  it('passes plain paths and dynamic patterns to Next', () => {
    revalidatePath.mockClear()
    revalidateEntity('sermon', 'x')
    expect(revalidatePath).toHaveBeenCalledWith('/sermons/x')
    expect(revalidatePath).toHaveBeenCalledWith('/sermons/series/[slug]', 'page')
    expect(revalidatePath).toHaveBeenCalledTimes(expected.sermon.length)
  })
})

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8')

describe('drift guards', () => {
  it('refreshes /sitemap.xml for exactly the tables src/app/sitemap.ts lists', () => {
    const tables = [...read('src/app/sitemap.ts').matchAll(/from\('([a-z_]+)'\)/g)].map(m => m[1]).sort()
    expect(Object.keys(SITEMAP_TABLES).sort()).toEqual(tables)
    const withSitemap = (Object.keys(expected) as RevalidateEntity[]).filter(e => entityPaths(e, 'x').includes('/sitemap.xml')).sort()
    expect(Object.values(SITEMAP_TABLES).filter(Boolean).sort()).toEqual(withSitemap)
  })
  it('admin pages call revalidateEntity(), never revalidatePath() directly', () => {
    const adminDir = path.join(process.cwd(), 'src/app/admin')
    const pages = (readdirSync(adminDir, { recursive: true }) as string[]).filter(f => f.endsWith('page.tsx'))
    const direct = pages.filter(f => /revalidatePath\(/.test(read(path.join('src/app/admin', f))))
    expect(direct).toEqual([])
  })
})
