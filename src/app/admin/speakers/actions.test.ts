import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAdminDb, formOf, type FakeQuery, type FakeResult } from '../sermon-series/fake-admin-db'

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

import { saveSpeaker } from './actions'

const SPEAKER_ID = '44444444-4444-4444-8444-444444444444'
const VALID = { name: 'Test Speaker One', slug: 'test-speaker-one' }

function setup(respond: (query: FakeQuery) => FakeResult = () => ({})) {
  const fake = fakeAdminDb(respond)
  mocks.adminDb.mockResolvedValue(fake.db)
  return fake
}

async function submit(fields: Record<string, string>) {
  const error = await saveSpeaker(formOf(fields)).then(() => null, (e: unknown) => e)
  if (!(error instanceof mocks.Redirect)) throw error ?? new Error('expected a redirect')
  return Object.fromEntries(new URL(error.url, 'https://admin.test').searchParams)
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireAdmin.mockResolvedValue({ email: 'staff@example.test', actorId: 'actor', role: 'admin' })
})

describe('saveSpeaker', () => {
  it('rejects a signed-out caller before touching the database', async () => {
    mocks.requireAdmin.mockRejectedValue(new mocks.Redirect('/admin/login'))
    await expect(saveSpeaker(formOf(VALID))).rejects.toMatchObject({ url: '/admin/login' })
    expect(mocks.adminDb).not.toHaveBeenCalled()
  })

  it('adds a speaker with no publish step and refreshes the sermon form', async () => {
    const { queries, rpcs } = setup()
    const fields = { ...VALID, title: 'Guest', photo_url: 'https://example.test/p.jpg', email: 'speaker@example.test' }
    expect(await submit(fields)).toMatchObject({ saved: 'new' })
    expect(queries.find(q => q.op === 'insert')?.row).toEqual({
      slug: 'test-speaker-one', name: 'Test Speaker One', title: 'Guest', bio: null,
      photo_url: 'https://example.test/p.jpg', email: 'speaker@example.test',
    })
    expect(rpcs).toEqual([])
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/sermons')
  })

  it('rejects a non-HTTPS photo URL', async () => {
    const { queries } = setup()
    expect(await submit({ ...VALID, photo_url: 'http://example.test/p.jpg' })).toMatchObject({ error: 'Photo URL must use HTTPS' })
    expect(queries).toEqual([])
  })

  it('rejects an invalid email and a missing name', async () => {
    setup()
    expect(await submit({ ...VALID, email: 'not-an-email' })).toMatchObject({ error: 'Email must be a valid email address' })
    expect(await submit({ ...VALID, name: '  ' })).toMatchObject({ error: 'Name is required' })
  })

  it('rejects a duplicate slug on create', async () => {
    const { queries } = setup(q => (q.op === 'select' ? { data: { id: SPEAKER_ID } } : {}))
    expect(await submit(VALID)).toMatchObject({ error: 'That speaker slug already exists' })
    expect(queries.some(q => q.op === 'insert')).toBe(false)
  })

  it('updates an existing speaker and keeps its slug read-only', async () => {
    const { queries } = setup(q => (q.op === 'select' ? { data: { slug: VALID.slug } } : {}))
    expect(await submit({ ...VALID, id: SPEAKER_ID, bio: 'Synthetic bio.' })).toMatchObject({ saved: SPEAKER_ID })
    expect(queries.find(q => q.op === 'update')).toMatchObject({ filters: [`id=${SPEAKER_ID}`], row: { bio: 'Synthetic bio.' } })
    expect(await submit({ ...VALID, id: SPEAKER_ID, slug: 'test-speaker-two' }))
      .toMatchObject({ error: "A speaker's URL slug can't change after it is created" })
  })
})
