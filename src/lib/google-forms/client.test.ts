import { describe, expect, it } from 'vitest'
import { QUOTA_BODY, fakeGoogle } from './__fixtures__/fake-google'
import { createFormsClient, FormsApiError, retryAfterMs } from './client'
import { redact, shortId } from './redact'

const TOKEN = 'ya29.FIXTURE-access-token-never-printed'

function setup(opts: { maxRetries?: number; quotaProject?: string } = {}) {
  const g = fakeGoogle()
  const sleeps: number[] = []
  const client = createFormsClient({
    fetch: g.fetch,
    getToken: async () => TOKEN,
    sleep: async ms => void sleeps.push(ms),
    random: () => 0.5,
    ...opts,
  })
  return { g, sleeps, client }
}

const create = { info: { title: 'T', documentTitle: 'D' } }

describe('Forms REST client', () => {
  it('uses the documented endpoints, creates unpublished, and sends a bearer token', async () => {
    const { g, client } = setup({ quotaProject: 'thrive-forms-1' })
    const form = await client.create(create)
    await client.get(form.formId)
    await client.batchUpdate(form.formId, { requests: [], includeFormInResponse: true, writeControl: { requiredRevisionId: form.revisionId! } })
    await client.setPublishSettings(form.formId, { publishSettings: { publishState: { isPublished: true, isAcceptingResponses: true } }, updateMask: 'publishState' })
    expect(g.calls.map(c => `${c.method} ${c.path.replace(form.formId, '{id}')}`)).toEqual([
      'POST /forms?unpublished=true',
      'GET /forms/{id}',
      'POST /forms/{id}:batchUpdate',
      'POST /forms/{id}:setPublishSettings',
    ])
    expect(g.calls[0].headers.authorization).toBe(`Bearer ${TOKEN}`)
    expect(g.calls[0].headers['x-goog-user-project']).toBe('thrive-forms-1')
    expect(g.calls[1].headers['content-type']).toBeUndefined()
  })

  it('retries 429 with truncated exponential backoff and jitter, then succeeds', async () => {
    const { g, sleeps, client } = setup()
    g.fail('GET', 429, { times: 3, body: QUOTA_BODY })
    const form = await client.create(create)
    await client.get(form.formId)
    expect(sleeps).toEqual([1500, 2500, 4500])
    expect(g.ops()).toEqual(['create', 'get', 'get', 'get', 'get'])
  })

  it('honors Retry-After, capped at the max backoff', async () => {
    const { g, sleeps, client } = setup()
    g.fail('GET', 429, { headers: { 'retry-after': '7' } })
    g.fail('GET', 429, { headers: { 'retry-after': '600' } })
    const form = await client.create(create)
    await client.get(form.formId)
    expect(sleeps).toEqual([7000, 32000])
  })

  it('stops after the retry budget with a clear, redacted error', async () => {
    const { g, sleeps, client } = setup({ maxRetries: 2 })
    const form = await client.create(create)
    g.fail(':setPublishSettings', 429, { times: 10, body: QUOTA_BODY })
    const err = await client
      .setPublishSettings(form.formId, { publishSettings: { publishState: { isPublished: true, isAcceptingResponses: true } }, updateMask: 'publishState' })
      .catch(e => e)
    expect(err).toBeInstanceOf(FormsApiError)
    expect(err).toMatchObject({ status: 429, attempts: 3, ambiguous: false })
    expect(err.message).toBe(
      "forms.setPublishSettings failed: HTTP 429 after 3 attempt(s): RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'Write requests' and limit 'Write requests per minute per user'",
    )
    expect(sleeps).toHaveLength(2)
  })

  it('retries transient 5xx and network errors for idempotent calls', async () => {
    const { g, client } = setup()
    const form = await client.create(create)
    g.fail('GET', 503)
    g.fail('GET', 0, { network: true })
    await expect(client.get(form.formId)).resolves.toMatchObject({ formId: form.formId })
    expect(g.ops()).toEqual(['create', 'get', 'get', 'get'])
  })

  it('create retries 429 (rejected before execution) but never retries 5xx; that failure is ambiguous', async () => {
    const { g, client } = setup()
    g.fail('POST /forms?', 429)
    await client.create(create)
    expect(g.ops()).toEqual(['create', 'create'])

    g.fail('POST /forms?', 503, { afterApply: true })
    const err = await client.create(create).catch(e => e)
    expect(err).toMatchObject({ method: 'forms.create', status: 503, ambiguous: true, attempts: 1 })
    expect(g.ops()).toEqual(['create', 'create', 'create'])
    expect(g.forms.size).toBe(2) // the fake applied it: exactly why the CLI must not retry
  })

  it('a create network failure is ambiguous and not retried', async () => {
    const { g, client } = setup()
    g.fail('POST /forms?', 0, { network: true })
    await expect(client.create(create)).rejects.toMatchObject({ status: 0, ambiguous: true })
    expect(g.calls).toHaveLength(1)
  })

  it('does not retry an unpinned batchUpdate (could double-apply)', async () => {
    const { g, client } = setup()
    const form = await client.create(create)
    g.fail(':batchUpdate', 503)
    await expect(client.batchUpdate(form.formId, { requests: [], includeFormInResponse: true })).rejects.toMatchObject({ status: 503 })
    expect(g.ops()).toEqual(['create', 'batchUpdate'])
  })

  it('does not retry other 4xx', async () => {
    const { g, client } = setup()
    await expect(client.get('missingForm_ABCDEFG')).rejects.toMatchObject({ status: 404, attempts: 1 })
    expect(g.calls).toHaveLength(1)
  })

  it('rejects malformed form IDs before sending anything', async () => {
    const { g, client } = setup()
    await expect(client.get('../../drive/v3/files')).rejects.toThrow('invalid form ID')
    expect(g.calls).toHaveLength(0)
  })

  it('redacts tokens and emails that appear in Google error bodies', async () => {
    const { g, client } = setup()
    g.fail('GET', 403, {
      body: { error: { status: 'PERMISSION_DENIED', message: `caller person@example.org lacks access; token ${TOKEN}` } },
    })
    const err = await client.get('someForm_ABCDEFG').catch(e => e)
    expect(err.message).toBe('forms.get failed: HTTP 403: PERMISSION_DENIED: caller [redacted-email] lacks access; token [redacted-access-token]')
  })
})

