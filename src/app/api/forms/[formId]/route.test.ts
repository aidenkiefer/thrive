import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createFakeRateLimitStore } from '@/lib/rate-limit/fake-store'
import type { RateLimitStore, SubjectLimiter } from '@/lib/rate-limit'

const state = vi.hoisted(() => ({
  limiter: null as unknown as SubjectLimiter,
  submit: vi.fn(),
  make: null as unknown as typeof import('@/lib/rate-limit').createSubjectLimiter,
}))

vi.mock('@/lib/forms/submit', () => ({ submitWebsiteForm: state.submit }))
vi.mock('@/lib/rate-limit', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>()
  state.make = actual.createSubjectLimiter
  return { ...actual, createSubjectLimiter: () => ((rule, subject) => state.limiter(rule, subject)) as SubjectLimiter }
})

import { POST } from './route'

const SECRET = 's'.repeat(32)
const WINDOW_MS = 600_000
let now = 0
let store: ReturnType<typeof createFakeRateLimitStore>

const fields = { category: 'bug', name: 'Zed Quimby', message: 'secret-message-body-123' }

function send(ip: string | null, body: Record<string, unknown> = fields, formId = 'feedback') {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (ip) headers['x-forwarded-for'] = ip
  const req = new NextRequest(`http://localhost/api/forms/${formId}`, { method: 'POST', body: JSON.stringify(body), headers })
  return POST(req, { params: Promise.resolve({ formId }) })
}

beforeEach(() => {
  now = 10 * WINDOW_MS + 1000
  store = createFakeRateLimitStore(() => now)
  state.limiter = state.make({ secret: SECRET, store })
  state.submit.mockReset()
  state.submit.mockResolvedValue({ status: 'sent' })
})

