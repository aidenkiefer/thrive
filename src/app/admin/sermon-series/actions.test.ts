import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAdminDb, formOf, type FakeQuery, type FakeResult } from './fake-admin-db'

const mocks = vi.hoisted(() => {
  class Redirect extends Error {
    constructor(readonly url: string) { super(`NEXT_REDIRECT ${url}`) }
  }
  return { Redirect, requireAdmin: vi.fn(), adminDb: vi.fn(), revalidatePath: vi.fn() }
})
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/admin-db', () => ({ adminDb: mocks.adminDb }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new mocks.Redirect(url) } }))

import { assertDateRange, seriesUnpublishProblem } from '@/lib/admin-validation'
import { saveSeries } from './actions'

const ACTOR = '11111111-1111-4111-8111-111111111111'
const SERIES_ID = '22222222-2222-4222-8222-222222222222'
const NEW_ID = '33333333-3333-4333-8333-333333333333'
const VALID = { title: 'Test Series Alpha', slug: 'test-series-alpha', start_date: '2026-01-04', end_date: '2026-02-01' }

function setup(respond: (query: FakeQuery) => FakeResult = () => ({})) {
  const fake = fakeAdminDb(query => (query.op === 'insert' ? { data: { id: NEW_ID } } : respond(query)))
  mocks.adminDb.mockResolvedValue(fake.db)
  return fake
}

/** Runs the action and returns the feedback it redirected with. */
async function submit(fields: Record<string, string>) {
  const error = await saveSeries(formOf(fields)).then(() => null, (e: unknown) => e)
  if (!(error instanceof mocks.Redirect)) throw error ?? new Error('expected a redirect')
  return Object.fromEntries(new URL(error.url, 'https://admin.test').searchParams)
}

/** An existing series row with the given publish state and published sermon count. */
const existing = (publishedAt: string | null, publishedSermons: number) => (query: FakeQuery): FakeResult => {
  if (query.table === 'sermon_series') return { data: { slug: VALID.slug, published_at: publishedAt } }
  if (query.table === 'sermons') return { count: publishedSermons }
  return {}
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireAdmin.mockResolvedValue({ email: 'staff@example.test', actorId: ACTOR, role: 'admin' })
})

describe('saveSeries', () => {
  it('rejects a signed-out caller before touching the database', async () => {
    mocks.requireAdmin.mockRejectedValue(new mocks.Redirect('/admin/login'))
    await expect(saveSeries(formOf(VALID))).rejects.toMatchObject({ url: '/admin/login' })
    expect(mocks.adminDb).not.toHaveBeenCalled()
  })

  it('creates a draft, then publishes it with the staff actor', async () => {
    const { queries, rpcs } = setup()
    expect(await submit({ ...VALID, published: 'on', thumbnail_url: 'https://example.test/a.jpg' })).toMatchObject({ saved: 'new' })
    const insert = queries.find(q => q.op === 'insert')
    expect(insert?.table).toBe('sermon_series')
    expect(insert?.row).toMatchObject({ slug: 'test-series-alpha', start_date: '2026-01-04', end_date: '2026-02-01', thumbnail_url: 'https://example.test/a.jpg' })
    expect(insert?.row).not.toHaveProperty('published_at')
    expect(rpcs).toEqual([{ fn: 'cms_set_published', p_entity_type: 'sermon_series', p_entity_id: NEW_ID, p_publish: true, p_actor_id: ACTOR }])
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/sermons/series/test-series-alpha')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/sermons')
  })

  it.each([
    ['thumbnail_url', 'Thumbnail URL must use HTTPS'],
    ['og_image_url', 'Social share image URL must use HTTPS'],
  ])('rejects a non-HTTPS %s', async (field, message) => {
    const { queries } = setup()
    expect(await submit({ ...VALID, [field]: 'http://example.test/a.jpg' })).toMatchObject({ error: message, form: 'new' })
    expect(queries).toEqual([])
  })

  it('rejects an end date before the start date, and allows a one-day series', async () => {
    const { queries } = setup()
    expect(await submit({ ...VALID, start_date: '2026-03-08', end_date: '2026-03-01' }))
      .toMatchObject({ error: "End date can't be before the start date" })
    expect(queries).toEqual([])
    expect(await submit({ ...VALID, start_date: '2026-03-08', end_date: '2026-03-08' })).toMatchObject({ saved: 'new' })
  })

  it('rejects a duplicate slug on create', async () => {
    const { queries } = setup(q => (q.table === 'sermon_series' ? { data: { id: SERIES_ID } } : {}))
    expect(await submit(VALID)).toMatchObject({ error: 'That series URL already exists' })
    expect(queries.some(q => q.op === 'insert')).toBe(false)
  })

  it('keeps the slug read-only after create', async () => {
    setup(existing(null, 0))
    expect(await submit({ ...VALID, id: SERIES_ID, slug: 'test-series-beta' }))
      .toMatchObject({ error: 'Changing a series URL requires a redirect plan', form: SERIES_ID })
  })

  it('blocks unpublishing while published sermons reference the series', async () => {
    const { queries, rpcs } = setup(existing('2026-01-01T00:00:00Z', 2))
    expect(await submit({ ...VALID, id: SERIES_ID })).toMatchObject({
      error: "Can't unpublish this series: 2 published sermons belong to it. Unpublish those sermons or move them to another series first.",
    })
    const count = queries.find(q => q.table === 'sermons')
    expect(count?.filters).toEqual([`series_id=${SERIES_ID}`, 'published_at not is null'])
    expect(rpcs).toEqual([])
    expect(queries.some(q => q.op === 'update')).toBe(false)
  })

  it('unpublishes, then writes content, when no published sermon references it', async () => {
    const { queries, rpcs } = setup(existing('2026-01-01T00:00:00Z', 0))
    expect(await submit({ ...VALID, id: SERIES_ID })).toMatchObject({ saved: SERIES_ID })
    expect(rpcs).toEqual([expect.objectContaining({ p_entity_id: SERIES_ID, p_publish: false, p_actor_id: ACTOR })])
    expect(queries.filter(q => q.op === 'update').map(q => q.filters)).toEqual([[`id=${SERIES_ID}`]])
  })

  it('does not count sermons when the series is already a draft or stays published', async () => {
    const draft = setup(existing(null, 3))
    await submit({ ...VALID, id: SERIES_ID })
    expect(draft.queries.some(q => q.table === 'sermons')).toBe(false)
    const published = setup(existing('2026-01-01T00:00:00Z', 3))
    expect(await submit({ ...VALID, id: SERIES_ID, published: 'on' })).toMatchObject({ saved: SERIES_ID })
    expect(published.queries.some(q => q.table === 'sermons')).toBe(false)
  })
})

describe('series validation helpers', () => {
  it('seriesUnpublishProblem allows zero sermons and names one or many', () => {
    expect(seriesUnpublishProblem(0)).toBeNull()
    expect(seriesUnpublishProblem(1)).toContain('1 published sermon belongs to it')
    expect(seriesUnpublishProblem(4)).toContain('4 published sermons belong to it')
  })
  it('assertDateRange ignores a missing date', () => {
    expect(() => assertDateRange('2026-03-08', null)).not.toThrow()
    expect(() => assertDateRange(null, '2026-03-01')).not.toThrow()
  })
})