describe('helpers', () => {
  it('parses Retry-After seconds and HTTP dates', () => {
    expect(retryAfterMs('3')).toBe(3000)
    expect(retryAfterMs('Wed, 25 Nov 2026 00:00:10 GMT', Date.parse('Wed, 25 Nov 2026 00:00:00 GMT'))).toBe(10_000)
    expect(retryAfterMs('soon')).toBeNull()
    expect(retryAfterMs(null)).toBeNull()
  })

  it('redact covers bearer headers, refresh tokens, key JSON and editor URLs', () => {
    expect(redact('Authorization: Bearer abc.def')).toBe('Authorization: Bearer [redacted]')
    expect(redact('rt 1//0gFIXTUREREFRESHTOKEN')).toBe('rt [redacted-refresh-token]')
    expect(redact('{"client_secret": "shh", "refresh_token":"x"}')).toBe('{"client_secret":"[redacted]", "refresh_token":"[redacted]"}')
    expect(redact('see https://docs.google.com/forms/d/1AbC_def/edit#settings')).toBe('see [redacted-editor-url]')
    expect(redact('https://docs.google.com/forms/d/e/1FAIpQL/viewform')).toBe('https://docs.google.com/forms/d/e/1FAIpQL/viewform')
    expect(shortId('1AbCdEfGhIjKlMn')).toBe('1AbCdE…')
  })
})
