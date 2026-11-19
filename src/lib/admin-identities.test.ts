import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  clientKeyFrom, normalizeCode, normalizeEmail, parseSessionIdentity,
  requestStaffCode, resolveActor, verifyStaffCode,
  type OtpAuth, type StaffAccountRow, type StaffStore,
} from './admin-identities'
import { createSubjectLimiter, type RateLimitStore, type SubjectLimiter } from './rate-limit'
import { createFakeRateLimitStore } from './rate-limit/fake-store'

const ACTOR = '11111111-1111-4111-8111-111111111111'
const AUTH = '22222222-2222-4222-8222-222222222222'
const OTHER_AUTH = '33333333-3333-4333-8333-333333333333'

function row(over: Partial<StaffAccountRow> = {}): StaffAccountRow {
  return { actor_id: ACTOR, email: 'pat@example.org', auth_user_id: AUTH, status: 'active', auth_version: 1, ...over }
}

function memoryStore(rows: StaffAccountRow[]): StaffStore {
  return {
    findByEmail: async email => rows.find(r => r.email === email) ?? null,
    findByActorId: async id => rows.find(r => r.actor_id === id) ?? null,
  }
}

function fakeOtp(over: Partial<OtpAuth> = {}) {
  const otp = {
    requestCode: vi.fn(async () => {}),
    verifyCode: vi.fn(async () => AUTH as string | null),
    ...over,
  }
  return otp as typeof otp & OtpAuth
}

const SECRET = 's'.repeat(32)
const T0 = 1_800_000_000_000

/** One fake store = one shared Postgres. Each createSubjectLimiter on it is a "server instance". */
const sharedLimiter = (now: () => number = () => T0) => {
  const store = createFakeRateLimitStore(now)
  return { store, limiter: createSubjectLimiter({ secret: SECRET, store }) }
}
const open = () => sharedLimiter().limiter

const throwingStore: RateLimitStore = { take: async () => { throw new Error('db down') } }

const claims = { actorId: ACTOR, authUserId: AUTH, authVersion: 1 }

describe('resolveActor (every protected request)', () => {
  it('accepts an active row with matching auth user and version, taking email from the row', async () => {
    expect(await resolveActor(claims, memoryStore([row()]))).toEqual({ ...claims, email: 'pat@example.org' })
  })
  it('rejects unknown actors', async () => {
    expect(await resolveActor(claims, memoryStore([]))).toBeNull()
  })
  it('rejects a disabled account (revoked JWT)', async () => {
    expect(await resolveActor(claims, memoryStore([row({ status: 'disabled', auth_version: 2 })]))).toBeNull()
    // Even if someone disabled without a version bump, status alone fails closed.
    expect(await resolveActor(claims, memoryStore([row({ status: 'disabled' })]))).toBeNull()
  })
  it('rejects a stale version after disable/re-enable or rebind', async () => {
    expect(await resolveActor(claims, memoryStore([row({ auth_version: 3 })]))).toBeNull()
  })
  it('rejects a rebound auth user even at the same version', async () => {
    expect(await resolveActor(claims, memoryStore([row({ auth_user_id: OTHER_AUTH })]))).toBeNull()
  })
  it('rejects malformed claims and a missing store', async () => {
    const store = memoryStore([row()])
    for (const bad of [null, undefined, 'x', {}, { ...claims, actorId: 'staff_abc' }, { ...claims, authVersion: '1' },
      { ...claims, authVersion: 0 }, { ...claims, authUserId: 'nope' }]) {
      expect(await resolveActor(bad, store)).toBeNull()
    }
    expect(await resolveActor(claims, null)).toBeNull()
  })
  it('fails closed when the store throws', async () => {
    const store: StaffStore = { findByEmail: async () => { throw new Error('db') }, findByActorId: async () => { throw new Error('db') } }
    expect(await resolveActor(claims, store)).toBeNull()
  })
  it('does not trust an email claim for identity', () => {
    expect(parseSessionIdentity({ ...claims, email: 'pat@example.org' })).toEqual(claims)
  })
})

