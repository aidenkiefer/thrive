import { createHash } from 'node:crypto'

/**
 * A1 staff actor contract (pure, no framework imports so it is unit-testable).
 *
 * An actor is a verified identity (OIDC issuer + subject) that is on the
 * server-side allowlist. `actorId` is derived from issuer+subject, never from
 * the mutable email, so revision authorship survives email changes.
 * Membership is re-checked against the allowlist on every request, so removing
 * an entry takes effect immediately even for live sessions.
 *
 * Transition: the shared ADMIN_EMAIL/password account resolves to a single
 * `legacy` actor until ADMIN_LEGACY_SHARED_ACCOUNT=disabled is set at cutover.
 */

export const LEGACY_ISSUER = 'legacy-shared-credentials'

export type IdentityEnv = Record<string, string | undefined>

/** What the session carries after sign-in. Not trusted until resolved. */
export interface SessionIdentity {
  issuer: string
  subject: string
  email?: string | null
}

export interface StaffActor {
  actorId: string
  issuer: string
  subject: string
  email: string | null
  /** True for the shared account; callers can refuse it for attributed writes. */
  legacy: boolean
}

export interface AllowlistEntry {
  issuer: string
  subject: string
  email?: string
}

export function actorIdFor(issuer: string, subject: string): string {
  return 'staff_' + createHash('sha256').update(`${issuer}\u0000${subject}`).digest('hex').slice(0, 32)
}

/**
 * ADMIN_STAFF_ALLOWLIST is a JSON array of {issuer, subject, email?}.
 * Anything malformed yields an empty list (fail closed), never a partial one.
 */
export function parseAllowlist(raw: string | undefined): AllowlistEntry[] {
  if (!raw?.trim()) return []
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return [] }
  if (!Array.isArray(parsed)) return []
  const entries: AllowlistEntry[] = []
  for (const item of parsed) {
    if (!item || typeof item !== 'object') return []
    const { issuer, subject, email } = item as Record<string, unknown>
    if (typeof issuer !== 'string' || !issuer.trim() || typeof subject !== 'string' || !subject.trim()) return []
    if (issuer.trim() === LEGACY_ISSUER) return []
    entries.push({
      issuer: issuer.trim(),
      subject: subject.trim(),
      ...(typeof email === 'string' && email.trim() ? { email: email.trim().toLowerCase() } : {}),
    })
  }
  return entries
}

export function legacyAccountEmail(env: IdentityEnv): string | null {
  if (env.ADMIN_LEGACY_SHARED_ACCOUNT?.trim().toLowerCase() === 'disabled') return null
  if (!env.NEXTAUTH_SECRET) return null
  return env.ADMIN_EMAIL?.trim().toLowerCase() || null
}

export function oidcConfig(env: IdentityEnv): { issuer: string; clientId: string; clientSecret: string } | null {
  const issuer = env.ADMIN_OIDC_ISSUER?.trim().replace(/\/+$/, '')
  const clientId = env.ADMIN_OIDC_CLIENT_ID?.trim()
  const clientSecret = env.ADMIN_OIDC_CLIENT_SECRET?.trim()
  if (!issuer || !clientId || !clientSecret || !/^https:\/\//.test(issuer)) return null
  return { issuer, clientId, clientSecret }
}

/** Resolve a session identity to an active actor, or null (fail closed). */
export function resolveActor(identity: SessionIdentity | null | undefined, env: IdentityEnv): StaffActor | null {
  if (!identity || !identity.issuer || !identity.subject) return null
  if (!env.NEXTAUTH_SECRET) return null

  if (identity.issuer === LEGACY_ISSUER) {
    const legacyEmail = legacyAccountEmail(env)
    if (!legacyEmail || identity.subject.trim().toLowerCase() !== legacyEmail) return null
    return { actorId: actorIdFor(LEGACY_ISSUER, legacyEmail), issuer: LEGACY_ISSUER, subject: legacyEmail, email: legacyEmail, legacy: true }
  }

  const match = parseAllowlist(env.ADMIN_STAFF_ALLOWLIST)
    .find(e => e.issuer === identity.issuer && e.subject === identity.subject)
  if (!match) return null
  return {
    actorId: actorIdFor(match.issuer, match.subject),
    issuer: match.issuer,
    subject: match.subject,
    email: identity.email?.trim().toLowerCase() || match.email || null,
    legacy: false,
  }
}
