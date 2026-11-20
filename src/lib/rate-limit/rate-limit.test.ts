import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const createClient = vi.fn(() => ({ rpc }))
vi.mock('@supabase/supabase-js', () => ({ createClient: (...a: unknown[]) => (createClient as (...x: unknown[]) => unknown)(...a) }))

import {
  createSubjectLimiter, createSupabaseRateLimitStore, hashLimiterSubject, limiterSecret, normalizeIpSubject,
  takeSharedRateLimit,
  type RateLimitStore, type SharedRateLimitInput,
} from './index'
import { createFakeRateLimitStore } from './fake-store'

const T0 = 1_800_000_000_000
const H1 = 'a'.repeat(64)
const H2 = 'b'.repeat(64)
const SECRET = 's'.repeat(32)

function input(over: Partial<SharedRateLimitInput> = {}): SharedRateLimitInput {
  return { purpose: 'forms.submit', subjectHash: H1, limit: 3, windowSeconds: 60, ...over }
}

function clock(start = T0) {
  let t = start
  return { now: () => t, set: (v: number) => { t = v }, advance: (ms: number) => { t += ms } }
}

describe('fixed window semantics', () => {
  it('uses window-aligned start times', () => {
    expect(T0 % 60_000).toBe(0)
    expect(T0 % 900_000).toBe(0)
  })

  it('allows exactly limit calls then denies with seconds left', async () => {
    const c = clock()
    const store = createFakeRateLimitStore(c.now)
    for (let i = 0; i < 3; i++) {
      expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: true, retryAfterSeconds: 0, reason: 'ok' })
    }
    expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: false, retryAfterSeconds: 60, reason: 'limited' })
    c.advance(20_500)
    expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: false, retryAfterSeconds: 40, reason: 'limited' })
  })

  it('denies on the last ms and allows again at the next window with a fresh count', async () => {
    const c = clock()
    const store = createFakeRateLimitStore(c.now)
    for (let i = 0; i < 4; i++) await takeSharedRateLimit(input(), { store })
    c.set(T0 + 59_999)
    expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: false, retryAfterSeconds: 1, reason: 'limited' })
    c.set(T0 + 60_000)
    for (let i = 0; i < 3; i++) expect((await takeSharedRateLimit(input(), { store })).allowed).toBe(true)
    expect((await takeSharedRateLimit(input(), { store })).allowed).toBe(false)
  })

  it('shares the count across limiter instances on one store', async () => {
    const store = createFakeRateLimitStore(clock().now)
    const a = { store }
    const b = { store }
    await takeSharedRateLimit(input(), a)
    await takeSharedRateLimit(input(), a)
    expect((await takeSharedRateLimit(input(), b)).allowed).toBe(true)
    expect((await takeSharedRateLimit(input(), a)).allowed).toBe(false)
    expect((await takeSharedRateLimit(input(), b)).allowed).toBe(false)
  })

  it('isolates purpose, subject, and window size', async () => {
    const store = createFakeRateLimitStore(clock().now)
    const exhaust = async (over: Partial<SharedRateLimitInput>) => {
      for (let i = 0; i < 3; i++) await takeSharedRateLimit(input(over), { store })
    }
    await exhaust({})
    expect((await takeSharedRateLimit(input(), { store })).allowed).toBe(false)
    expect((await takeSharedRateLimit(input({ purpose: 'admin.code' }), { store })).allowed).toBe(true)
    expect((await takeSharedRateLimit(input({ subjectHash: H2 }), { store })).allowed).toBe(true)
    expect((await takeSharedRateLimit(input({ windowSeconds: 900 }), { store })).allowed).toBe(true)
  })

  it('sweeps expired entries', async () => {
    const c = clock()
    const store = createFakeRateLimitStore(c.now)
    for (let i = 0; i < 5; i++) await store.take(input({ subjectHash: String(i).repeat(64) }))
    expect(store.size()).toBe(5)
    c.advance(61_000)
    await store.take(input({ subjectHash: H2 }))
    expect(store.size()).toBe(1)
  })

  it('fake store throws on invalid input like the SQL', async () => {
    await expect(createFakeRateLimitStore().take(input({ limit: 0 }))).rejects.toThrow()
  })
})

describe('hashLimiterSubject', () => {
  it('is 64 hex, deterministic, and separated by purpose and secret', () => {
    const h = hashLimiterSubject('forms.submit', 'pat@example.org', SECRET)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(hashLimiterSubject('forms.submit', 'pat@example.org', SECRET)).toBe(h)
    expect(hashLimiterSubject('admin.code', 'pat@example.org', SECRET)).not.toBe(h)
    expect(hashLimiterSubject('forms.submit', 'pat@example.org', 'x'.repeat(32))).not.toBe(h)
    expect(h).not.toContain('pat')
  })

  it('throws on invalid purpose or empty secret', () => {
    expect(() => hashLimiterSubject('Bad Purpose', 'x', SECRET)).toThrow()
    expect(() => hashLimiterSubject('forms.submit', 'x', '')).toThrow()
    expect(() => hashLimiterSubject('forms.submit', 'x', 'x'.repeat(31))).toThrow()
  })
})

