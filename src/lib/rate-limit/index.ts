import { createHmac } from 'node:crypto'
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
