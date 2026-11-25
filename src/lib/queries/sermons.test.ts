import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '../supabase/server'
import {
  getLatestSermon,
  getSermonBySlug,
  getSermonSeries,
  getSermons,
  getSermonsBySeriesSlug,
  type Sermon,
  type SermonSeries,
} from './sermons'

// Synthetic fixtures only; not real ministry data.
const rawSeries: SermonSeries = {
  id: 'series-test-1',
  slug: 'test-series',
  title: 'Test Series &amp; More',
  description: 'Synthetic series &#8217;description&#8217;',
  thumbnail_url: null,
  start_date: null,
  end_date: null,
  seo_title: 'SEO &quot;Series&quot;',
  seo_description: null,
  og_image_url: null,
  published_at: '2000-01-01T00:00:00Z',
  created_at: '2000-01-01T00:00:00Z',
}

const rawSermon: Sermon = {
  id: 'sermon-test-1',
  slug: 'test-sermon',
  title: 'Test Faith &amp; Works',
  description: 'Test&#039;s synthetic description &hellip;',
  speaker_id: null,
  series_id: 'series-test-1',
  scripture_references: ['Test 1:1'],
  audio_url: null,
  video_url: null,
  youtube_url: null,
  thumbnail_url: null,
  duration_seconds: null,
  preached_at: '2000-01-02T00:00:00Z',
  location: null,
  topics: null,
  service_type: null,
  seo_title: 'Test &#x27;SEO&#x27; title',
  seo_description: 'A &amp;amp; B',
  og_image_url: null,
  published_at: '2000-01-02T00:00:00Z',
  created_at: '2000-01-02T00:00:00Z',
  speaker: null,
  series: rawSeries,
}

type Result = { data: unknown; error: unknown }

/** Chainable, thenable stand-in for the Supabase query builder. */
function fakeBuilder(result: Result) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'not', 'order', 'limit', 'eq']) {
    builder[method] = () => builder
  }
  builder.single = () => Promise.resolve(result)
  builder.then = (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return builder
}

function mockTables(tables: Record<string, Result>) {
  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => fakeBuilder(tables[table]),
  } as unknown as Awaited<ReturnType<typeof createClient>>)
}

describe('sermon queries decode HTML entities at read time', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset()
  })

  it('getLatestSermon decodes sermon and nested series text', async () => {
    mockTables({ sermons: { data: structuredClone(rawSermon), error: null } })

    const sermon = await getLatestSermon()

    expect(sermon?.title).toBe('Test Faith & Works')
    expect(sermon?.description).toBe("Test's synthetic description …")
    expect(sermon?.seo_title).toBe("Test 'SEO' title")
    expect(sermon?.seo_description).toBe('A &amp; B')
    expect(sermon?.series?.title).toBe('Test Series & More')
    expect(sermon?.series?.description).toBe('Synthetic series ’description’')
    expect(sermon?.series?.seo_title).toBe('SEO "Series"')
    // Non-text fields pass through untouched.
    expect(sermon?.slug).toBe('test-sermon')
    expect(sermon?.scripture_references).toEqual(['Test 1:1'])
  })

  it('getSermonBySlug decodes the title', async () => {
    mockTables({ sermons: { data: structuredClone(rawSermon), error: null } })
    expect((await getSermonBySlug('test-sermon'))?.title).toBe('Test Faith & Works')
  })

  it('getSermons decodes every row and tolerates a null series', async () => {
    mockTables({
      sermons: { data: [structuredClone(rawSermon), { ...structuredClone(rawSermon), series: null }], error: null },
    })

    const sermons = await getSermons(2)

    expect(sermons.map((s) => s.title)).toEqual(['Test Faith & Works', 'Test Faith & Works'])
    expect(sermons[1].series).toBeNull()
  })

  it('getSermonSeries decodes series text', async () => {
    mockTables({ sermon_series: { data: [structuredClone(rawSeries)], error: null } })

    const [series] = await getSermonSeries()

    expect(series.title).toBe('Test Series & More')
    expect(series.seo_title).toBe('SEO "Series"')
  })

  it('getSermonsBySeriesSlug decodes sermon rows', async () => {
    mockTables({
      sermon_series: { data: { id: 'series-test-1' }, error: null },
      sermons: { data: [structuredClone(rawSermon)], error: null },
    })

    const [sermon] = await getSermonsBySeriesSlug('test-series')

    expect(sermon.title).toBe('Test Faith & Works')
    expect(sermon.series?.title).toBe('Test Series & More')
  })

  it('keeps existing empty results on error', async () => {
    mockTables({ sermons: { data: null, error: { message: 'test error' } } })
    expect(await getLatestSermon()).toBeNull()
    expect(await getSermons()).toEqual([])
  })
})
