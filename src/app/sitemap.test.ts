import { describe, expect, it, vi } from 'vitest'

// The page under test imports the server Supabase client; it is never called here.
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { STATIC_ROUTES, buildStaticEntries, shouldFallbackToStatic } from './sitemap'

const PREVIOUS_ROUTES = [
  '',
  '/plan-a-visit',
  '/sermons',
  '/sermons/series',
  '/events',
  '/about',
  '/about/team',
  '/give',
  '/kids-youth',
  '/groups',
  '/outreach',
]

describe('STATIC_ROUTES', () => {
  it('includes /get-connected and every previously listed route', () => {
    expect(STATIC_ROUTES).toContain('/get-connected')
    for (const route of PREVIOUS_ROUTES) expect(STATIC_ROUTES).toContain(route)
  })

  it('does not include /feedback', () => {
    expect(STATIC_ROUTES).not.toContain('/feedback')
  })

  it('has no duplicates', () => {
    expect(new Set(STATIC_ROUTES).size).toBe(STATIC_ROUTES.length)
  })

  it('uses root-relative paths (or empty string for home)', () => {
    for (const route of STATIC_ROUTES) {
      expect(route === '' || route.startsWith('/')).toBe(true)
    }
  })
})

describe('buildStaticEntries', () => {
  it('prefixes every route with the given base', () => {
    const entries = buildStaticEntries('https://example.test')
    expect(entries).toHaveLength(STATIC_ROUTES.length)
    expect(entries[0].url).toBe('https://example.test')
    expect(entries.map(e => e.url)).toContain('https://example.test/get-connected')
  })
})

describe('shouldFallbackToStatic', () => {
  it('is strict in production', () => {
    expect(shouldFallbackToStatic('production')).toBe(false)
  })

  it.each(['preview', 'development', undefined])('falls back for %s', env => {
    expect(shouldFallbackToStatic(env)).toBe(true)
  })
})
