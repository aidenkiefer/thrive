import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { publishSeedRow } from './publish'

const ACTOR = '11111111-1111-4111-8111-111111111111'
const ID = '22222222-2222-4222-8222-222222222222'
const WHEN = '2024-07-19T19:18:45-05:00'

/** Fake client: publication_events rows to find, and every rpc call made. */
function fakeDb(events: Array<{ entity_type: string; entity_id: string }>, failHistory = false) {
  const rpc: Array<[string, Record<string, unknown>]> = []
  const db = {
    from: (table: string) => {
      expect(table).toBe('publication_events')
      const filters: Array<[string, unknown]> = []
      const query = {
        select: () => query,
        eq: (col: string, val: unknown) => { filters.push([col, val]); return query },
        limit: async (n: number) => failHistory
          ? { data: null, error: { message: 'db down' } }
          : { data: events.filter(e => filters.every(([c, v]) => (e as Record<string, unknown>)[c] === v)).slice(0, n), error: null },
      }
      return query
    },
    rpc: async (fn: string, args: Record<string, unknown>) => { rpc.push([fn, args]); return { data: WHEN, error: null } },
  }
  return { db: db as unknown as SupabaseClient, rpc }
}

describe('publishSeedRow', () => {
  it('publishes a row with no publication history as the seed actor with its original time', async () => {
    const { db, rpc } = fakeDb([])
    expect(await publishSeedRow(db, 'sermons', ID, WHEN, ACTOR)).toBe('published')
    expect(rpc).toEqual([['cms_set_published', {
      p_entity_type: 'sermon', p_entity_id: ID, p_publish: true, p_actor_id: ACTOR, p_published_at: WHEN,
    }]])
  })

  it('skips a row staff unpublished, so a re-run never republishes it', async () => {
    const { db, rpc } = fakeDb([{ entity_type: 'sermon', entity_id: ID }])
    expect(await publishSeedRow(db, 'sermons', ID, WHEN, ACTOR)).toBe('skipped')
    expect(rpc).toEqual([])
  })

  it('matches history on entity type and id together', async () => {
    const { db, rpc } = fakeDb([{ entity_type: 'sermon_series', entity_id: ID }, { entity_type: 'sermon', entity_id: ACTOR }])
    expect(await publishSeedRow(db, 'sermons', ID, WHEN, ACTOR)).toBe('published')
    expect(rpc).toHaveLength(1)
  })

  it('does nothing for a table without a publish state or a row without a publish time', async () => {
    const { db, rpc } = fakeDb([])
    expect(await publishSeedRow(db, 'speakers', ID, WHEN, ACTOR)).toBe('none')
    expect(await publishSeedRow(db, 'sermons', ID, null, ACTOR)).toBe('none')
    expect(rpc).toEqual([])
  })

  it('fails instead of publishing when the history lookup fails', async () => {
    const { db, rpc } = fakeDb([], true)
    await expect(publishSeedRow(db, 'sermons', ID, WHEN, ACTOR)).rejects.toThrow(/publication history/)
    expect(rpc).toEqual([])
  })
})
