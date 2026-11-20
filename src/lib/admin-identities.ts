import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * A1 staff actor contract (D1R): individual one-time email code sign-in.
 *
 * Supabase Auth issues and verifies the email code, but only for staff who are
 * preprovisioned in `admin_staff_accounts` (service-role-only). The website
 * session is a NextAuth JWT holding {actorId, authUserId, authVersion} and
 * nothing from Supabase Auth. Every protected request re-reads the row and
 * requires status 'active', the same auth user, and the same auth version, so
 * disabling or rebinding a person revokes live sessions. Every failure path
 * resolves to "no actor" (fail closed). Email is a login detail, never an
 * authorship key. Nothing here logs emails, codes, or tokens.
 */

/** Short website session (seconds). JWT sessions slide while in use. */
export const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Supabase email OTP length is configurable from 6 to 10 digits. */
const CODE_RE = /^\d{6,10}$/

export type IdentityEnv = Record<string, string | undefined>

/** What the JWT carries. Not trusted until resolveActor() confirms it. */
export interface SessionIdentity {
  actorId: string
  authUserId: string
  authVersion: number
}

export interface StaffActor extends SessionIdentity {
  /** From the membership row, not the session. Login/contact detail only. */
  email: string
}

export interface StaffAccountRow {
  actor_id: string
  email: string
  auth_user_id: string
  status: string
  auth_version: number
}

/** Read-only view of the service-only table. Injected so tests need no database. */
export interface StaffStore {
  findByEmail(email: string): Promise<StaffAccountRow | null>
  findByActorId(actorId: string): Promise<StaffAccountRow | null>
}

/** The two Supabase Auth calls we use. Injected so tests stub the boundary. */
export interface OtpAuth {
  requestCode(email: string): Promise<void>
  /** Returns the verified Auth user id, or null. Retains no tokens. */
  verifyCode(email: string, code: string): Promise<string | null>
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.replace(/\s+/g, '')
  return CODE_RE.test(code) ? code : null
}

/** Parse untrusted JWT/session claims. Anything off-shape is null. */
export function parseSessionIdentity(raw: unknown): SessionIdentity | null {
  if (!raw || typeof raw !== 'object') return null
  const { actorId, authUserId, authVersion } = raw as Record<string, unknown>
  if (typeof actorId !== 'string' || !UUID_RE.test(actorId)) return null
  if (typeof authUserId !== 'string' || !UUID_RE.test(authUserId)) return null
  if (typeof authVersion !== 'number' || !Number.isInteger(authVersion) || authVersion < 1) return null
  return { actorId: actorId.toLowerCase(), authUserId: authUserId.toLowerCase(), authVersion }
}

function isActive(row: StaffAccountRow | null): row is StaffAccountRow {
  return !!row && row.status === 'active'
}

function toActor(row: StaffAccountRow): StaffActor {
  return {
    actorId: row.actor_id.toLowerCase(),
    authUserId: row.auth_user_id.toLowerCase(),
    authVersion: row.auth_version,
    email: row.email,
  }
}

/**
 * Resolve session claims to an active actor, or null. Missing, disabled,
 * rebound (different auth user), or stale-version identities all fail, and so
 * does any store error.
 */
export async function resolveActor(
  claims: unknown,
  store: StaffStore | null,
): Promise<StaffActor | null> {
  const identity = parseSessionIdentity(claims)
  if (!identity || !store) return null
  try {
    const row = await store.findByActorId(identity.actorId)
    if (!isActive(row)) return null
    if (row.auth_user_id.toLowerCase() !== identity.authUserId) return null
    if (row.auth_version !== identity.authVersion) return null
    return toActor(row)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Abuse controls (per server instance; Supabase enforces its own limits too)
// ---------------------------------------------------------------------------

export interface RateLimiter {
  /** Returns false when the key has used up its allowance in the window. */
  take(key: string): boolean
}

export function createRateLimiter(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
  maxKeys = 5000,
): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    take(key) {
      const t = now()
      const recent = (hits.get(key) ?? []).filter(h => t - h < windowMs)
      if (recent.length >= max) {
        hits.set(key, recent)
        return false
      }
      recent.push(t)
      hits.delete(key)
      hits.set(key, recent)
      while (hits.size > maxKeys) {
        const oldest = hits.keys().next().value
        if (oldest === undefined) break
        hits.delete(oldest)
      }
      return true
    },
  }
}

const WINDOW_MS = 15 * 60 * 1000
/** Request-code sends: per email, per client address, and a global cap per instance. */
export const codeRequestLimits = {
  email: createRateLimiter(3, WINDOW_MS),
  ip: createRateLimiter(10, WINDOW_MS),
  global: createRateLimiter(60, 60 * 60 * 1000),
}
/** Verification attempts: per email and per client address. */
export const codeVerifyLimits = {
  email: createRateLimiter(8, WINDOW_MS),
  ip: createRateLimiter(30, WINDOW_MS),
}

export interface AbuseLimits {
  email: RateLimiter
  ip: RateLimiter
  global?: RateLimiter
}

/** Hash so raw emails are not kept as map keys. */
export function limiterKey(scope: string, value: string): string {
  return createHash('sha256').update(`${scope}\u0000${value}`).digest('hex')
}

// ---------------------------------------------------------------------------
// Request a code
// ---------------------------------------------------------------------------

export type RequestCodeResult = { status: 'accepted' } | { status: 'rate_limited' }

