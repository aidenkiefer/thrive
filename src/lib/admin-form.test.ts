import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`) } }))
import { readFeedback, saveWithFeedback } from './admin-form'
import { AdminInputError } from './admin-validation'

const ID = '00000000-0000-4000-8000-000000000002'
const redirectOf = async (run: Promise<unknown>) => {
  const error = await run.catch(e => e as Error)
  return new URL(String((error as Error).message).replace('REDIRECT:', ''), 'https://example.test')
}

describe('saveWithFeedback created id', () => {
  it('adds ?created=<id> after a successful "new" save', async () => {
    const url = await redirectOf(saveWithFeedback('/admin/announcements', 'new', async () => ID))
    expect(url.pathname).toBe('/admin/announcements')
    expect(url.searchParams.get('saved')).toBe('new')
    expect(url.searchParams.get('created')).toBe(ID)
  })
  it('omits it for edits, void saves, non-uuid ids and rejected saves', async () => {
    expect((await redirectOf(saveWithFeedback('/admin/x', ID, async () => ID))).searchParams.has('created')).toBe(false)
    expect((await redirectOf(saveWithFeedback('/admin/x', 'new', async () => {}))).searchParams.has('created')).toBe(false)
    expect((await redirectOf(saveWithFeedback('/admin/x', 'new', async () => 'x/../y'))).searchParams.has('created')).toBe(false)
    const rejected = await redirectOf(saveWithFeedback('/admin/x', 'new', async () => { throw new AdminInputError('Synthetic problem') }))
    expect(rejected.searchParams.get('error')).toBe('Synthetic problem')
    expect(rejected.searchParams.has('created')).toBe(false)
  })
})

describe('readFeedback created id', () => {
  it('accepts a uuid on a successful "new" save only', async () => {
    expect((await readFeedback(Promise.resolve({ saved: 'new', created: ID }))).created).toBe(ID)
    expect((await readFeedback(Promise.resolve({ saved: ID, created: ID }))).created).toBeUndefined()
    expect((await readFeedback(Promise.resolve({ saved: 'new', created: '/evil' }))).created).toBeUndefined()
    expect(await readFeedback(Promise.resolve({ saved: 'new' }))).not.toHaveProperty('created')
  })
})
