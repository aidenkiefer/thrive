import type { FormEnv } from './types'

const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value)
}

export const DEFAULT_RECIPIENT_KEY = 'FORMS_DEFAULT_RECIPIENT'

/**
 * Resolve recipients on the server. One global default inbox
 * (FORMS_DEFAULT_RECIPIENT) is required for every native form and comes only
 * from configuration (nothing is hardcoded); a form may add extras from its
 * own comma-list env key. Returns null when the default is missing or
 * malformed, or when any extra is malformed, so a misconfiguration is
 * "unavailable" rather than a silent partial delivery. Deduplicates
 * case-insensitively, default first.
 */
export function resolveRecipients(env: FormEnv, extraKey?: string): string[] | null {
  const primary = env[DEFAULT_RECIPIENT_KEY]?.trim()
  if (!primary || !isEmail(primary)) return null
  const extras = (extraKey ? env[extraKey] ?? '' : '').split(',').map(s => s.trim()).filter(Boolean)
  if (extras.some(e => !isEmail(e))) return null
  const seen = new Set<string>()
  const out: string[] = []
  for (const address of [primary, ...extras]) {
    const key = address.toLowerCase()
    if (!seen.has(key)) { seen.add(key); out.push(address) }
  }
  return out
}

/**
 * A form with its own inbox: exactly one address from that form's server-only
 * env key, and nothing else (no global default, no extras). Null when the key
 * is missing, malformed, or holds more than one address, so the form reports
 * "unavailable" instead of delivering somewhere else.
 */
export function resolveOwnRecipient(env: FormEnv, key: string): string[] | null {
  const address = env[key]?.trim()
  return address && isEmail(address) ? [address] : null
}
