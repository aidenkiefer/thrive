import { createHmac } from 'node:crypto'
import { isIPv4, isIPv6 } from 'node:net'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * D1L shared abuse limiter. Server-only: never import from client components.
 *
 * Counts live in Postgres (`take_rate_limit`, service-role only) so every
 * serverless instance shares one fixed window per (purpose, window, subject).
 * Only an HMAC of the subject is sent or stored, never the raw value. Every
 * failure (bad input, missing config, DB error, timeout, malformed reply)
 * denies. Nothing here logs.
 *
 * Each purpose has exactly one limit and window: the limit is not part of the
 * bucket key, so two call sites sharing a purpose share one counter.
 * TODO(ops): add `import 'server-only'` once that package is a dependency.
 */

export type RateLimitEnv = Record<string, string | undefined>

export interface SharedRateLimitInput {
  purpose: string
  subjectHash: string
  limit: number
  windowSeconds: number
}

export interface SharedRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
  reason: 'ok' | 'limited' | 'unavailable'
}

/** The single atomic operation. Implementations must be shared by all instances. */
export interface RateLimitStore {
  take(input: SharedRateLimitInput): Promise<{ allowed: boolean; retryAfterSeconds: number }>
}

export const LIMITER_SECRET_ENV = 'RATE_LIMIT_HASH_SECRET'
export const UNAVAILABLE_RETRY_SECONDS = 60
const MIN_SECRET_LENGTH = 32

const PURPOSE_RE = /^[a-z][a-z0-9_.-]{0,63}$/
const HASH_RE = /^[0-9a-f]{64}$/
const unavailable = (): SharedRateLimitResult => ({ allowed: false, retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS, reason: 'unavailable' })

const intIn = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

/** Same rules as the SQL function. Integers only. */
export function isValidRateLimitInput(input: unknown): input is SharedRateLimitInput {
  if (!input || typeof input !== 'object') return false
  const i = input as Record<string, unknown>
  return typeof i.purpose === 'string' && PURPOSE_RE.test(i.purpose)
    && typeof i.subjectHash === 'string' && HASH_RE.test(i.subjectHash)
    && intIn(i.limit, 1, 100000) && intIn(i.windowSeconds, 1, 86400)
}

/** Dedicated secret only (no fallback to other secrets). Short or missing means unconfigured. */
export function limiterSecret(env: RateLimitEnv = process.env): string | null {
  const secret = env[LIMITER_SECRET_ENV]?.trim()
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null
}

/** Keyed hash of an already-normalized subject, domain-separated by purpose. */
export function hashLimiterSubject(purpose: string, subject: string, secret: string): string {
  if (!PURPOSE_RE.test(purpose)) throw new Error('invalid limiter purpose')
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) throw new Error('missing limiter secret')
  return createHmac('sha256', secret).update(`thrive-limiter:v1\u0000${purpose}\u0000${subject}`).digest('hex')
}

/** Parse the first row of an RPC reply; throws on any off-shape value. */
function parseRow(data: unknown): { allowed: boolean; retryAfterSeconds: number } {
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null | undefined
  const retry = row?.retry_after_seconds
  if (!row || typeof row.allowed !== 'boolean' || typeof retry !== 'number' || !Number.isInteger(retry) || retry < 0) {
    throw new Error('rate limit store failed')
  }
  return { allowed: row.allowed, retryAfterSeconds: retry }
}

/** Service-role Supabase store, or null when not configured. */
export function createSupabaseRateLimitStore(env: RateLimitEnv = process.env, timeoutMs = 2000): RateLimitStore | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  const db: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return {
    async take(input) {
      const { data, error } = await db.rpc('take_rate_limit', {
        p_purpose: input.purpose,
        p_subject_hash: input.subjectHash,
        p_limit: input.limit,
        p_window_seconds: input.windowSeconds,
      }).abortSignal(AbortSignal.timeout(timeoutMs))
      if (error) throw new Error('rate limit store failed')
      return parseRow(data)
    },
  }
}

/** Only a configured store is cached, so a late-provisioned env is picked up. */
let cachedStore: RateLimitStore | null = null

