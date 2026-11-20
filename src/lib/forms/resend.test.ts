import { describe, expect, it, vi } from 'vitest'
import { ResendMailTransport, RESEND_ENDPOINT } from './resend'
import { transportFromEnv } from './transport'
import { submitWebsiteForm } from './submit'

// Example values only; fetch is always stubbed, so no request leaves the process.
const env = {
  FORMS_DEFAULT_RECIPIENT: 'inbox@test.invalid',
  FORMS_MAIL_FROM: 'Site <site@test.invalid>',
  FORMS_MAIL_TRANSPORT: 'resend',
  RESEND_API_KEY: 're_test_key',
}
const ok = { category: 'bug', message: 'SECRET-VISITOR-TEXT the events page will not load.' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('ResendMailTransport', () => {
  it('posts the resolved message to /emails and resolves on an id', async () => {
    const f = vi.fn().mockResolvedValue(json({ id: 'em_1' }))
    const t = transportFromEnv(env, { fetch: f })!
    const r = await submitWebsiteForm('feedback', { ...ok, replyEmail: 'v@test.invalid' }, { env, transport: t })
    expect(r).toEqual({ status: 'sent' })
    const [url, init] = f.mock.calls[0]
    expect(url).toBe(RESEND_ENDPOINT)
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer re_test_key')
    const body = JSON.parse(init.body)
    expect(Object.keys(body).sort()).toEqual(['from', 'reply_to', 'subject', 'text', 'to'])
    expect(body).toMatchObject({ from: env.FORMS_MAIL_FROM, to: ['inbox@test.invalid'], reply_to: 'v@test.invalid' })
  })
  it('omits reply_to when there is none', async () => {
    const f = vi.fn().mockResolvedValue(json({ id: 'em_1' }))
    await new ResendMailTransport('k', { fetch: f }).send({ from: 'a@test.invalid', to: ['b@test.invalid'], subject: 's', text: 't' })
    expect(JSON.parse(f.mock.calls[0][1].body)).not.toHaveProperty('reply_to')
  })
  it('is unavailable without a key, and is not chosen unless configured', () => {
    expect(transportFromEnv({ ...env, RESEND_API_KEY: undefined })).toBeNull()
    expect(transportFromEnv({ ...env, RESEND_API_KEY: '  ' })).toBeNull()
    expect(transportFromEnv({ ...env, FORMS_MAIL_TRANSPORT: undefined, NODE_ENV: 'production' })).toBeNull()
    expect(transportFromEnv({ ...env, FORMS_MAIL_TRANSPORT: 'fake', NODE_ENV: 'production' })).toBeNull()
    expect(transportFromEnv(env)).toBeInstanceOf(ResendMailTransport)
  })
  it('F1 is unavailable with no key (no fetch)', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
    expect(await submitWebsiteForm('feedback', ok, { env: { ...env, RESEND_API_KEY: '' } })).toEqual({ status: 'unavailable' })
    expect(f).not.toHaveBeenCalled()
    f.mockRestore()
  })
  it.each([[401], [422], [429], [500]])('F1 is unavailable on http %i, with one attempt', async status => {
    const f = vi.fn().mockResolvedValue(json({ message: 'nope' }, status))
    const t = transportFromEnv(env, { fetch: f })
    expect(await submitWebsiteForm('feedback', ok, { env, transport: t })).toEqual({ status: 'unavailable' })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it.each([[{}], [{ id: '' }], [{ id: 5 }], [null]])('treats %j as malformed', async body => {
    const t = transportFromEnv(env, { fetch: vi.fn().mockResolvedValue(json(body)) })
    expect(await submitWebsiteForm('feedback', ok, { env, transport: t })).toEqual({ status: 'unavailable' })
  })
  it('treats non-JSON success as malformed', async () => {
    const t = transportFromEnv(env, { fetch: vi.fn().mockResolvedValue(new Response('ok', { status: 200 })) })
    expect(await submitWebsiteForm('feedback', ok, { env, transport: t })).toEqual({ status: 'unavailable' })
  })
  it('times out without retrying', async () => {
    const f = vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_res, rej) => {
      init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
    }))
    const t = transportFromEnv(env, { fetch: f, timeoutMs: 20 })
    expect(await submitWebsiteForm('feedback', ok, { env, transport: t })).toEqual({ status: 'unavailable' })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('never leaks the message or key through the thrown error', async () => {
    const msg = { from: 'a@test.invalid', to: ['b@test.invalid'], subject: 's', text: 'SECRET-VISITOR-TEXT' }
    for (const f of [vi.fn().mockResolvedValue(json({}, 500)), vi.fn().mockRejectedValue(new Error('boom SECRET-VISITOR-TEXT re_test_key'))]) {
      const err = await new ResendMailTransport('re_test_key', { fetch: f }).send(msg).catch(e => e)
      expect(String(err.message)).not.toMatch(/SECRET|re_test_key|test\.invalid/)
    }
  })
  it('ignores visitor-supplied recipients and sender', async () => {
    const f = vi.fn().mockResolvedValue(json({ id: 'em_1' }))
    const t = transportFromEnv(env, { fetch: f })
    await submitWebsiteForm('feedback', { ...ok, to: 'x@evil.invalid', from: 'y@evil.invalid', cc: 'z@evil.invalid', bcc: 'w@evil.invalid' }, { env, transport: t })
    const body = JSON.parse(f.mock.calls[0][1].body)
    expect(body.to).toEqual(['inbox@test.invalid'])
    expect(body.from).toBe(env.FORMS_MAIL_FROM)
    expect(JSON.stringify(body)).not.toContain('evil.invalid')
  })
})