describe('limiterSecret', () => {
  it('rejects missing, blank, and short values', () => {
    expect(limiterSecret({})).toBeNull()
    expect(limiterSecret({ RATE_LIMIT_HASH_SECRET: '   ' })).toBeNull()
    expect(limiterSecret({ RATE_LIMIT_HASH_SECRET: 'x'.repeat(31) })).toBeNull()
  })

  it('returns the trimmed value and ignores NEXTAUTH_SECRET', () => {
    expect(limiterSecret({ RATE_LIMIT_HASH_SECRET: `  ${SECRET}\n` })).toBe(SECRET)
    expect(limiterSecret({ NEXTAUTH_SECRET: SECRET })).toBeNull()
  })
})

describe('fail closed', () => {
  const unavailable = { allowed: false, retryAfterSeconds: 60, reason: 'unavailable' }
  const storeOf = (take: () => Promise<unknown>) => ({ take: vi.fn(take) }) as unknown as RateLimitStore & { take: ReturnType<typeof vi.fn> }

  it('denies when the store is unconfigured', async () => {
    expect(await takeSharedRateLimit(input(), { store: null })).toEqual(unavailable)
  })

  it('denies when the store throws or rejects', async () => {
    const thrower = { take: () => { throw new Error('boom') } } as unknown as RateLimitStore
    expect(await takeSharedRateLimit(input(), { store: thrower })).toEqual(unavailable)
    expect(await takeSharedRateLimit(input(), { store: storeOf(async () => { throw new Error('boom') }) })).toEqual(unavailable)
  })

  it.each([
    ['allowed string', { allowed: 'yes', retryAfterSeconds: 0 }],
    ['negative retry', { allowed: true, retryAfterSeconds: -1 }],
    ['fractional retry', { allowed: false, retryAfterSeconds: 1.5 }],
    ['NaN retry', { allowed: false, retryAfterSeconds: NaN }],
    ['denied with zero retry', { allowed: false, retryAfterSeconds: 0 }],
    ['null', null],
  ])('denies on malformed result: %s', async (_name, result) => {
    expect(await takeSharedRateLimit(input(), { store: storeOf(async () => result) })).toEqual(unavailable)
  })

  it('caps retry at the window size', async () => {
    const store = storeOf(async () => ({ allowed: false, retryAfterSeconds: 9999 }))
    expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: false, retryAfterSeconds: 60, reason: 'limited' })
  })

  it.each([
    ['bad purpose', { purpose: '1bad' }],
    ['uppercase purpose', { purpose: 'Forms' }],
    ['non-hex subject', { subjectHash: 'z'.repeat(64) }],
    ['63-char subject', { subjectHash: 'a'.repeat(63) }],
    ['limit 0', { limit: 0 }],
    ['limit 1.5', { limit: 1.5 }],
    ['window 0', { windowSeconds: 0 }],
    ['window 86401', { windowSeconds: 86401 }],
  ])('denies invalid input without reaching the store: %s', async (_name, over) => {
    const store = storeOf(async () => ({ allowed: true, retryAfterSeconds: 0 }))
    expect(await takeSharedRateLimit(input(over), { store })).toEqual(unavailable)
    expect(store.take).not.toHaveBeenCalled()
  })
})