describe('POST /api/forms/[formId] shared limiter', () => {
  it('allows 5 then limits the 6th with a safe 429', async () => {
    for (let i = 0; i < 5; i++) expect((await send('1.2.3.4')).status).toBe(200)
    expect(state.submit).toHaveBeenCalledTimes(5)
    const res = await send('1.2.3.4')
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ status: 'unavailable' })
    const retry = res.headers.get('Retry-After')!
    expect(retry).toMatch(/^\d+$/)
    expect(Number(retry)).toBeGreaterThanOrEqual(1)
    expect(Number(retry)).toBeLessThanOrEqual(600)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(state.submit).toHaveBeenCalledTimes(5)
  })

  it('shares counts across instances', async () => {
    const a = state.make({ secret: SECRET, store })
    const b = state.make({ secret: SECRET, store })
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      state.limiter = i % 2 ? b : a
      statuses.push((await send('1.2.3.4')).status)
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
  })

  it('allows again in the next window', async () => {
    for (let i = 0; i < 6; i++) await send('1.2.3.4')
    expect((await send('1.2.3.4')).status).toBe(429)
    now += WINDOW_MS
    expect((await send('1.2.3.4')).status).toBe(200)
  })

  it('keeps client IPs independent and normalizes equivalents', async () => {
    for (let i = 0; i < 5; i++) await send('1.2.3.4')
    expect((await send('5.6.7.8')).status).toBe(200)
    expect((await send('1.2.3.4:999')).status).toBe(429)
    expect((await send('::ffff:1.2.3.4')).status).toBe(429)
  })

  it('uses the first x-forwarded-for hop', async () => {
    for (let i = 0; i < 5; i++) await send('1.2.3.4, 9.9.9.9')
    expect((await send('1.2.3.4, 8.8.8.8')).status).toBe(429)
  })

  it('honeypot returns sent without consuming budget', async () => {
    const take = vi.spyOn(store, 'take')
    for (let i = 0; i < 10; i++) {
      const res = await send('1.2.3.4', { ...fields, website: 'http://spam.example' })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ status: 'sent' })
    }
    expect(take).not.toHaveBeenCalled()
    expect(state.submit).not.toHaveBeenCalled()
    for (let i = 0; i < 5; i++) expect((await send('1.2.3.4')).status).toBe(200)
  })

  it('fails closed when the secret is missing', async () => {
    state.limiter = state.make({ secret: null, store })
    const res = await send('1.2.3.4')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'unavailable' })
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(state.submit).not.toHaveBeenCalled()
  })

  it('fails closed when the store throws', async () => {
    const broken: RateLimitStore = { take: async () => { throw new Error('boom') } }
    state.limiter = state.make({ secret: SECRET, store: broken })
    const res = await send('1.2.3.4')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'unavailable' })
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(state.submit).not.toHaveBeenCalled()
  })

  it('does not leak the IP or submitted values', async () => {
    const take = vi.spyOn(store, 'take')
    let last: Response | undefined
    for (let i = 0; i < 6; i++) last = await send('1.2.3.4')
    const calls = JSON.stringify(take.mock.calls)
    for (const value of ['1.2.3.4', 'Zed Quimby', 'secret-message-body-123']) {
      expect(calls).not.toContain(value)
    }
    const body = await last!.text()
    expect(body).not.toContain('Zed Quimby')
    expect(body).not.toContain('secret-message-body-123')
  })

  it('validates before counting: invalid input is a 422 that spends no budget, even with the limiter down', async () => {
    const take = vi.spyOn(store, 'take')
    for (let i = 0; i < 10; i++) {
      const res = await send('1.2.3.4', { ...fields, category: 'other' })
      expect(res.status).toBe(422)
      expect(await res.json()).toMatchObject({ status: 'invalid', fieldErrors: { category: expect.any(String) } })
    }
    expect(take).not.toHaveBeenCalled()
    expect(state.submit).not.toHaveBeenCalled()
    for (let i = 0; i < 5; i++) expect((await send('1.2.3.4')).status).toBe(200)
    state.limiter = state.make({ secret: null, store })
    expect((await send('1.2.3.4', { ...fields, message: '' })).status).toBe(422)
  })

  it('caps the body while streaming, without trusting content-length', async () => {
    const enc = new TextEncoder()
    let pulls = 0
    const body = new ReadableStream<Uint8Array>({
      pull(c) { if (++pulls > 100) c.close(); else c.enqueue(enc.encode('x'.repeat(1000))) },
    })
    const req = new NextRequest('http://localhost/api/forms/feedback', { method: 'POST', body, duplex: 'half' } as never)
    const res = await POST(req, { params: Promise.resolve({ formId: 'feedback' }) })
    expect(res.status).toBe(413)
    expect(pulls).toBeLessThan(30)
    expect(state.submit).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown form and consumes nothing', async () => {
    const take = vi.spyOn(store, 'take')
    const res = await send('1.2.3.4', fields, 'no-such-form')
    expect(res.status).toBe(404)
    expect(take).not.toHaveBeenCalled()
    expect(state.submit).not.toHaveBeenCalled()
  })
})

describe('POST /api/forms/prayer', () => {
  const prayer = { name: 'Sam', contact: 'sam@test.invalid', request: 'secret-prayer-request-body-456' }

  it('is registered: valid input reaches submit, invalid input is a 422 on the request field', async () => {
    const ok = await send('5.6.7.8', prayer, 'prayer')
    expect(ok.status).toBe(200)
    expect(state.submit).toHaveBeenCalledWith('prayer', prayer)
    const bad = await send('5.6.7.8', { ...prayer, request: 'short' }, 'prayer')
    expect(bad.status).toBe(422)
    expect(await bad.json()).toMatchObject({ status: 'invalid', fieldErrors: { request: expect.any(String) } })
    expect(state.submit).toHaveBeenCalledTimes(1)
  })

  it('keeps the website honeypot: a filled one is a silent success that sends nothing', async () => {
    const res = await send('5.6.7.8', { ...prayer, website: 'http://spam.example' }, 'prayer')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'sent' })
    expect(state.submit).not.toHaveBeenCalled()
  })

  it('does not log the request text', async () => {
    const spies = (['log', 'info', 'warn', 'error'] as const).map(m => vi.spyOn(console, m).mockImplementation(() => {}))
    state.submit.mockResolvedValueOnce({ status: 'unavailable' })
    await send('5.6.7.8', prayer, 'prayer')
    await send('5.6.7.8', { ...prayer, request: 'short' }, 'prayer')
    const logged = JSON.stringify(spies.flatMap(s => s.mock.calls))
    for (const s of spies) s.mockRestore()
    expect(logged).not.toContain('secret-prayer-request-body')
    expect(logged).not.toContain('sam@test.invalid')
  })
})
