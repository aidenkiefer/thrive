import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  clientKeyFrom, createRateLimiter, normalizeCode, normalizeEmail, parseSessionIdentity,
  requestStaffCode, resolveActor, verifyStaffCode,
  type AbuseLimits, type OtpAuth, type StaffAccountRow, type StaffStore,
} from './admin-identities'

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

const open = (): AbuseLimits => ({
  email: { take: () => true }, ip: { take: () => true }, global: { take: () => true },
})

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
    const r = await requestStaffCode(' Pat@Example.org ', { store: memoryStore([row()]), otp, limits: open(), clientKey: 'a' })
    expect(r).toEqual({ status: 'accepted' })
    expect(otp.requestCode).toHaveBeenCalledWith('pat@example.org')
  })
  it('gives the same result and sends nothing for unknown, disabled, or malformed emails', async () => {
    const store = memoryStore([row({ status: 'disabled' })])
    const otp = fakeOtp()
    const known = await requestStaffCode('pat@example.org', { store: memoryStore([row()]), otp: fakeOtp(), limits: open(), clientKey: 'a' })
    for (const email of ['pat@example.org', 'nobody@example.org', 'not-an-email', undefined, 42]) {
      const r = await requestStaffCode(email, { store, otp, limits: open(), clientKey: 'a' })
      expect(r).toEqual(known)
    }
    expect(otp.requestCode).not.toHaveBeenCalled()
  })
  it('hides Supabase Auth failures behind the same result', async () => {
    const otp = fakeOtp({ requestCode: vi.fn(async () => { throw new Error('over_email_send_rate_limit') }) })
    const r = await requestStaffCode('pat@example.org', { store: memoryStore([row()]), otp, limits: open(), clientKey: 'a' })
    expect(r).toEqual({ status: 'accepted' })
  })
  it('is unavailable-safe when Supabase is not configured', async () => {
    expect(await requestStaffCode('pat@example.org', { store: null, otp: null, limits: open(), clientKey: 'a' })).toEqual({ status: 'accepted' })
  })
  it('throttles by client address identically for any email, and silently per email', async () => {
    let t = 0
    const limits: AbuseLimits = {
      email: createRateLimiter(1, 1000, () => t),
      ip: createRateLimiter(3, 1000, () => t),
    }
    const otp = fakeOtp()
    const deps = { store: memoryStore([row()]), otp, limits, clientKey: 'ip1' }
    expect(await requestStaffCode('pat@example.org', deps)).toEqual({ status: 'accepted' })
    // Second request for the same email: silent per-email limit, no second send.
    expect(await requestStaffCode('pat@example.org', deps)).toEqual({ status: 'accepted' })
    expect(otp.requestCode).toHaveBeenCalledTimes(1)
    expect(await requestStaffCode('unknown@example.org', deps)).toEqual({ status: 'accepted' })
    // IP budget (3) now spent: visible throttle regardless of email.
    expect(await requestStaffCode('pat@example.org', deps)).toEqual({ status: 'rate_limited' })
    expect(await requestStaffCode('unknown@example.org', deps)).toEqual({ status: 'rate_limited' })
  })
  it('enforces a global cap and a minimum duration', async () => {
    const sleeps: number[] = []
    let t = 0
    const r = await requestStaffCode('nobody@example.org', {
      store: memoryStore([]), otp: fakeOtp(), clientKey: 'a', minDurationMs: 500,
      limits: { ...open(), global: { take: () => false } },
      now: () => t, sleep: async ms => { sleeps.push(ms); t += ms },
    })
    expect(r).toEqual({ status: 'rate_limited' })
    expect(sleeps).toEqual([500])
  })
})

describe('verifyStaffCode', () => {
  const deps = (rows: StaffAccountRow[], otp: OtpAuth) => ({ store: memoryStore(rows), otp, limits: open(), clientKey: 'a' })

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
    const limits = { email: createRateLimiter(2, 1000, () => 0), ip: createRateLimiter(100, 1000, () => 0) }
    const d = { store: memoryStore([row()]), otp, limits, clientKey: 'a' }
    await verifyStaffCode('pat@example.org', '111111', d)
    await verifyStaffCode('pat@example.org', '222222', d)
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
  it('rate limiter expires old hits and bounds memory', () => {
    let t = 0
    const l = createRateLimiter(1, 100, () => t, 2)
    expect(l.take('a')).toBe(true)
    expect(l.take('a')).toBe(false)
    t = 101
    expect(l.take('a')).toBe(true)
    l.take('b'); l.take('c') // evicts the oldest key
    expect(l.take('a')).toBe(true)
  })
  it('reads the client address from forwarded headers', () => {
    expect(clientKeyFrom(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
    expect(clientKeyFrom({ 'x-real-ip': '9.9.9.9' })).toBe('9.9.9.9')
    expect(clientKeyFrom(undefined)).toBe('unknown')
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
    expect(s).toMatch(/grant select, insert, update on table admin_staff_accounts to service_role/)
    // schema.sql also grants public reads on unrelated content tables.
    expect(s).not.toMatch(/grant\s+[^;]*\bon\s+(?:table\s+)?admin_staff_accounts\s+to\s+(?:public|anon|authenticated)\b/i)
    expect(s).toMatch(/new\.auth_version := greatest\(new\.auth_version, old\.auth_version\) \+ 1/)
    expect(s).toMatch(/tg_op = 'DELETE'[\s\S]*raise exception/)
    expect(s).toMatch(/actor_id is immutable/)
  })
})
