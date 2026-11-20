import { describe, expect, it, vi } from 'vitest'
import { isAdminInputError } from '../admin-validation'
import { publicationRolledBack, publishIntent, setPublished, type PublicationDb } from './publication'

const ACTOR = '11111111-1111-4111-8111-111111111111'
const ID = '22222222-2222-4222-8222-222222222222'

function fakeDb(result: { data: unknown; error: { code?: string; message?: string } | null }) {
  const rpc = vi.fn(async () => result)
  return { db: { rpc } as unknown as PublicationDb, rpc }
}

describe('setPublished', () => {
  it('calls cms_set_published with exactly the four parameters', async () => {
    const { db, rpc } = fakeDb({ data: '2026-11-19T10:00:00+00:00', error: null })
    await setPublished(db, { entityType: 'announcement', entityId: ID, publish: true, actorId: ACTOR })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('cms_set_published', {
      p_entity_type: 'announcement',
      p_entity_id: ID,
      p_publish: true,
      p_actor_id: ACTOR,
    })
  })

  it('returns the resulting published_at, or null for a draft', async () => {
    const pub = fakeDb({ data: '2026-11-19T10:00:00+00:00', error: null })
    expect(await setPublished(pub.db, { entityType: 'sermon', entityId: ID, publish: true, actorId: ACTOR }))
      .toBe('2026-11-19T10:00:00+00:00')
    const draft = fakeDb({ data: null, error: null })
    expect(await setPublished(draft.db, { entityType: 'sermon', entityId: ID, publish: false, actorId: ACTOR }))
      .toBeNull()
  })

  it('maps 42501 to the sign-in-again message', async () => {
    const { db } = fakeDb({ data: null, error: { code: '42501', message: 'inactive or unknown staff actor' } })
    await expect(setPublished(db, { entityType: 'group', entityId: ID, publish: true, actorId: ACTOR }))
      .rejects.toThrow('Your staff account is not active; sign in again')
  })

  it('raises staff-actionable failures as AdminInputError so the form keeps its input', async () => {
    for (const code of ['42501', 'P0002', '22023']) {
      const { db } = fakeDb({ data: null, error: { code, message: 'x' } })
      const err = await setPublished(db, { entityType: 'announcement', entityId: 'e', publish: true, actorId: 'a' }).catch(e => e)
      expect(isAdminInputError(err)).toBe(true)
    }
    const { db } = fakeDb({ data: null, error: { code: '57014', message: 'timeout' } })
    const err = await setPublished(db, { entityType: 'announcement', entityId: 'e', publish: true, actorId: 'a' }).catch(e => e)
    expect(isAdminInputError(err)).toBe(false)
  })

  it('marks database rejections as rolled back, but not code-less network failures', async () => {
    const input = { entityType: 'announcement' as const, entityId: 'e', publish: true, actorId: 'a' }
    const rejected = await setPublished(fakeDb({ data: null, error: { code: '57014', message: 'timeout' } }).db, input).catch(e => e)
    expect(publicationRolledBack(rejected)).toBe(true)
    const network = await setPublished(fakeDb({ data: null, error: { code: '', message: 'fetch failed' } }).db, input).catch(e => e)
    expect(publicationRolledBack(network)).toBe(false)
    expect(publicationRolledBack(new Error('x'))).toBe(false)
  })

  it('maps P0002 and 22023 to friendly messages', async () => {
    const missing = fakeDb({ data: null, error: { code: 'P0002', message: 'content row not found' } })
    await expect(setPublished(missing.db, { entityType: 'group', entityId: ID, publish: true, actorId: ACTOR }))
      .rejects.toThrow(/no longer exists/)
    const bad = fakeDb({ data: null, error: { code: '22023', message: 'unknown entity type' } })
    await expect(setPublished(bad.db, { entityType: 'group', entityId: ID, publish: true, actorId: ACTOR }))
      .rejects.toThrow(/cannot be published/)
  })

  it('surfaces other errors with their message', async () => {
    const { db } = fakeDb({ data: null, error: { code: '57014', message: 'timeout' } })
    await expect(setPublished(db, { entityType: 'outreach', entityId: ID, publish: false, actorId: ACTOR }))
      .rejects.toThrow('Could not change the publish state: timeout')
    const noMsg = fakeDb({ data: null, error: {} })
    await expect(setPublished(noMsg.db, { entityType: 'outreach', entityId: ID, publish: false, actorId: ACTOR }))
      .rejects.toThrow('unknown error')
  })

  it('never passes an email or any extra parameter', async () => {
    const { db, rpc } = fakeDb({ data: null, error: null })
    await setPublished(db, { entityType: 'ministry', entityId: ID, publish: false, actorId: ACTOR })
    const [, args] = rpc.mock.calls[0] as unknown as [string, Record<string, unknown>]
    expect(Object.keys(args).sort()).toEqual(['p_actor_id', 'p_entity_id', 'p_entity_type', 'p_publish'])
    expect(JSON.stringify(args)).not.toMatch(/@/)
  })
})

describe('publishIntent', () => {
  it('is true only for the checked checkbox', () => {
    const on = new FormData(); on.set('published', 'on')
    expect(publishIntent(on)).toBe(true)
    expect(publishIntent(new FormData())).toBe(false)
    const other = new FormData(); other.set('published', 'true')
    expect(publishIntent(other)).toBe(false)
  })
})
