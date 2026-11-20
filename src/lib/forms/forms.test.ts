import { describe, expect, it } from 'vitest'
import { FakeMailTransport, transportFromEnv } from './transport'
import { resolveRecipients } from './recipients'
import { submitWebsiteForm } from './submit'

// Example addresses only; nothing here is a real destination.
const env = { FORMS_DEFAULT_RECIPIENT: 'inbox@test.invalid', FORMS_MAIL_FROM: 'Site <site@test.invalid>' }
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
    expect(await submitWebsiteForm('feedback', ok, { env: { ...env, FORMS_DEFAULT_RECIPIENT: '' }, transport: new FakeMailTransport() })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('feedback', ok, { env: { FORMS_DEFAULT_RECIPIENT: env.FORMS_DEFAULT_RECIPIENT }, transport: new FakeMailTransport() })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('feedback', ok, { env, transport: null })).toEqual({ status: 'unavailable' })
  })
  it('logs one fixed, PII-free code per unavailable result', async () => {
    const lines: string[] = []
    const log = (line: string) => { lines.push(line) }
    const visitor = { ...ok, replyEmail: 'v@test.invalid' }
    await submitWebsiteForm('feedback', visitor, { env, log, transport: new FakeMailTransport(new Error('smtp down for inbox@test.invalid')) })
    await submitWebsiteForm('feedback', visitor, { env: { ...env, FORMS_DEFAULT_RECIPIENT: '' }, log, transport: new FakeMailTransport() })
    expect(lines).toEqual(['[forms] unavailable code=send_failed form=feedback', '[forms] unavailable code=not_configured form=feedback'])
    await submitWebsiteForm('feedback', visitor, { env, log, transport: new FakeMailTransport() })
    expect(lines).toHaveLength(2)
  })
  it('delivers feedback to the global default plus deduplicated extras', async () => {
    const t = new FakeMailTransport()
    const r = await submitWebsiteForm('feedback', ok, { env: { ...env, FORMS_FEEDBACK_EXTRA_RECIPIENTS: 'INBOX@test.invalid, two@test.invalid' }, transport: t })
    expect(r).toEqual({ status: 'sent' })
    expect(t.outbox[0].to).toEqual(['inbox@test.invalid', 'two@test.invalid'])
  })
  it('fails closed on malformed feedback extras or default, sending nothing', async () => {
    const t = new FakeMailTransport()
    expect(await submitWebsiteForm('feedback', ok, { env: { ...env, FORMS_FEEDBACK_EXTRA_RECIPIENTS: 'bad' }, transport: t })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('feedback', ok, { env: { ...env, FORMS_DEFAULT_RECIPIENT: 'bad' }, transport: t })).toEqual({ status: 'unavailable' })
    expect(t.outbox).toHaveLength(0)
  })
  it('does not fall back to a hardcoded inbox', async () => {
    expect(await submitWebsiteForm('feedback', ok, { env: { FORMS_MAIL_FROM: env.FORMS_MAIL_FROM }, transport: new FakeMailTransport() })).toEqual({ status: 'unavailable' })
  })
})

