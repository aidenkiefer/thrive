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
 * denies and logs one line with a fixed code and the purpose
 * (`[rate-limit] unavailable code=<code> purpose=<purpose>`), never the subject.
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

/** Fixed failure codes. The only detail a failure log carries besides the purpose. */
export type RateLimitFailureCode = 'not_configured' | 'invalid_input' | 'rpc_error' | 'timeout'

/** Thrown by a store to name its failure. The message never includes the subject. */
export class RateLimitStoreError extends Error {
  constructor(readonly code: 'rpc_error' | 'timeout') {
    super('rate limit store failed')
  }
}

/** Receives one PII-free line per failure. Defaults to console.error. */
export type RateLimitLog = (line: string) => void

export const LIMITER_SECRET_ENV = 'RATE_LIMIT_HASH_SECRET'
export const UNAVAILABLE_RETRY_SECONDS = 60
const MIN_SECRET_LENGTH = 32

const PURPOSE_RE = /^[a-z][a-z0-9_.-]{0,63}$/
const HASH_RE = /^[0-9a-f]{64}$/

/** Logs the failure (purpose only when well-formed) and returns the deny result. */
function unavailable(code: RateLimitFailureCode, purpose: unknown, log: RateLimitLog = console.error): SharedRateLimitResult {
  const name = typeof purpose === 'string' && PURPOSE_RE.test(purpose) ? purpose : 'invalid'
  try { log(`[rate-limit] unavailable code=${code} purpose=${name}`) } catch { /* logging never changes the result */ }
  return { allowed: false, retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS, reason: 'unavailable' }
}

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
      const signal = AbortSignal.timeout(timeoutMs)
      let reply: { data: unknown; error: unknown }
      try {
        reply = await db.rpc('take_rate_limit', {
          p_purpose: input.purpose,
          p_subject_hash: input.subjectHash,
          p_limit: input.limit,
          p_window_seconds: input.windowSeconds,
        }).abortSignal(signal)
      } catch (e) {
        throw new RateLimitStoreError(signal.aborted || isAbort(e) ? 'timeout' : 'rpc_error')
      }
      // supabase-js reports an aborted fetch as `error`, not a throw.
      if (reply.error) throw new RateLimitStoreError(signal.aborted || isAbort(reply.error) ? 'timeout' : 'rpc_error')
      try {
        return parseRow(reply.data)
      } catch {
        throw new RateLimitStoreError('rpc_error')
      }
    },
  }
}

function isAbort(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const { name, message } = e as { name?: unknown; message?: unknown }
  return name === 'TimeoutError' || name === 'AbortError'
    || (typeof message === 'string' && /^(TimeoutError|AbortError)\b/.test(message))
}

/** Only a configured store is cached, so a late-provisioned env is picked up. */
let cachedStore: RateLimitStore | null = null

/** Count one hit. Never throws; logs one fixed-code line per failure. `deps.store: null` means unconfigured. */
export async function takeSharedRateLimit(
  input: SharedRateLimitInput,
  deps: { store?: RateLimitStore | null; log?: RateLimitLog } = {},
): Promise<SharedRateLimitResult> {
  const purpose = (input as Partial<SharedRateLimitInput> | null)?.purpose
  try {
    if (!isValidRateLimitInput(input)) return unavailable('invalid_input', purpose, deps.log)
    let store: RateLimitStore | null
    if ('store' in deps) store = deps.store ?? null
    else store = cachedStore ??= createSupabaseRateLimitStore()
    if (!store) return unavailable('not_configured', purpose, deps.log)
    const r = await store.take({ ...input })
    if (!r || typeof r.allowed !== 'boolean' || typeof r.retryAfterSeconds !== 'number'
      || !Number.isInteger(r.retryAfterSeconds) || r.retryAfterSeconds < 0
      || (!r.allowed && r.retryAfterSeconds < 1)) return unavailable('rpc_error', purpose, deps.log)
    if (r.allowed) return { allowed: true, retryAfterSeconds: 0, reason: 'ok' }
    return { allowed: false, retryAfterSeconds: Math.min(r.retryAfterSeconds, input.windowSeconds), reason: 'limited' }
  } catch (e) {
    return unavailable(e instanceof RateLimitStoreError ? e.code : 'rpc_error', purpose, deps.log)
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
export function createSubjectLimiter(
  deps: { secret?: string | null; store?: RateLimitStore | null; log?: RateLimitLog } = {},
): SubjectLimiter {
  return async (rule, subject) => {
    try {
      const secret = 'secret' in deps ? deps.secret ?? null : limiterSecret()
      if (!secret) return unavailable('not_configured', rule.purpose, deps.log)
      if (typeof subject !== 'string' || !subject) return unavailable('invalid_input', rule.purpose, deps.log)
      const subjectHash = hashLimiterSubject(rule.purpose, subject, secret)
      return await takeSharedRateLimit({ ...rule, subjectHash }, 'store' in deps ? { store: deps.store, log: deps.log } : { log: deps.log })
    } catch {
      return unavailable('invalid_input', rule?.purpose, deps.log)
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
 * 'unknown' bucket. Callers get the raw value from clientKeyFrom().
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

type HeaderSource = { get(name: string): string | null } | Record<string, unknown> | undefined

/**
 * The one place a client-address subject is derived from request headers
 * (OTP request/verify and native forms all use it). Takes the first
 * x-forwarded-for hop, else x-real-ip, then normalizeIpSubject().
 *
 * Trust: this believes x-forwarded-for. That is safe on Vercel, whose edge
 * overwrites the header with the real client address, so a visitor cannot
 * pick their own bucket. Behind a host or proxy that passes a client-supplied
 * x-forwarded-for through, a visitor could rotate the value to dodge the
 * per-address limits; derive the address from that platform's trusted header
 * instead before moving hosts.
 */
export function clientKeyFrom(headers: HeaderSource): string {
  if (!headers) return normalizeIpSubject(undefined)
  const read = (name: string): string => {
    const value = typeof (headers as { get?: unknown }).get === 'function'
      ? (headers as { get(n: string): string | null }).get(name)
      : (headers as Record<string, unknown>)[name]
    return typeof value === 'string' ? value : ''
  }
  const forwarded = read('x-forwarded-for').split(',')[0]?.trim()
  return normalizeIpSubject(forwarded || read('x-real-ip').trim())
}
