import { isValidRateLimitInput, type RateLimitStore } from './index'

/**
 * Test double for unit tests and local reasoning only. Emulates the SQL
 * `take_rate_limit` fixed-window semantics in memory. Not shared across
 * serverless instances: never wire it in production.
 */
export function createFakeRateLimitStore(now: () => number = Date.now): RateLimitStore & { size(): number } {
  const rows = new Map<string, { hits: number; windowEnd: number }>()
  return {
    size: () => rows.size,
    async take(input) {
      if (!isValidRateLimitInput(input)) throw new Error('invalid rate limit input')
      const t = now()
      let swept = 0
      for (const [k, v] of rows) {
        if (swept >= 25) break
        if (v.windowEnd <= t) { rows.delete(k); swept++ }
      }
      const windowMs = input.windowSeconds * 1000
      const windowEnd = (Math.floor(t / windowMs) + 1) * windowMs
      const key = [input.purpose, input.windowSeconds, input.subjectHash].join('\u0000')
      const prev = rows.get(key)
      const hits = prev && prev.windowEnd === windowEnd ? Math.min(prev.hits + 1, input.limit + 1) : 1
      rows.set(key, { hits, windowEnd })
      const allowed = hits <= input.limit
      return { allowed, retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((windowEnd - t) / 1000)) }
    },
  }
}
