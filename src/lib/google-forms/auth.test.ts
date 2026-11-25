import { describe, expect, it } from 'vitest'
import { authFromEnv, NotConfiguredError, type ExecFileFn } from './auth'
import { liveRunnerFromEnv } from './live'

function exec(result: { stdout?: string; error?: { code?: string | number } }) {
  const calls: { file: string; args: string[] }[] = []
  const fn: ExecFileFn = async (file, args) => {
    calls.push({ file, args })
    if (result.error) throw Object.assign(new Error('failed: person@example.org'), result.error)
    return { stdout: result.stdout ?? '', stderr: '' }
  }
  return { fn, calls }
}

describe('authFromEnv', () => {
  it('is unconfigured (null) without GOOGLE_FORMS_AUTH and runs nothing', () => {
    const e = exec({ stdout: 'tok' })
    expect(authFromEnv({}, e.fn)).toBeNull()
    expect(e.calls).toEqual([])
  })

  it('rejects unsupported modes and bad quota projects', () => {
    expect(() => authFromEnv({ GOOGLE_FORMS_AUTH: 'service-account' }, exec({}).fn)).toThrow(NotConfiguredError)
    expect(() => authFromEnv({ GOOGLE_FORMS_AUTH: 'gcloud-adc', GOOGLE_FORMS_QUOTA_PROJECT: 'Bad Project!' }, exec({}).fn)).toThrow(/not a valid project ID/)
  })

  it('asks gcloud for an ADC access token once per run, without a shell', async () => {
    const e = exec({ stdout: 'ya29.abc\n' })
    const auth = authFromEnv({ GOOGLE_FORMS_AUTH: 'gcloud-adc', GOOGLE_FORMS_QUOTA_PROJECT: 'thrive-forms' }, e.fn)!
    expect(await auth.getToken()).toBe('ya29.abc')
    expect(await auth.getToken()).toBe('ya29.abc')
    expect(e.calls).toEqual([{ file: 'gcloud', args: ['auth', 'application-default', 'print-access-token'] }])
    expect(auth.quotaProject).toBe('thrive-forms')
  })

  it('explains a missing gcloud and a missing login without echoing gcloud output', async () => {
    const missing = authFromEnv({ GOOGLE_FORMS_AUTH: 'gcloud-adc' }, exec({ error: { code: 'ENOENT' } }).fn)!
    await expect(missing.getToken()).rejects.toThrow('gcloud CLI not found (or not executable) on PATH')
    const shadowed = authFromEnv({ GOOGLE_FORMS_AUTH: 'gcloud-adc' }, exec({ error: { code: 'EACCES' } }).fn)!
    await expect(shadowed.getToken()).rejects.toThrow('gcloud CLI not found')
    const noLogin = authFromEnv({ GOOGLE_FORMS_AUTH: 'gcloud-adc' }, exec({ error: { code: 1 } }).fn)!
    const err = await noLogin.getToken().catch(x => x)
    expect(err).toBeInstanceOf(NotConfiguredError)
    expect(err.message).toMatch(/no usable application-default login/)
    expect(err.message).not.toContain('@')
  })

  it('rejects an empty token', async () => {
    const auth = authFromEnv({ GOOGLE_FORMS_AUTH: 'gcloud-adc' }, exec({ stdout: '  \n' }).fn)!
    await expect(auth.getToken()).rejects.toThrow('no access token')
  })
})

describe('liveRunnerFromEnv', () => {
  const fetch = async () => {
    throw new Error('network must not be used')
  }
  it('returns no runner when unconfigured, and an error message for invalid config', () => {
    expect(liveRunnerFromEnv({ env: {}, execFile: exec({}).fn, fetch })).toEqual({})
    expect(liveRunnerFromEnv({ env: { GOOGLE_FORMS_AUTH: 'x' }, execFile: exec({}).fn, fetch }).error).toMatch(/GOOGLE_FORMS_AUTH must be/)
  })
})