describe('submitWebsiteForm(prayer)', () => {
  // FORMS_PRAYER_RECIPIENT is the only inbox; the default and every extra must never receive it.
  const penv = { ...env, FORMS_PRAYER_RECIPIENT: 'prayer@test.invalid', FORMS_FEEDBACK_EXTRA_RECIPIENTS: 'extra@test.invalid' }
  const request = 'Please pray for my mother, who is in the hospital this week.'

  it('delivers only to the prayer inbox, with an email contact used only as reply-to', async () => {
    const t = new FakeMailTransport()
    const r = await submitWebsiteForm('prayer', { name: 'Sam', contact: 'sam@test.invalid', request }, { env: penv, transport: t })
    expect(r).toEqual({ status: 'sent' })
    expect(t.outbox).toHaveLength(1)
    expect(t.outbox[0]).toMatchObject({ to: ['prayer@test.invalid'], from: env.FORMS_MAIL_FROM, replyTo: 'sam@test.invalid', subject: '[Website] Prayer request' })
    expect(t.outbox[0].text).toBe(`Name: Sam\nContact: reply to this email\n\n${request}`)
    expect(t.outbox[0].text).not.toContain('sam@test.invalid')
  })
  it('writes a phone contact in the body and sets no reply-to', async () => {
    const t = new FakeMailTransport()
    await submitWebsiteForm('prayer', { contact: '+1 (847) 555-0100', request }, { env: penv, transport: t })
    expect(t.outbox[0].replyTo).toBeUndefined()
    expect(t.outbox[0].text).toBe(`Name: (not given)\nPhone: +1 (847) 555-0100\n\n${request}`)
  })
  it('sends with only the request', async () => {
    const t = new FakeMailTransport()
    expect(await submitWebsiteForm('prayer', { request }, { env: penv, transport: t })).toEqual({ status: 'sent' })
    expect(t.outbox[0].text).toBe(`Name: (not given)\nContact: (not given)\n\n${request}`)
  })
  it('ignores visitor-supplied to, from, cc, bcc and reply-to', async () => {
    const t = new FakeMailTransport()
    await submitWebsiteForm('prayer', {
      request, to: 'x@evil.invalid', from: 'y@evil.invalid', cc: 'z@evil.invalid', bcc: 'w@evil.invalid', replyTo: 'v@evil.invalid',
    }, { env: penv, transport: t })
    expect(t.outbox[0].to).toEqual(['prayer@test.invalid'])
    expect(t.outbox[0].from).toBe(env.FORMS_MAIL_FROM)
    expect(t.outbox[0].replyTo).toBeUndefined()
    expect(JSON.stringify(t.outbox[0])).not.toContain('evil.invalid')
  })
  it('requires a 10 to 4000 character request and checks name and contact', async () => {
    const t = new FakeMailTransport()
    const errs = async (fields: Record<string, unknown>) => {
      const r = await submitWebsiteForm('prayer', fields, { env: penv, transport: t })
      return r.status === 'invalid' ? Object.keys(r.fieldErrors).sort() : r.status
    }
    expect(await errs({})).toEqual(['request'])
    expect(await errs({ request: 'too short' })).toEqual(['request'])
    expect(await errs({ request: 'x'.repeat(4001) })).toEqual(['request'])
    expect(await errs({ request: 'x'.repeat(4000) })).toBe('sent')
    expect(await errs({ request, contact: 'call me maybe' })).toEqual(['contact'])
    expect(await errs({ request, contact: 'a@b.c\nBcc: x@evil.invalid' })).toEqual(['contact'])
    expect(await errs({ request, contact: '12345' })).toEqual(['contact'])
    expect(await errs({ request, name: 'Sam\nBcc: x@evil.invalid' })).toEqual(['name'])
    expect(await errs({ request, name: 'n'.repeat(101) })).toEqual(['name'])
    expect(t.outbox).toHaveLength(1)
  })
  it('is unavailable without exactly one valid prayer inbox, even with a default configured', async () => {
    const t = new FakeMailTransport()
    expect(await submitWebsiteForm('prayer', { request }, { env, transport: t })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('prayer', { request }, { env: { ...penv, FORMS_PRAYER_RECIPIENT: 'bad' }, transport: t })).toEqual({ status: 'unavailable' })
    expect(await submitWebsiteForm('prayer', { request }, { env: { ...penv, FORMS_PRAYER_RECIPIENT: 'a@test.invalid, b@test.invalid' }, transport: t })).toEqual({ status: 'unavailable' })
    expect(t.outbox).toHaveLength(0)
  })
  it('never logs the request, name or contact', async () => {
    const lines: string[] = []
    const log = (line: string) => { lines.push(line) }
    const visitor = { name: 'Sam', contact: 'sam@test.invalid', request }
    await submitWebsiteForm('prayer', visitor, { env: penv, log, transport: new FakeMailTransport(new Error(`smtp down: ${request}`)) })
    await submitWebsiteForm('prayer', visitor, { env: { ...penv, FORMS_PRAYER_RECIPIENT: '' }, log, transport: new FakeMailTransport() })
    expect(lines).toEqual(['[forms] unavailable code=send_failed form=prayer', '[forms] unavailable code=not_configured form=prayer'])
  })
})

describe('resolveRecipients', () => {
  it('deduplicates default and extras case-insensitively, default first', () => {
    expect(resolveRecipients({ FORMS_DEFAULT_RECIPIENT: 'A@x.invalid', X: 'a@x.invalid, b@x.invalid,B@x.invalid' }, 'X'))
      .toEqual(['A@x.invalid', 'b@x.invalid'])
  })
  it('uses only the default when the form has no extras configured', () => {
    expect(resolveRecipients({ FORMS_DEFAULT_RECIPIENT: 'a@x.invalid' }, 'X')).toEqual(['a@x.invalid'])
    expect(resolveRecipients({ FORMS_DEFAULT_RECIPIENT: 'a@x.invalid', X: 'b@x.invalid' })).toEqual(['a@x.invalid'])
  })
  it('is null when default is missing or malformed, even if extras are valid', () => {
    expect(resolveRecipients({})).toBeNull()
    expect(resolveRecipients({ X: 'b@x.invalid' }, 'X')).toBeNull()
    expect(resolveRecipients({ FORMS_DEFAULT_RECIPIENT: 'nope' })).toBeNull()
  })
  it('is null when any extra is malformed (no partial delivery)', () => {
    expect(resolveRecipients({ FORMS_DEFAULT_RECIPIENT: 'a@x.invalid', X: 'bad' }, 'X')).toBeNull()
    expect(resolveRecipients({ FORMS_DEFAULT_RECIPIENT: 'a@x.invalid', X: 'b@x.invalid, bad' }, 'X')).toBeNull()
  })
})

describe('transportFromEnv', () => {
  it('uses the fake only outside production and only when requested', () => {
    expect(transportFromEnv({ FORMS_MAIL_TRANSPORT: 'fake', NODE_ENV: 'development' })).not.toBeNull()
    expect(transportFromEnv({ FORMS_MAIL_TRANSPORT: 'fake', NODE_ENV: 'production' })).toBeNull()
    expect(transportFromEnv({ NODE_ENV: 'development' })).toBeNull()
  })
})