/** Count one hit. Never throws, never logs. `deps.store: null` means unconfigured. */
export async function takeSharedRateLimit(
  input: SharedRateLimitInput,
  deps: { store?: RateLimitStore | null } = {},
): Promise<SharedRateLimitResult> {
  try {
    if (!isValidRateLimitInput(input)) return unavailable()
    let store: RateLimitStore | null
    if ('store' in deps) store = deps.store ?? null
    else store = cachedStore ??= createSupabaseRateLimitStore()
    if (!store) return unavailable()
    const r = await store.take({ ...input })
    if (!r || typeof r.allowed !== 'boolean' || typeof r.retryAfterSeconds !== 'number'
      || !Number.isInteger(r.retryAfterSeconds) || r.retryAfterSeconds < 0
      || (!r.allowed && r.retryAfterSeconds < 1)) return unavailable()
    if (r.allowed) return { allowed: true, retryAfterSeconds: 0, reason: 'ok' }
    return { allowed: false, retryAfterSeconds: Math.min(r.retryAfterSeconds, input.windowSeconds), reason: 'limited' }
  } catch {
    return unavailable()
  }
}

// ---------------------------------------------------------------------------
// Caller-facing helpers: rules, subject normalization, keyed hashing
// ---------------------------------------------------------------------------

/** One limit and window per purpose (see top note). */
export interface LimitRule {
  purpose: string
  limit: number
  windowSeconds: number
}

/** Hashes an already-normalized subject under the rule's purpose, then takes one hit. */
export type SubjectLimiter = (rule: LimitRule, subject: string) => Promise<SharedRateLimitResult>

/**
 * Production default reads RATE_LIMIT_HASH_SECRET and the Supabase store from
 * env. Tests inject `secret` and `store` (a present key wins, even if null).
 * A missing secret or empty subject denies.
 */
export function createSubjectLimiter(deps: { secret?: string | null; store?: RateLimitStore | null } = {}): SubjectLimiter {
  return async (rule, subject) => {
    try {
      const secret = 'secret' in deps ? deps.secret ?? null : limiterSecret()
      if (!secret || typeof subject !== 'string' || !subject) return unavailable()
      const subjectHash = hashLimiterSubject(rule.purpose, subject, secret)
      return await takeSharedRateLimit({ ...rule, subjectHash }, 'store' in deps ? { store: deps.store } : {})
    } catch {
      return unavailable()
    }
  }
}

const IPV4_TAIL_RE = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

/** Our own /64 output, so normalizing twice is a no-op. */
const PREFIX64_RE = /^(?:[0-9a-f]{1,4}:){4}:\/64$/

/** The first four hextets of a valid IPv6 address as a /64 prefix, or dotted IPv4 for any mapped form. */
function ipv6Prefix64(ip: string): string {
  let s = ip
  const tail = s.match(IPV4_TAIL_RE)
  if (tail) {
    const [a, b, c, d] = tail.slice(1).map(Number)
    s = `${s.slice(0, -tail[0].length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const [head, rest] = s.split('::')
  const h = head ? head.split(':') : []
  const t = rest ? rest.split(':') : []
  const groups = (rest === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill('0'), ...t])
    .map(g => parseInt(g, 16))
  if (groups.slice(0, 5).every(g => g === 0) && groups[5] === 0xffff) {
    return [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255].join('.')
  }
  return `${groups.slice(0, 4).map(g => g.toString(16)).join(':')}::/64`
}

/**
 * Canonical client-address subject: trimmed, lowercased, port and brackets
 * dropped, IPv4-mapped IPv6 unwrapped, and IPv6 grouped by /64 (one end
 * site usually owns a whole /64). Idempotent. Anything else is the shared
 * 'unknown' bucket. Trusts the first x-forwarded-for hop, which Vercel sets;
 * revisit if hosted behind a proxy that passes client-supplied values through.
 */
export function normalizeIpSubject(raw: unknown): string {
  if (typeof raw !== 'string') return 'unknown'
  let ip = raw.trim().toLowerCase()
  if (ip === 'unknown' || PREFIX64_RE.test(ip)) return ip
  const bracketed = ip.match(/^\[([^\]]+)\](?::\d+)?$/)
  if (bracketed) ip = bracketed[1]
  else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(':'))
  ip = ip.split('%')[0]
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) ip = mapped[1]
  if (isIPv4(ip)) return ip
  if (isIPv6(ip)) return ipv6Prefix64(ip)
  return 'unknown'
}