describe('requestStaffCode', () => {
  it('sends a code only for an active preprovisioned account', async () => {
    const otp = fakeOtp()
    const r = await requestStaffCode(' Pat@Example.org ', { store: memoryStore([row()]), otp, limiter: open(), clientKey: 'a' })
    expect(r).toEqual({ status: 'accepted' })
    expect(otp.requestCode).toHaveBeenCalledWith('pat@example.org')
  })
  it('gives the same result and sends nothing for unknown, disabled, or malformed emails', async () => {
    const store = memoryStore([row({ status: 'disabled' })])
    const otp = fakeOtp()
    const known = await requestStaffCode('pat@example.org', { store: memoryStore([row()]), otp: fakeOtp(), limiter: open(), clientKey: 'a' })
    for (const email of ['pat@example.org', 'nobody@example.org', 'not-an-email', undefined, 42]) {
      const r = await requestStaffCode(email, { store, otp, limiter: open(), clientKey: 'a' })
      expect(r).toEqual(known)
    }
    expect(otp.requestCode).not.toHaveBeenCalled()
  })
  it('hides Supabase Auth failures behind the same result', async () => {
    const otp = fakeOtp({ requestCode: vi.fn(async () => { throw new Error('over_email_send_rate_limit') }) })
    const r = await requestStaffCode('pat@example.org', { store: memoryStore([row()]), otp, limiter: open(), clientKey: 'a' })
    expect(r).toEqual({ status: 'accepted' })
  })
  it('is unavailable-safe when Supabase is not configured', async () => {
    expect(await requestStaffCode('pat@example.org', { store: null, otp: null, limiter: open(), clientKey: 'a' })).toEqual({ status: 'accepted' })
  })
  it('throttles by client address identically for any email, and silently per email', async () => {
    const otp = fakeOtp()
    const deps = { store: memoryStore([row()]), otp, limiter: open(), clientKey: 'ip1' }
    // Per-email limit is 3: the 4th request for the same email is silent (no send).
    for (let i = 0; i < 4; i++) {
      expect(await requestStaffCode('pat@example.org', deps)).toEqual({ status: 'accepted' })
    }
    expect(otp.requestCode).toHaveBeenCalledTimes(3)
    for (let i = 0; i < 6; i++) {
      expect(await requestStaffCode('unknown@example.org', deps)).toEqual({ status: 'accepted' })
    }
    // IP budget (10) now spent: visible throttle regardless of email.
    const a = await requestStaffCode('pat@example.org', deps)
    const b = await requestStaffCode('unknown@example.org', deps)
    expect(a.status).toBe('rate_limited')
    expect(b.status).toBe('rate_limited')
    expect(otp.requestCode).toHaveBeenCalledTimes(3)
  })
  it('enforces a global cap and a minimum duration', async () => {
    const sleeps: number[] = []
    let t = 0
    const base = open()
    const limiter: SubjectLimiter = async (rule, subject) =>
      rule.purpose === 'otp.request.global'
        ? { allowed: false, retryAfterSeconds: 30, reason: 'limited' }
        : base(rule, subject)
    const r = await requestStaffCode('nobody@example.org', {
      store: memoryStore([]), otp: fakeOtp(), clientKey: 'a', minDurationMs: 500,
      limiter, now: () => t, sleep: async ms => { sleeps.push(ms); t += ms },
    })
    expect(r).toEqual({ status: 'rate_limited', retryAfterSeconds: 30 })
    expect(sleeps).toEqual([500])
  })
  it('pads unavailable results too', async () => {
    const sleeps: number[] = []
    let t = 0
    const r = await requestStaffCode('pat@example.org', {
      store: memoryStore([row()]), otp: fakeOtp(), clientKey: 'a', minDurationMs: 500,
      limiter: createSubjectLimiter({ secret: null, store: createFakeRateLimitStore() }),
      now: () => t, sleep: async ms => { sleeps.push(ms); t += ms },
    })
    expect(r).toEqual({ status: 'unavailable' })
    expect(sleeps).toEqual([500])
  })
  it('reports a retryAfterSeconds within the window when rate limited', async () => {
    const deps = { store: memoryStore([]), otp: fakeOtp(), limiter: sharedLimiter(() => T0 + 1234).limiter, clientKey: 'a' }
    let last: Awaited<ReturnType<typeof requestStaffCode>> = { status: 'accepted' }
    for (let i = 0; i < 11; i++) last = await requestStaffCode('x@example.org', deps)
    expect(last.status).toBe('rate_limited')
    if (last.status !== 'rate_limited') throw new Error('unreachable')
    expect(last.retryAfterSeconds).toBeGreaterThan(0)
    expect(last.retryAfterSeconds).toBeLessThanOrEqual(900)
  })
})

