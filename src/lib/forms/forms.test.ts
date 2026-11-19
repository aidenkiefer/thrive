import { describe, expect, it } from 'vitest'
import { FakeMailTransport, transportFromEnv } from './transport'
import { resolveRecipients } from './recipients'
import { submitWebsiteForm } from './submit'

// Example addresses only; nothing here is a real destination.
const env = { FORMS_FEEDBACK_RECIPIENT: 'inbox@test.invalid', FORMS_MAIL_FROM: 'Site <site@test.invalid>' }
const ok = { category: 'bug', message: 'The events page will not load.' }

describe('submitWebsiteForm(feedback)', () => {
  it('sends to server-resolved recipients through the transport', async () => {
    const t = new FakeMailTransport()
    const r = await submitWebsiteForm('feedback', { ...ok, replyEmail: 'v@test.invalid', pagePath: '/events' }, { env, transport: t })
    expect(r).toEqual({ status: 'sent' })
    expect(t.outbox).toHaveLength(1)
    expect(t.outbox[0]).toMatchObject({ to: ['inbox@test.invalid'], from: env.FORMS_MAIL_FROM, replyTo: 'v@test.invalid' })
  })
  it('ignores visitor-supplied recipients and sender', async () => {
    const t = new FakeMailTransport()
    await submitWebsiteForm('feedback', { ...ok, to: 'x@evil.invalid', from: 'y@evil.invalid', cc: 'z@evil.invalid' }, { env, transport: t })
    expect(t.outbox[0].to).toEqual(['inbox@test.invalid'])
    expect(t.outbox[0].from).toBe(env.FORMS_MAIL_FROM)
  })
  it('returns field errors for invalid input without sending', async () => {
    const t = new FakeMailTransport()
    const r = await submitWebsiteForm('feedback', { category: 'x', message: 'short', replyEmail: 'bad\nBcc: a@b.c', pagePath: 'nope' }, { env, transport: t })
    expect(r).toMatchObject({ status: 'invalid' })
    if (r.status === 'invalid') expect(Object.keys(r.fieldErrors).sort()).toEqual(['category', 'message', 'pagePath', 'replyEmail'])
    expect(t.outbox).toHaveLength(0)
  })
  it('treats an unknown form as invalid', async () => {
    expect(await submitWebsiteForm('nope', ok, { env, transport: new FakeMailTransport() })).toMatchObject({ status: 'invalid' })
  })
  it('reports unavailable on transport failure, missing recipient, sender, or transport', async () => {
    expect(await submitWebsiteForm('feedback', ok, { env, transport: new FakeMailTransport(new Error('smtp down')) })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('feedback', ok, { env: { ...env, FORMS_FEEDBACK_RECIPIENT: '' }, transport: new FakeMailTransport() })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('feedback', ok, { env: { FORMS_FEEDBACK_RECIPIENT: env.FORMS_FEEDBACK_RECIPIENT }, transport: new FakeMailTransport() })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('feedback', ok, { env, transport: null })).toEqual({ status: 'unavailable' })
  })
  it('does not fall back to a hardcoded inbox', async () => {
    expect(await submitWebsiteForm('feedback', ok, { env: { FORMS_MAIL_FROM: env.FORMS_MAIL_FROM }, transport: new FakeMailTransport() })).toEqual({ status: 'unavailable' })
  })
})

describe('resolveRecipients', () => {
  it('deduplicates case-insensitively, default first', () => {
    expect(resolveRecipients('F', { F_RECIPIENT: 'A@x.invalid', F_EXTRA_RECIPIENTS: 'a@x.invalid, b@x.invalid,B@x.invalid' }))
      .toEqual(['A@x.invalid', 'b@x.invalid'])
  })
  it('is null when default or any extra is malformed', () => {
    expect(resolveRecipients('F', {})).toBeNull()
    expect(resolveRecipients('F', { F_RECIPIENT: 'nope' })).toBeNull()
    expect(resolveRecipients('F', { F_RECIPIENT: 'a@x.invalid', F_EXTRA_RECIPIENTS: 'bad' })).toBeNull()
  })
})

describe('transportFromEnv', () => {
  it('uses the fake only outside production and only when requested', () => {
    expect(transportFromEnv({ FORMS_MAIL_TRANSPORT: 'fake', NODE_ENV: 'development' })).not.toBeNull()
    expect(transportFromEnv({ FORMS_MAIL_TRANSPORT: 'fake', NODE_ENV: 'production' })).toBeNull()
    expect(transportFromEnv({ NODE_ENV: 'development' })).toBeNull()
  })
})