describe('createSupabaseRateLimitStore', () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' }
  const reply = (value: unknown) => rpc.mockReturnValue({ abortSignal: vi.fn(async () => value) })

  beforeEach(() => {
    rpc.mockReset()
    createClient.mockClear()
  })

  it('returns null without URL or service key', () => {
    expect(createSupabaseRateLimitStore({ SUPABASE_SERVICE_ROLE_KEY: 'k' })).toBeNull()
    expect(createSupabaseRateLimitStore({ NEXT_PUBLIC_SUPABASE_URL: 'https://x', SUPABASE_SERVICE_ROLE_KEY: '  ' })).toBeNull()
    expect(createClient).not.toHaveBeenCalled()
  })

  it('calls take_rate_limit with exact params and accepts array data', async () => {
    reply({ data: [{ allowed: false, retry_after_seconds: 12 }], error: null })
    const store = createSupabaseRateLimitStore(env)!
    expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: false, retryAfterSeconds: 12, reason: 'limited' })
    expect(rpc).toHaveBeenCalledWith('take_rate_limit', {
      p_purpose: 'forms.submit', p_subject_hash: H1, p_limit: 3, p_window_seconds: 60,
    })
    expect(createClient).toHaveBeenCalledTimes(1)
  })

  it('accepts object data', async () => {
    reply({ data: { allowed: true, retry_after_seconds: 0 }, error: null })
    const store = createSupabaseRateLimitStore(env)!
    expect(await takeSharedRateLimit(input(), { store })).toEqual({ allowed: true, retryAfterSeconds: 0, reason: 'ok' })
  })

  it('denies on rpc error and the thrown message hides the subject', async () => {
    reply({ data: null, error: { message: `failed for ${H1}` } })
    const store = createSupabaseRateLimitStore(env)!
    expect(await takeSharedRateLimit(input(), { store })).toMatchObject({ allowed: false, reason: 'unavailable' })
    const err = await store.take(input()).catch((e: Error) => e)
    expect((err as Error).message).toBe('rate limit store failed')
    expect((err as Error).message).not.toContain(H1)
  })

  it('passes a timeout signal and denies when the request aborts', async () => {
    const abortSignal = vi.fn(async (signal: AbortSignal) => {
      expect(signal).toBeInstanceOf(AbortSignal)
      throw new DOMException('timed out', 'TimeoutError')
    })
    rpc.mockReturnValue({ abortSignal })
    const store = createSupabaseRateLimitStore(env, 5)!
    expect(await takeSharedRateLimit(input(), { store })).toMatchObject({ allowed: false, reason: 'unavailable' })
    expect(abortSignal).toHaveBeenCalledTimes(1)
  })

  it('throws on malformed rpc rows', async () => {
    reply({ data: [{ allowed: true, retry_after_seconds: 1.5 }], error: null })
    await expect(createSupabaseRateLimitStore(env)!.take(input())).rejects.toThrow()
    reply({ data: [], error: null })
    await expect(createSupabaseRateLimitStore(env)!.take(input())).rejects.toThrow()
  })
})

describe('createSubjectLimiter', () => {
  const rule = { purpose: 'otp.request.ip', limit: 2, windowSeconds: 60 }

  it('hashes per purpose and shares counts across limiter instances on one store', async () => {
    const store = createFakeRateLimitStore(() => T0)
    const take = vi.spyOn(store, 'take')
    const a = createSubjectLimiter({ secret: SECRET, store })
    const b = createSubjectLimiter({ secret: SECRET, store })
    expect((await a(rule, '1.2.3.4')).allowed).toBe(true)
    expect((await b(rule, '1.2.3.4')).allowed).toBe(true)
    expect(await a(rule, '1.2.3.4')).toMatchObject({ allowed: false, reason: 'limited' })
    expect((await a({ ...rule, purpose: 'otp.verify.ip' }, '1.2.3.4')).allowed).toBe(true)
    const sent = take.mock.calls.map(c => c[0].subjectHash)
    expect(sent[0]).toBe(hashLimiterSubject('otp.request.ip', '1.2.3.4', SECRET))
    expect(sent[3]).not.toBe(sent[0])
    expect(JSON.stringify(take.mock.calls)).not.toContain('1.2.3.4')
  })

  it('denies without a secret, with a short secret, or with an empty subject', async () => {
    const store = createFakeRateLimitStore(() => T0)
    const take = vi.spyOn(store, 'take')
    expect((await createSubjectLimiter({ secret: null, store })(rule, 'x')).reason).toBe('unavailable')
    expect((await createSubjectLimiter({ secret: 'short', store })(rule, 'x')).reason).toBe('unavailable')
    expect((await createSubjectLimiter({ secret: SECRET, store })(rule, '')).reason).toBe('unavailable')
    expect(take).not.toHaveBeenCalled()
  })

  it('denies by default when RATE_LIMIT_HASH_SECRET is not configured', async () => {
    const prev = process.env.RATE_LIMIT_HASH_SECRET
    delete process.env.RATE_LIMIT_HASH_SECRET
    try {
      const store = createFakeRateLimitStore(() => T0)
      expect((await createSubjectLimiter({ store })(rule, 'x')).reason).toBe('unavailable')
    } finally {
      if (prev !== undefined) process.env.RATE_LIMIT_HASH_SECRET = prev
    }
  })
})