describe('shared limiting across server instances', () => {
  it('keeps IPv6 clients from clientKeyFrom in their own /64 budget, not the shared unknown bucket', async () => {
    const { store, limiter } = sharedLimiter()
    const take = vi.spyOn(store, 'take')
    const deps = (xff: string) => ({
      store: memoryStore([]), otp: fakeOtp(), limiter, clientKey: clientKeyFrom({ 'x-forwarded-for': xff }),
    })
    for (let i = 0; i < 10; i++) await requestStaffCode('x@example.org', deps(`2001:db8:1:2::${i + 1}`))
    expect((await requestStaffCode('x@example.org', deps('2001:db8:1:2::ff'))).status).toBe('rate_limited')
    expect((await requestStaffCode('x@example.org', deps('2001:db8:9:9::1'))).status).toBe('accepted')
    expect((await requestStaffCode('x@example.org', deps('not-an-ip'))).status).toBe('accepted')
    const ipHashes = new Set(take.mock.calls.filter(c => c[0].purpose === 'otp.request.ip').map(c => c[0].subjectHash))
    expect(ipHashes.size).toBe(3)
  })

  it('shares the ip request budget between two instances', async () => {
    const { store } = sharedLimiter()
    const mk = () => ({ store: memoryStore([]), otp: fakeOtp(), limiter: createSubjectLimiter({ secret: SECRET, store }), clientKey: '1.2.3.4' })
    const instances = [mk(), mk()]
    const results = []
    for (let i = 0; i < 11; i++) results.push(await requestStaffCode('x@example.org', instances[i % 2]))
    expect(results.slice(0, 10).every(r => r.status === 'accepted')).toBe(true)
    expect(results[10].status).toBe('rate_limited')
  })
  it('shares the per-email verify budget between two instances', async () => {
    const { store } = sharedLimiter()
    const mk = (otp: OtpAuth) => ({ store: memoryStore([row()]), otp, limiter: createSubjectLimiter({ secret: SECRET, store }), clientKey: '1.2.3.4' })
    const otp = fakeOtp({ verifyCode: vi.fn(async () => null) })
    const instances = [mk(otp), mk(otp)]
    for (let i = 0; i < 8; i++) expect(await verifyStaffCode('pat@example.org', '123456', instances[i % 2])).toBeNull()
    expect(otp.verifyCode).toHaveBeenCalledTimes(8)
    const good = fakeOtp()
    expect(await verifyStaffCode('pat@example.org', '123456', { ...instances[0], otp: good })).toBeNull()
    expect(good.verifyCode).not.toHaveBeenCalled()
  })
  it('silently suppresses per-email sends within a window and resumes at the boundary', async () => {
    let t = T0
    const WINDOW_MS = 900_000
    const boundary = (Math.floor(T0 / WINDOW_MS) + 1) * WINDOW_MS
    t = boundary - WINDOW_MS + 1000
    const otp = fakeOtp()
    // Distinct client addresses so only the email budget is exercised.
    const { limiter } = sharedLimiter(() => t)
    let n = 0
    const call = () => requestStaffCode('pat@example.org', { store: memoryStore([row()]), otp, limiter, clientKey: `10.0.0.${++n}` })
    for (let i = 0; i < 5; i++) expect(await call()).toEqual({ status: 'accepted' })
    expect(otp.requestCode).toHaveBeenCalledTimes(3)
    t = boundary - 1
    expect(await call()).toEqual({ status: 'accepted' })
    expect(otp.requestCode).toHaveBeenCalledTimes(3)
    t = boundary
    expect(await call()).toEqual({ status: 'accepted' })
    expect(otp.requestCode).toHaveBeenCalledTimes(4)
  })
  it('isolates purposes: verify.email, request.email, and ip budgets do not bleed', async () => {
    const { limiter } = sharedLimiter()
    const otp = fakeOtp({ verifyCode: vi.fn(async () => null) })
    const base = { store: memoryStore([row()]), otp, limiter }
    for (let i = 0; i < 9; i++) await verifyStaffCode('pat@example.org', '123456', { ...base, clientKey: `10.0.1.${i}` })
    expect(otp.verifyCode).toHaveBeenCalledTimes(8)
    // Verify.email is exhausted, request.email for the same email is untouched.
    const sendOtp = fakeOtp()
    await requestStaffCode('pat@example.org', { ...base, otp: sendOtp, clientKey: '10.0.2.1' })
    expect(sendOtp.requestCode).toHaveBeenCalledTimes(1)
    // Exhaust request.ip for one address; verify.ip for that address still works.
    for (let i = 0; i < 11; i++) await requestStaffCode('other@example.org', { ...base, otp: fakeOtp(), clientKey: '10.0.3.1' })
    const verifyOtp = fakeOtp({ verifyCode: vi.fn(async () => null) })
    await verifyStaffCode('pat2@example.org', '123456', { ...base, otp: verifyOtp, store: memoryStore([row({ email: 'pat2@example.org' })]), clientKey: '10.0.3.1' })
    expect(verifyOtp.verifyCode).toHaveBeenCalledTimes(1)
  })
})

