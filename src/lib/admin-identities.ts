import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseStaffRole, type StaffRole } from './admin-permissions'
import { createSubjectLimiter, normalizeIpSubject, type LimitRule, type SubjectLimiter } from './rate-limit'

export { clientKeyFrom } from './rate-limit'

/**
 * A1 staff actor contract (D1R): individual one-time email code sign-in.
 *
 * Supabase Auth issues and verifies the email code, but only for staff who are
 * in `admin_staff_accounts` (service-role-only), or for a new
 * @thrivevineyard.com address (self-signup: the server creates the Auth user
 * with the service role, and the first verified code inserts an active
 * 'staff'-role row). Off-domain people are only ever added by hand, and
 * existing rows are honored whatever their domain. The website
 * session is a NextAuth JWT holding {actorId, authUserId, authVersion} and
 * nothing from Supabase Auth. Every protected request re-reads the row and
 * requires status 'active', the same auth user, and the same auth version, so
 * disabling or rebinding a person revokes live sessions. Every failure path
 * resolves to "no actor" (fail closed). Email is a login detail, never an
 * authorship key. The role also comes from the row on every request (never
 * from the JWT), and a row with an unknown role is treated like a disabled one.
 * System actor rows (kind 'system', no email or auth user) are never matched.
 * Nothing here logs emails, codes, or tokens.
 */

/** Website session length (seconds), counted from sign-in; use does not extend it. */
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
  /** From the membership row on every request; interpret only via admin-permissions. */
  role: StaffRole
}

export interface StaffAccountRow {
  actor_id: string
  email: string
  auth_user_id: string
  status: string
  auth_version: number
  role: string
}