export interface RequestCodeDeps {
  store: StaffStore | null
  otp: OtpAuth | null
  limits?: AbuseLimits
  clientKey: string
  /** Minimum wall time per call, so known and unknown emails take similar time. */
  minDurationMs?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/**
 * Sends a code only when the email belongs to an active preprovisioned staff
 * account. The result never reveals whether it did: every non-throttled path is
 * 'accepted'. Only the client-address and global limits are visible (429), and
 * they apply identically to every email. The per-email limit is silent.
 */
export async function requestStaffCode(rawEmail: unknown, deps: RequestCodeDeps): Promise<RequestCodeResult> {
  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? defaultSleep
  const started = now()
  const limits = deps.limits ?? codeRequestLimits

  const finish = async (result: RequestCodeResult): Promise<RequestCodeResult> => {
    const wait = (deps.minDurationMs ?? 0) - (now() - started)
    if (wait > 0) await sleep(wait)
    return result
  }

  if (!limits.ip.take(limiterKey('ip', deps.clientKey)) || (limits.global && !limits.global.take('all'))) {
    return finish({ status: 'rate_limited' })
  }

  const email = normalizeEmail(rawEmail)
  if (!email || !deps.store || !deps.otp) return finish({ status: 'accepted' })
  if (!limits.email.take(limiterKey('email', email))) return finish({ status: 'accepted' })

  try {
    const row = await deps.store.findByEmail(email)
    if (isActive(row)) await deps.otp.requestCode(email)
  } catch {
    // Swallowed on purpose: a failure must look the same as success.
  }
  return finish({ status: 'accepted' })
}

// ---------------------------------------------------------------------------
// Verify a code
// ---------------------------------------------------------------------------

export interface VerifyCodeDeps {
  store: StaffStore | null
  otp: OtpAuth | null
  limits?: Pick<AbuseLimits, 'email' | 'ip'>
  clientKey: string
}

/**
 * Verifies the emailed code and returns the active actor, or null for every
 * failure (unknown/disabled staff, wrong, expired, or replayed code, Auth user
 * that is not the bound one, throttling, or any error).
 */
export async function verifyStaffCode(
  rawEmail: unknown,
  rawCode: unknown,
  deps: VerifyCodeDeps,
): Promise<StaffActor | null> {
  const limits = deps.limits ?? codeVerifyLimits
  const email = normalizeEmail(rawEmail)
  const code = normalizeCode(rawCode)
  if (!email || !code || !deps.store || !deps.otp) return null
  if (!limits.ip.take(limiterKey('ip', deps.clientKey))) return null
  if (!limits.email.take(limiterKey('email', email))) return null

  try {
    const row = await deps.store.findByEmail(email)
    if (!isActive(row)) return null
    const authUserId = await deps.otp.verifyCode(email, code)
    if (!authUserId || authUserId.toLowerCase() !== row.auth_user_id.toLowerCase()) return null
    return toActor(row)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Supabase-backed implementations (server only)
// ---------------------------------------------------------------------------

function supabaseUrl(env: IdentityEnv): string | null {
  return env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null
}

/** Service-role store. Null when unconfigured, which callers treat as "deny". */
export function createStaffStore(env: IdentityEnv = process.env): StaffStore | null {
  const url = supabaseUrl(env)
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  const db: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const columns = 'actor_id, email, auth_user_id, status, auth_version'
  const one = async (column: string, value: string): Promise<StaffAccountRow | null> => {
    const { data, error } = await db.from('admin_staff_accounts').select(columns).eq(column, value).maybeSingle()
    if (error) throw new Error('staff lookup failed')
    return (data as StaffAccountRow | null) ?? null
  }
  return {
    findByEmail: email => one('email', email),
    findByActorId: actorId => one('actor_id', actorId),
  }
}

/**
 * Supabase Auth email OTP. Each call builds a fresh, nonpersistent, anon-key
 * client so nothing carries between requests, and any session it receives is
 * revoked and dropped before returning. The anon key can only start the OTP
 * flow; it cannot read `admin_staff_accounts`.
 */
export function createOtpAuth(env: IdentityEnv = process.env): OtpAuth | null {
  const url = supabaseUrl(env)
  const key = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim()
  if (!url || !key) return null
  const fresh = () => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return {
    async requestCode(email) {
      const { error } = await fresh().auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
      if (error) throw new Error('code request failed')
    },
    async verifyCode(email, code) {
      const client = fresh()
      const { data, error } = await client.auth.verifyOtp({ email, token: code, type: 'email' })
      try {
        // Best effort: revoke the Supabase session; the website never keeps it.
        if (data?.session) await client.auth.signOut({ scope: 'local' })
      } catch { /* ignore */ }
      if (error || !data?.user?.id) return null
      return data.user.id
    },
  }
}

/** First hop of x-forwarded-for (set by the platform), else a fixed bucket. */
export function clientKeyFrom(headers: { get(name: string): string | null } | Record<string, unknown> | undefined): string {
  if (!headers) return 'unknown'
  const read = (name: string): string => {
    const value = typeof (headers as { get?: unknown }).get === 'function'
      ? (headers as { get(n: string): string | null }).get(name)
      : (headers as Record<string, unknown>)[name]
    return typeof value === 'string' ? value : ''
  }
  const forwarded = read('x-forwarded-for').split(',')[0]?.trim()
  return forwarded || read('x-real-ip').trim() || 'unknown'
}