describe('fail closed when the limiter is unhealthy', () => {
  const variants: [string, () => SubjectLimiter][] = [
    ['missing secret', () => createSubjectLimiter({ secret: null, store: createFakeRateLimitStore() })],
    ['missing store', () => createSubjectLimiter({ secret: SECRET, store: null })],
    ['throwing store', () => createSubjectLimiter({ secret: SECRET, store: throwingStore })],
  ]
  it.each(variants)('request is identically unavailable and sends nothing (%s)', async (_n, make) => {
    const otp = fakeOtp()
    const find = vi.fn(async () => row())
    const store: StaffStore = { findByEmail: find, findByActorId: async () => null }
    for (const email of ['pat@example.org', 'nobody@example.org', 'not-an-email', undefined]) {
      expect(await requestStaffCode(email, { store, otp, limiter: make(), clientKey: 'a' })).toEqual({ status: 'unavailable' })
    }
    expect(otp.requestCode).not.toHaveBeenCalled()
    expect(find).not.toHaveBeenCalled()
  })
  it.each(variants)('verify returns null before any lookup (%s)', async (_n, make) => {
    const otp = fakeOtp()
    const find = vi.fn(async () => row())
    const store: StaffStore = { findByEmail: find, findByActorId: async () => null }
    expect(await verifyStaffCode('pat@example.org', '123456', { store, otp, limiter: make(), clientKey: 'a' })).toBeNull()
    expect(otp.verifyCode).not.toHaveBeenCalled()
    expect(find).not.toHaveBeenCalled()
  })
  it('is unavailable (not accepted) when only the email purpose fails, for known and unknown email alike', async () => {
    const base = open()
    const limiter: SubjectLimiter = async (rule, subject) =>
      rule.purpose === 'otp.request.email'
        ? { allowed: false, retryAfterSeconds: 60, reason: 'unavailable' }
        : base(rule, subject)
    const otp = fakeOtp()
    for (const email of ['pat@example.org', 'nobody@example.org']) {
      expect(await requestStaffCode(email, { store: memoryStore([row()]), otp, limiter, clientKey: 'a' })).toEqual({ status: 'unavailable' })
    }
    expect(otp.requestCode).not.toHaveBeenCalled()
  })
})