describe('failure logging', () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' }
  const capture = () => {
    const lines: string[] = []
    return { lines, log: (line: string) => { lines.push(line) } }
  }

  it('logs one fixed code per failure and nothing on success or a normal limit', async () => {
    const { lines, log } = capture()
    await takeSharedRateLimit(input(), { store: null, log })
    await takeSharedRateLimit(input({ purpose: 'Bad Purpose' }), { store: null, log })
    await takeSharedRateLimit(input(), { store: { take: async () => { throw new Error(`boom ${H1}`) } }, log })
    await takeSharedRateLimit(input(), { store: { take: async () => ({ allowed: 'yes' }) } as unknown as RateLimitStore, log })
    expect(lines).toEqual([
      '[rate-limit] unavailable code=not_configured purpose=forms.submit',
      '[rate-limit] unavailable code=invalid_input purpose=invalid',
      '[rate-limit] unavailable code=rpc_error purpose=forms.submit',
      '[rate-limit] unavailable code=rpc_error purpose=forms.submit',
    ])
    const store = createFakeRateLimitStore(() => T0)
    for (let i = 0; i < 5; i++) await takeSharedRateLimit(input(), { store, log })
    expect(lines).toHaveLength(4)
  })

  it('tells a timeout from an rpc error on the Supabase store', async () => {
    const { lines, log } = capture()
    rpc.mockReturnValue({ abortSignal: vi.fn(async () => { throw new DOMException('timed out', 'TimeoutError') }) })
    await takeSharedRateLimit(input(), { store: createSupabaseRateLimitStore(env, 5), log })
    rpc.mockReturnValue({ abortSignal: vi.fn(async () => ({ data: null, error: { message: 'AbortError: signal is aborted' } })) })
    await takeSharedRateLimit(input(), { store: createSupabaseRateLimitStore(env), log })
    rpc.mockReturnValue({ abortSignal: vi.fn(async () => ({ data: null, error: { message: `permission denied for ${H1}` } })) })
    await takeSharedRateLimit(input(), { store: createSupabaseRateLimitStore(env), log })
    rpc.mockReturnValue({ abortSignal: vi.fn(async () => ({ data: [], error: null })) })
    await takeSharedRateLimit(input(), { store: createSupabaseRateLimitStore(env), log })
    expect(lines.map(l => l.split(' ')[2])).toEqual(['code=timeout', 'code=timeout', 'code=rpc_error', 'code=rpc_error'])
  })

  it('never logs the subject or its hash from the subject limiter', async () => {
    const { lines, log } = capture()
    const rule = { purpose: 'otp.request.email', limit: 1, windowSeconds: 60 }
    await createSubjectLimiter({ secret: null, store: createFakeRateLimitStore(), log })(rule, 'pat@example.org')
    await createSubjectLimiter({ secret: SECRET, store: createFakeRateLimitStore(), log })(rule, '')
    await createSubjectLimiter({ secret: SECRET, store: { take: async () => { throw new Error('pat@example.org') } }, log })(rule, 'pat@example.org')
    expect(lines).toEqual([
      '[rate-limit] unavailable code=not_configured purpose=otp.request.email',
      '[rate-limit] unavailable code=invalid_input purpose=otp.request.email',
      '[rate-limit] unavailable code=rpc_error purpose=otp.request.email',
    ])
    expect(lines.join('\n')).not.toContain(hashLimiterSubject(rule.purpose, 'pat@example.org', SECRET))
  })
})

describe('normalizeIpSubject', () => {
  it.each([
    [' 1.2.3.4 ', '1.2.3.4'],
    ['1.2.3.4:8080', '1.2.3.4'],
    ['::ffff:1.2.3.4', '1.2.3.4'],
    ['[2001:DB8::1]:443', '2001:db8:0:0::/64'],
    ['2001:db8:0:0:ffff::1', '2001:db8:0:0::/64'],
    ['2001:0db8:00aa:0001:1:2:3:4', '2001:db8:aa:1::/64'],
    ['fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['', 'unknown'],
    ['unknown', 'unknown'],
    ['not-an-ip', 'unknown'],
    ['999.1.1.1', 'unknown'],
    [undefined, 'unknown'],
  ])('%s -> %s', (raw, expected) => {
    expect(normalizeIpSubject(raw)).toBe(expected)
  })

  it('is idempotent and unwraps hex-form mapped IPv4', () => {
    for (const raw of ['2001:db8:1:2::a', '1.2.3.4', '::ffff:102:304', 'junk']) {
      const once = normalizeIpSubject(raw)
      expect(normalizeIpSubject(once)).toBe(once)
    }
    expect(normalizeIpSubject('::ffff:102:304')).toBe('1.2.3.4')
  })

  it('groups a /64 together and separates different /64s', () => {
    expect(normalizeIpSubject('2001:db8:1:2::a')).toBe(normalizeIpSubject('2001:db8:1:2:ffff:ffff:ffff:ffff'))
    expect(normalizeIpSubject('2001:db8:1:2::a')).not.toBe(normalizeIpSubject('2001:db8:1:3::a'))
  })
})