/** Read-only view of the service-only table. Injected so tests need no database. */
export interface StaffStore {
  findByEmail(email: string): Promise<StaffAccountRow | null>
  findByActorId(actorId: string): Promise<StaffAccountRow | null>
  /** Self-signup: create the Supabase Auth user (email confirmed) unless one exists. Public signup stays off. */
  ensureAuthUser(email: string): Promise<void>
  /**
   * Self-signup: insert an active 'staff'-role row. If the email already has a
   * row (a concurrent sign-in), returns that row; the caller re-checks it.
   */
  createStaff(email: string, authUserId: string): Promise<StaffAccountRow | null>
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

/** The only email domain that may create a new staff account by signing in. Subdomains do not count. */
export const STAFF_SIGNUP_DOMAIN = 'thrivevineyard.com'

/**
 * Self-signup gate: true only for a well-formed @thrivevineyard.com address.
 * Applies to emails with no roster row; it never revokes an existing row.
 */
export function isStaffSignupEmail(raw: unknown): boolean {
  const email = normalizeEmail(raw)
  return !!email && email.slice(email.lastIndexOf('@') + 1) === STAFF_SIGNUP_DOMAIN
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
  return !!row && row.status === 'active' && parseStaffRole(row.role) !== null
}

function toActor(row: StaffAccountRow): StaffActor {
  return {
    actorId: row.actor_id.toLowerCase(),
    authUserId: row.auth_user_id.toLowerCase(),
    authVersion: row.auth_version,
    email: row.email,
    role: parseStaffRole(row.role) as StaffRole,
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
// Abuse controls (counts shared across instances via Postgres; every limiter failure denies)
// ---------------------------------------------------------------------------

/** Request-code sends: per client address, per email, and a global cap. */
export const codeRequestRules = {
  ip: { purpose: 'otp.request.ip', limit: 10, windowSeconds: 900 },
  email: { purpose: 'otp.request.email', limit: 3, windowSeconds: 900 },
  global: { purpose: 'otp.request.global', limit: 60, windowSeconds: 3600 },
} satisfies Record<string, LimitRule>

/** Verification attempts: per client address and per email. */
export const codeVerifyRules = {
  ip: { purpose: 'otp.verify.ip', limit: 30, windowSeconds: 900 },
  email: { purpose: 'otp.verify.email', limit: 8, windowSeconds: 900 },
} satisfies Record<string, LimitRule>

/** Reads RATE_LIMIT_HASH_SECRET and Supabase env per call, so missing config denies. */
const defaultLimiter = createSubjectLimiter()

/** Subject for the single global counter. */
const GLOBAL_SUBJECT = 'all'

// ---------------------------------------------------------------------------
// Request a code
// ---------------------------------------------------------------------------

export type RequestCodeResult =
  | { status: 'accepted' }
  | { status: 'rate_limited'; retryAfterSeconds: number }
  | { status: 'unavailable' }

interface TimingDeps {
  /** Minimum wall time per call, so known and unknown emails take similar time. */
  minDurationMs?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  /** Receives one fixed, PII-free line when a send or verify throws. Defaults to console.error. */
  log?: (line: string) => void
}

export interface RequestCodeDeps extends TimingDeps {
  store: StaffStore | null
  otp: OtpAuth | null
  limiter?: SubjectLimiter
  clientKey: string
  /**
   * Runs the roster lookup and send after the response (the route passes
   * next/server `after`), so response time never depends on membership.
   * Without it the task runs inline, which only tests should rely on.
   */
  defer?: (task: () => Promise<void>) => void
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/** Starts the clock; the returned function waits out the rest of minDurationMs, then returns its argument. */
function padToMinimum(deps: TimingDeps): <T>(result: T) => Promise<T> {
  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? defaultSleep
  const started = now()
  return async result => {
    const wait = (deps.minDurationMs ?? 0) - (now() - started)
    if (wait > 0) await sleep(wait)
    return result
  }
}

/**
 * Sends a code only when the email belongs to an active staff account, or has
 * no row and is a @thrivevineyard.com address (self-signup; the Auth user is
 * created first). Disabled rows get nothing. The result never reveals whether it did: every non-throttled path is
 * 'accepted'. The client-address and global limits are visible (429) and apply
 * identically to every email. The per-email limit is silent (no send, still
 * 'accepted'). If the shared limiter is unhealthy at any step the result is
 * 'unavailable' and nothing is sent; that depends only on limiter health, never
 * on whether the email is a staff member. The roster lookup and send run in
 * `deps.defer`, after the answer is decided.
 */
export async function requestStaffCode(rawEmail: unknown, deps: RequestCodeDeps): Promise<RequestCodeResult> {
  const finish = padToMinimum(deps)
  const limiter = deps.limiter ?? defaultLimiter

  const ipResult = await limiter(codeRequestRules.ip, normalizeIpSubject(deps.clientKey))
  const visible = ipResult.allowed ? await limiter(codeRequestRules.global, GLOBAL_SUBJECT) : ipResult
  if (!visible.allowed) {
    if (visible.reason === 'limited') {
      return finish({ status: 'rate_limited', retryAfterSeconds: visible.retryAfterSeconds })
    }
    return finish({ status: 'unavailable' })
  }

  const email = normalizeEmail(rawEmail)
  const { store, otp } = deps
  if (!email || !store || !otp) return finish({ status: 'accepted' })
  const emailResult = await limiter(codeRequestRules.email, email)
  if (!emailResult.allowed) {
    return finish(emailResult.reason === 'limited' ? { status: 'accepted' } : { status: 'unavailable' })
  }

  const send = async () => {
    try {
      const row = await store.findByEmail(email)
      if (isActive(row)) {
        await otp.requestCode(email)
      } else if (!row && isStaffSignupEmail(email)) {
        await store.ensureAuthUser(email)
        await otp.requestCode(email)
      }
    } catch {
      // The caller still sees success; only a fixed code is logged.
      (deps.log ?? console.error)('[staff-code] send_failed')
    }
  }
  if (deps.defer) deps.defer(send)
  else await send()
  return finish({ status: 'accepted' })
}

// ---------------------------------------------------------------------------
// Verify a code
// ---------------------------------------------------------------------------

export interface VerifyCodeDeps extends TimingDeps {
  store: StaffStore | null
  otp: OtpAuth | null
  limiter?: SubjectLimiter
  clientKey: string
}

/**
 * Verifies the emailed code and returns the active actor, or null for every
 * failure. A new @thrivevineyard.com address with no row gets an active
 * 'staff'-role row on its first verified code. Failures: off-domain unknown or disabled staff, wrong, expired, or replayed code, Auth user
 * that is not the bound one, throttling, limiter failure, or any error).
 * Unknown and disabled emails skip the Supabase call, so every result is
 * padded to `deps.minDurationMs`.
 */
export async function verifyStaffCode(
  rawEmail: unknown,
  rawCode: unknown,
  deps: VerifyCodeDeps,
): Promise<StaffActor | null> {
  const finish = padToMinimum(deps)
  return finish(await verifyUnpadded(rawEmail, rawCode, deps))
}

async function verifyUnpadded(rawEmail: unknown, rawCode: unknown, deps: VerifyCodeDeps): Promise<StaffActor | null> {
  const limiter = deps.limiter ?? defaultLimiter
  const email = normalizeEmail(rawEmail)
  const code = normalizeCode(rawCode)
  if (!email || !code || !deps.store || !deps.otp) return null
  if (!(await limiter(codeVerifyRules.ip, normalizeIpSubject(deps.clientKey))).allowed) return null
  if (!(await limiter(codeVerifyRules.email, email)).allowed) return null

  try {
    const row = await deps.store.findByEmail(email)
    if (isActive(row)) {
      const authUserId = await deps.otp.verifyCode(email, code)
      if (!authUserId || authUserId.toLowerCase() !== row.auth_user_id.toLowerCase()) return null
      return toActor(row)
    }
    // Disabled rows never sign up again; off-domain emails are never created.
    if (row || !isStaffSignupEmail(email)) return null
    const authUserId = await deps.otp.verifyCode(email, code)
    if (!authUserId) return null
    const created = await deps.store.createStaff(email, authUserId)
    if (!isActive(created) || created.auth_user_id.toLowerCase() !== authUserId.toLowerCase()) return null
    return toActor(created)
  } catch {
    (deps.log ?? console.error)('[staff-code] verify_error')
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
  const columns = 'actor_id, email, auth_user_id, status, auth_version, role'
  const one = async (column: string, value: string): Promise<StaffAccountRow | null> => {
    // kind = 'staff' only: system actor rows (seed, agents, jobs) publish but can never hold a session.
    const { data, error } = await db.from('admin_staff_accounts').select(columns).eq('kind', 'staff').eq(column, value).maybeSingle()
    if (error) throw new Error('staff lookup failed')
    return (data as StaffAccountRow | null) ?? null
  }
  return {
    findByEmail: email => one('email', email),
    findByActorId: actorId => one('actor_id', actorId),
    async ensureAuthUser(email) {
      const { error } = await db.auth.admin.createUser({ email, email_confirm: true })
      // An existing Auth user is fine: the code goes to the same address.
      if (error && error.code !== 'email_exists' && error.status !== 422) throw new Error('auth user create failed')
    },
    async createStaff(email, authUserId) {
      // kind and role take their defaults ('staff'); status defaults to 'active'.
      const { data, error } = await db.from('admin_staff_accounts')
        .insert({ email, auth_user_id: authUserId }).select(columns).single()
      if (!error) return data as StaffAccountRow
      // 23505: the email (concurrent sign-in) or auth user is already bound. Re-read by email.
      if (error.code === '23505') return one('email', email)
      throw new Error('staff create failed')
    },
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