describe('limiter privacy', () => {
  it('sends only keyed hashes to the store, never the email or address', async () => {
    const { store, limiter } = sharedLimiter()
    const take = vi.spyOn(store, 'take')
    const otp = fakeOtp({ verifyCode: vi.fn(async () => null) })
    const deps = { store: memoryStore([row()]), otp, limiter, clientKey: '203.0.113.77' }
    await requestStaffCode('Pat@Example.org', deps)
    await verifyStaffCode('pat@example.org', '123456', deps)
    expect(take.mock.calls.length).toBe(5)
    const json = JSON.stringify(take.mock.calls)
    expect(json).not.toContain('pat@example.org')
    expect(json.toLowerCase()).not.toContain('example.org')
    expect(json).not.toContain('203.0.113.77')
    for (const [input] of take.mock.calls) expect(input.subjectHash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('verifyStaffCode', () => {
  const deps = (rows: StaffAccountRow[], otp: OtpAuth) => ({ store: memoryStore(rows), otp, limiter: open(), clientKey: 'a' })

  it('returns the actor when Supabase confirms the bound auth user', async () => {
    const otp = fakeOtp()
    expect(await verifyStaffCode('Pat@example.org', '123 456', deps([row()], otp))).toEqual({ ...claims, email: 'pat@example.org' })
    expect(otp.verifyCode).toHaveBeenCalledWith('pat@example.org', '123456')
  })
  it('rejects wrong, expired, or replayed codes (Supabase says no)', async () => {
    const otp = fakeOtp({ verifyCode: vi.fn(async () => null) })
    expect(await verifyStaffCode('pat@example.org', '000000', deps([row()], otp))).toBeNull()
  })
  it('rejects a code verified for a different auth user than the bound one (rebound)', async () => {
    const otp = fakeOtp({ verifyCode: vi.fn(async () => OTHER_AUTH) })
    expect(await verifyStaffCode('pat@example.org', '123456', deps([row()], otp))).toBeNull()
  })
  it('rejects unknown and disabled staff without asking Supabase to verify', async () => {
    const otp = fakeOtp()
    expect(await verifyStaffCode('nobody@example.org', '123456', deps([row()], otp))).toBeNull()
    expect(await verifyStaffCode('pat@example.org', '123456', deps([row({ status: 'disabled' })], otp))).toBeNull()
    expect(otp.verifyCode).not.toHaveBeenCalled()
  })
  it('rejects malformed input and unconfigured Supabase', async () => {
    const otp = fakeOtp()
    for (const [e, c] of [['pat@example.org', 'abc123'], ['pat@example.org', '12345'], ['pat@example.org', undefined], ['bad', '123456']] as const) {
      expect(await verifyStaffCode(e, c, deps([row()], otp))).toBeNull()
    }
    expect(await verifyStaffCode('pat@example.org', '123456', { store: null, otp: null, clientKey: 'a' })).toBeNull()
    expect(otp.verifyCode).not.toHaveBeenCalled()
  })
  it('fails closed on errors and on brute-force throttling', async () => {
    const boom = fakeOtp({ verifyCode: vi.fn(async () => { throw new Error('network') }) })
    expect(await verifyStaffCode('pat@example.org', '123456', deps([row()], boom))).toBeNull()

    const otp = fakeOtp({ verifyCode: vi.fn(async () => null) })
    const d = { store: memoryStore([row()]), otp, limiter: open(), clientKey: 'a' }
    for (let i = 0; i < 8; i++) await verifyStaffCode('pat@example.org', '111111', d)
    const good = fakeOtp()
    expect(await verifyStaffCode('pat@example.org', '123456', { ...d, otp: good })).toBeNull()
    expect(good.verifyCode).not.toHaveBeenCalled()
  })
})

describe('helpers', () => {
  it('normalizes email and code', () => {
    expect(normalizeEmail('  A@B.co ')).toBe('a@b.co')
    expect(normalizeEmail('a@b')).toBeNull()
    expect(normalizeEmail('x'.repeat(250) + '@b.co')).toBeNull()
    expect(normalizeCode('1234 5678')).toBe('12345678')
    expect(normalizeCode('12345')).toBeNull()
    expect(normalizeCode('12345678901')).toBeNull()
  })
  it('reads the client address from forwarded headers', () => {
    expect(clientKeyFrom(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
    expect(clientKeyFrom({ 'x-real-ip': '9.9.9.9' })).toBe('9.9.9.9')
    expect(clientKeyFrom(undefined)).toBe('unknown')
  })
  it('normalizes the client address', () => {
    expect(clientKeyFrom({ 'x-forwarded-for': '1.2.3.4:5' })).toBe('1.2.3.4')
    expect(clientKeyFrom({ 'x-forwarded-for': '2001:db8:1:2:aaaa:bbbb:cccc:dddd' })).toBe('2001:db8:1:2::/64')
    expect(clientKeyFrom({ 'x-forwarded-for': 'garbage' })).toBe('unknown')
    expect(clientKeyFrom({})).toBe('unknown')
  })
})

describe('admin_staff_accounts migration and schema', () => {
  const sql = [
    readFileSync('supabase/migrations/20261118000000_admin_staff_accounts.sql', 'utf8'),
    readFileSync('supabase/schema.sql', 'utf8'),
  ]
  it.each(sql.map((s, i) => [i === 0 ? 'migration' : 'schema.sql', s]))('%s is service-role-only, guarded, and preserving', (_n, s) => {
    expect(s).toMatch(/create table if not exists admin_staff_accounts/)
    expect(s).toMatch(/actor_id\s+uuid primary key default gen_random_uuid\(\)/)
    expect(s).toMatch(/create unique index if not exists admin_staff_accounts_email_key/)
    expect(s).toMatch(/create unique index if not exists admin_staff_accounts_auth_user_id_key/)
    expect(s).toMatch(/status in \('active', 'disabled'\)/)
    expect(s).toMatch(/alter table admin_staff_accounts enable row level security/)
    expect(s).not.toMatch(/create policy[^;]*admin_staff_accounts/)
    expect(s).toMatch(/revoke all on table admin_staff_accounts from anon/)
    expect(s).toMatch(/revoke all on table admin_staff_accounts from authenticated/)
    expect(s).toMatch(/revoke all on table admin_staff_accounts from service_role;\s*grant select, insert, update on table admin_staff_accounts to service_role/)
    // schema.sql also grants public reads on unrelated content tables.
    expect(s).not.toMatch(/grant\s+[^;]*\bon\s+(?:table\s+)?admin_staff_accounts\s+to\s+(?:public|anon|authenticated)\b/i)
    expect(s).toMatch(/new\.auth_version := greatest\(new\.auth_version, old\.auth_version\) \+ 1/)
    expect(s).toMatch(/tg_op in \('DELETE', 'TRUNCATE'\)[\s\S]*raise exception/)
    expect(s).toMatch(/before truncate on admin_staff_accounts\s+for each statement execute function admin_staff_accounts_guard\(\)/)
    expect(s).toMatch(/actor_id is immutable/)
  })
})
