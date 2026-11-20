import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  session: null as unknown,
  rows: [] as Array<Record<string, unknown>>,
  verifyOtp: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  signInWithOtp: vi.fn(),
}))

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => h.session) }))
vi.mock('next-auth/providers/credentials', () => ({ default: (o: unknown) => o }))
vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`) } }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((_url: string, key: string) => key === 'service-key'
    ? {
        from: () => ({
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => ({ data: h.rows.find(r => r[col] === val) ?? null, error: null }),
            }),
          }),
        }),
      }
    : { auth: { verifyOtp: h.verifyOtp, signOut: h.signOut, signInWithOtp: h.signInWithOtp } }),
}))

const ACTOR = '11111111-1111-4111-8111-111111111111'
const AUTH = '22222222-2222-4222-8222-222222222222'
const baseRow = { actor_id: ACTOR, email: 'pat@example.org', auth_user_id: AUTH, status: 'active', auth_version: 4 }

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.test'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  h.session = null
  h.rows = [{ ...baseRow }]
  h.verifyOtp.mockReset()
  h.signOut.mockClear()
})

async function load() {
  vi.resetModules()
  return import('./admin-auth')
}

type Authorize = (c: Record<string, unknown>, req: unknown) => Promise<Record<string, unknown> | null>
const provider = (m: Awaited<ReturnType<typeof load>>) =>
  (m.adminAuthOptions.providers[0] as unknown as { id: string; authorize: Authorize })
let ipCounter = 0
const req = () => ({ headers: { 'x-forwarded-for': `10.0.0.${++ipCounter}` } })

describe('NextAuth staff-code provider', () => {
  it('has no password or OIDC provider and uses a short JWT session', async () => {
    const m = await load()
    expect(m.adminAuthOptions.providers).toHaveLength(1)
    expect(provider(m).id).toBe('staff-code')
    expect(m.adminAuthOptions.session).toMatchObject({ strategy: 'jwt', maxAge: 4 * 60 * 60 })
    expect(m.adminAuthOptions.jwt?.maxAge).toBe(4 * 60 * 60)
  })

  it('verifies server-side with a nonpersistent client, then drops the Supabase session', async () => {
    h.verifyOtp.mockResolvedValue({ data: { user: { id: AUTH }, session: { access_token: 'sb-secret' } }, error: null })
    const m = await load()
    const user = await provider(m).authorize({ email: 'Pat@Example.org', code: '123456' }, req())
    expect(h.verifyOtp).toHaveBeenCalledWith({ email: 'pat@example.org', token: '123456', type: 'email' })
    expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(user).toEqual({ id: ACTOR, actorId: ACTOR, authUserId: AUTH, authVersion: 4 })
    expect(JSON.stringify(user)).not.toContain('sb-secret')
  })

  it('JWT and session hold only actorId, authUserId and authVersion', async () => {
    const m = await load()
    const jwt = m.adminAuthOptions.callbacks!.jwt!
    const token = await jwt({
      token: { sub: 'x', email: 'pat@example.org', name: 'Pat', access_token: 'sb-secret' },
      user: { id: ACTOR, actorId: ACTOR, authUserId: AUTH, authVersion: 4 } as never,
    } as never)
    expect(token).toEqual({ actorId: ACTOR, authUserId: AUTH, authVersion: 4, signedInAt: expect.any(Number) })
    const session = await m.adminAuthOptions.callbacks!.session!({
      session: { user: { email: 'pat@example.org' }, expires: 'soon' },
      token: { ...token, access_token: 'sb-secret' },
    } as never)
    expect(session).toEqual({ expires: 'soon', identity: { actorId: ACTOR, authUserId: AUTH, authVersion: 4 } })
  })

  it('ends the session 4h after sign-in even while it is in use', async () => {
    const m = await load()
    const jwt = m.adminAuthOptions.callbacks!.jwt!
    const now = Math.floor(Date.now() / 1000)
    const claims = { actorId: ACTOR, authUserId: AUTH, authVersion: 4 }
    const live = { ...claims, signedInAt: now - (4 * 60 * 60 - 60) }
    expect(await jwt({ token: live } as never)).toEqual(live)
    expect(await jwt({ token: { ...claims, signedInAt: now - 4 * 60 * 60 } } as never)).toEqual({})
    // A token without a sign-in time (older format) is not extended either.
    expect(await jwt({ token: claims } as never)).toEqual({})
  })

  it.each([
    ['wrong/expired/replayed code', { data: { user: null, session: null }, error: { message: 'Token has expired or is invalid' } }],
    ['no user returned', { data: { user: null, session: null }, error: null }],
    ['a different auth user', { data: { user: { id: '33333333-3333-4333-8333-333333333333' }, session: null }, error: null }],
  ])('rejects %s', async (_n, response) => {
    h.verifyOtp.mockResolvedValue(response)
    const m = await load()
    expect(await provider(m).authorize({ email: 'pat@example.org', code: '123456' }, req())).toBeNull()
  })

  it('rejects disabled or unknown staff before asking Supabase to verify', async () => {
    const m = await load()
    h.rows = [{ ...baseRow, status: 'disabled', auth_version: 5 }]
    expect(await provider(m).authorize({ email: 'pat@example.org', code: '123456' }, req())).toBeNull()
    expect(await provider(m).authorize({ email: 'nobody@example.org', code: '123456' }, req())).toBeNull()
    expect(h.verifyOtp).not.toHaveBeenCalled()
  })

  it('denies when NEXTAUTH_SECRET or Supabase config is missing', async () => {
    h.verifyOtp.mockResolvedValue({ data: { user: { id: AUTH }, session: null }, error: null })
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    let m = await load()
    expect(await provider(m).authorize({ email: 'pat@example.org', code: '123456' }, req())).toBeNull()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    delete process.env.NEXTAUTH_SECRET
    m = await load()
    expect(await provider(m).authorize({ email: 'pat@example.org', code: '123456' }, req())).toBeNull()
  })
})

describe('requireAdmin / getStaffActor', () => {
  const sessionFor = (over: Record<string, unknown> = {}) => ({
    identity: { actorId: ACTOR, authUserId: AUTH, authVersion: 4, ...over },
  })

  it('returns the actor for a live matching session', async () => {
    h.session = sessionFor()
    const m = await load()
    expect(await m.requireAdmin()).toEqual({ email: 'pat@example.org', actorId: ACTOR })
    expect((await m.getStaffActor())?.authVersion).toBe(4)
  })

  it('redirects with no session, with a legacy shared-login session, or without NEXTAUTH_SECRET', async () => {
    const m = await load()
    h.session = null
    await expect(m.requireAdmin()).rejects.toThrow('REDIRECT:/admin/login')
    h.session = { user: { email: 'shared@example.org' } }
    await expect(m.requireAdmin()).rejects.toThrow('REDIRECT:/admin/login')
    h.session = sessionFor()
    delete process.env.NEXTAUTH_SECRET
    expect(await m.getStaffActor()).toBeNull()
  })

  it('revokes an existing JWT when the staff member is disabled, rebound, or re-versioned', async () => {
    h.session = sessionFor()
    const m = await load()
    expect(await m.getStaffActor()).not.toBeNull()
    h.rows = [{ ...baseRow, status: 'disabled', auth_version: 5 }]
    await expect(m.requireAdmin()).rejects.toThrow('REDIRECT:/admin/login')
    h.rows = [{ ...baseRow, auth_user_id: '33333333-3333-4333-8333-333333333333', auth_version: 5 }]
    expect(await m.getStaffActor()).toBeNull()
    h.rows = [{ ...baseRow, auth_version: 5 }]
    expect(await m.getStaffActor()).toBeNull()
  })

  it('treats a deleted row as no actor and the old session as dead after sign-out', async () => {
    h.session = sessionFor()
    const m = await load()
    h.rows = []
    expect(await m.getStaffActor()).toBeNull()
    // Sign-out clears the cookie, so getServerSession yields no session.
    h.rows = [{ ...baseRow }]
    h.session = null
    expect(await m.getStaffActor()).toBeNull()
  })
})
