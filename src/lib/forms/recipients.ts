import type { FormEnv } from './types'

const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value)
}

/**
 * Resolve recipients on the server. The default inbox is required and comes
 * only from configuration (nothing is hardcoded); extras are optional.
 * Returns null when the default is missing or malformed, or when any extra
 * is malformed, so a misconfiguration is "unavailable" rather than a silent
 * partial delivery. Deduplicates case-insensitively, default first.
 */
export function resolveRecipients(envPrefix: string, env: FormEnv): string[] | null {
  const primary = env[`${envPrefix}_RECIPIENT`]?.trim()
  if (!primary || !isEmail(primary)) return null
  const extras = (env[`${envPrefix}_EXTRA_RECIPIENTS`] ?? '').split(',').map(s => s.trim()).filter(Boolean)
  if (extras.some(e => !isEmail(e))) return null
  const seen = new Set<string>()
  const out: string[] = []
  for (const address of [primary, ...extras]) {
    const key = address.toLowerCase()
    if (!seen.has(key)) { seen.add(key); out.push(address) }
  }
  return out
}
