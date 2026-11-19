import { describe, expect, it } from 'vitest'
import { isAdminInputError } from '../admin-validation'
import { saveWithPublication, type ContentDb, type SaveWithPublicationInput } from './save'

const ACTOR = '11111111-1111-4111-8111-111111111111'
const ID = '22222222-2222-4222-8222-222222222222'
const NEW_ID = '33333333-3333-4333-8333-333333333333'
type Err = { code?: string; message: string } | null

/** Records every write in order. Each option makes that step fail. */
function fakeDb(fail: { rpc?: Err; update?: Err; insert?: Err; remove?: Err } = {}) {
  const calls: string[] = []
  const rpcArgs: Array<Record<string, unknown>> = []
  const db: ContentDb = {
    rpc: async (fn, args) => {
      calls.push(`${fn}:${args.p_publish ? 'publish' : 'unpublish'}:${args.p_entity_id}`)
      rpcArgs.push(args)
      return { data: null, error: fail.rpc ?? null }
    },
    from: table => ({
      insert: () => ({
        select: () => ({
          single: async () => {
            calls.push(`insert:${table}`)
            return fail.insert ? { data: null, error: fail.insert } : { data: { id: NEW_ID }, error: null }
          },
        }),
      }),
      update: () => ({ eq: async (_col, id) => { calls.push(`update:${table}:${id}`); return { error: fail.update ?? null } } }),
      delete: () => ({ eq: async (_col, id) => { calls.push(`delete:${table}:${id}`); return { error: fail.remove ?? null } } }),
    }),
  }
  return { db, calls, rpcArgs }
}

const input = (over: Partial<SaveWithPublicationInput> = {}): SaveWithPublicationInput => ({
  table: 'announcements', entityType: 'announcement', label: 'announcement',
  id: ID, row: { title: 'Hello' }, publish: true, actorId: ACTOR, ...over,
})

describe('saveWithPublication: existing row', () => {
  it('writes content, then publishes, passing the actor id through', async () => {
    const { db, calls, rpcArgs } = fakeDb()
    expect(await saveWithPublication(db, input())).toBe(ID)
    expect(calls).toEqual([`update:announcements:${ID}`, `cms_set_published:publish:${ID}`])
    expect(rpcArgs).toEqual([{ p_entity_type: 'announcement', p_entity_id: ID, p_publish: true, p_actor_id: ACTOR }])
  })

  it('unpublishes before writing content', async () => {
    const { db, calls, rpcArgs } = fakeDb()
    await saveWithPublication(db, input({ publish: false }))
    expect(calls).toEqual([`cms_set_published:unpublish:${ID}`, `update:announcements:${ID}`])
    expect(rpcArgs[0].p_actor_id).toBe(ACTOR)
  })

  it('leaves the row unpublished when the content write fails after the unpublish', async () => {
    const { db, calls } = fakeDb({ update: { message: 'update failed' } })
    await expect(saveWithPublication(db, input({ publish: false }))).rejects.toThrow('update failed')
    expect(calls).toEqual([`cms_set_published:unpublish:${ID}`, `update:announcements:${ID}`])
  })

  it('does not publish when the content write fails', async () => {
    const { db, calls } = fakeDb({ update: { message: 'update failed' } })
    await expect(saveWithPublication(db, input())).rejects.toThrow('update failed')
    expect(calls).toEqual([`update:announcements:${ID}`])
  })
})

describe('saveWithPublication: new row', () => {
  it('inserts a draft and never calls the publish function when not publishing', async () => {
    const { db, calls } = fakeDb()
    expect(await saveWithPublication(db, input({ id: null, publish: false }))).toBe(NEW_ID)
    expect(calls).toEqual(['insert:announcements'])
  })

  it('inserts, then publishes the new id as the actor', async () => {
    const { db, calls, rpcArgs } = fakeDb()
    expect(await saveWithPublication(db, input({ id: null }))).toBe(NEW_ID)
    expect(calls).toEqual(['insert:announcements', `cms_set_published:publish:${NEW_ID}`])
    expect(rpcArgs[0]).toMatchObject({ p_entity_id: NEW_ID, p_actor_id: ACTOR })
  })

  it('deletes the new draft when the publish rolled back (error has a SQLSTATE)', async () => {
    const { db, calls } = fakeDb({ rpc: { code: '42501', message: 'inactive or unknown staff actor' } })
    const err = await saveWithPublication(db, input({ id: null })).catch((e: unknown) => e)
    expect((err as Error).message).toBe('Your staff account is not active; sign in again')
    expect(calls).toEqual(['insert:announcements', `cms_set_published:publish:${NEW_ID}`, `delete:announcements:${NEW_ID}`])
  })

  it('keeps the row and says to check the list when the failure has no code (may have committed)', async () => {
    const { db, calls } = fakeDb({ rpc: { message: 'fetch failed' } })
    const err = await saveWithPublication(db, input({ id: null })).catch((e: unknown) => e)
    expect(isAdminInputError(err)).toBe(true)
    expect((err as Error).message).toMatch(/^The announcement was saved, but publishing could not be confirmed/)
    expect(calls).toEqual(['insert:announcements', `cms_set_published:publish:${NEW_ID}`])
  })

  it('tells staff to open the draft when the rollback cleanup also fails', async () => {
    const { db } = fakeDb({ rpc: { code: '22023', message: 'bad entity' }, remove: { message: 'delete failed' } })
    const err = await saveWithPublication(db, input({ id: null })).catch((e: unknown) => e)
    expect(isAdminInputError(err)).toBe(true)
    expect((err as Error).message).toMatch(/^The announcement was saved as a draft but could not be published/)
  })

  it('stops when the insert fails', async () => {
    const { db, calls } = fakeDb({ insert: { message: 'insert failed' } })
    await expect(saveWithPublication(db, input({ id: null }))).rejects.toThrow('insert failed')
    expect(calls).toEqual(['insert:announcements'])
  })
})
