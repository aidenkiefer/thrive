import { getServerSession, type NextAuthOptions } from 'next-auth'
import { redirect } from 'next/navigation'
import CredentialsProvider from 'next-auth/providers/credentials'
import { scryptSync, timingSafeEqual } from 'node:crypto'
import {
  LEGACY_ISSUER, legacyAccountEmail, oidcConfig, resolveActor,
  type SessionIdentity, type StaffActor,
} from '@/lib/admin-identities'

function validAdmin(email: string, password: string): boolean {
  const configuredEmail = legacyAccountEmail(process.env)
  const encoded = process.env.ADMIN_PASSWORD_SCRYPT
  if (!configuredEmail || !encoded || !process.env.NEXTAUTH_SECRET) return false
  const [saltHex, hashHex] = encoded.split(':')
  if (!saltHex || !hashHex || !/^[0-9a-f]{32,}$/i.test(saltHex) || !/^[0-9a-f]{128}$/i.test(hashHex)) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return email.trim().toLowerCase() === configuredEmail && timingSafeEqual(actual, expected)
}

interface OidcProfile { sub: string; email?: string; email_verified?: boolean; name?: string }

/**
 * Individual staff sign-in via a generic OIDC provider. Enabled only when
 * ADMIN_OIDC_ISSUER / _CLIENT_ID / _CLIENT_SECRET are all set; the provider
 * choice (Google Workspace is the candidate) is deployment configuration.
 */
function oidcProviders(): NextAuthOptions['providers'] {
  const config = oidcConfig(process.env)
  if (!config) return []
  return [{
    id: 'staff-oidc',
    name: 'Staff sign-in',
    type: 'oauth',
    wellKnown: `${config.issuer}/.well-known/openid-configuration`,
    authorization: { params: { scope: 'openid email profile' } },
    idToken: true,
    checks: ['pkce', 'state'],
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    profile(profile: OidcProfile) {
      return { id: profile.sub, email: profile.email ?? null, name: profile.name ?? null }
    },
  }]
}

export const adminAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        if (!validAdmin(credentials.email, credentials.password)) return null
        const email = credentials.email.trim().toLowerCase()
        return { id: email, email, name: 'Site editor' }
      },
    }),
    ...oidcProviders(),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== 'staff-oidc') return true
      const config = oidcConfig(process.env)
      const oidc = profile as OidcProfile | undefined
      if (!config || !oidc?.sub || oidc.email_verified !== true) return false
      return resolveActor({ issuer: config.issuer, subject: oidc.sub, email: user.email }, process.env) !== null
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === 'staff-oidc') {
        const config = oidcConfig(process.env)
        const sub = (profile as OidcProfile | undefined)?.sub
        if (config && sub) token.identity = { issuer: config.issuer, subject: sub, email: user?.email ?? null }
      } else if (account?.provider === 'credentials' && user?.email) {
        token.identity = { issuer: LEGACY_ISSUER, subject: user.email.trim().toLowerCase(), email: user.email }
      }
      return token
    },
    async session({ session, token }) {
      ;(session as unknown as { identity?: SessionIdentity }).identity = token.identity as SessionIdentity | undefined
      return session
    },
  },
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
}

/**
 * A1: resolve the current request to an active staff actor, or null.
 * Re-checks the allowlist on every call; never trusts the cookie alone.
 * API routes use this and return 401 on null.
 */
export async function getStaffActor(): Promise<StaffActor | null> {
  if (!process.env.NEXTAUTH_SECRET) return null
  const session = await getServerSession(adminAuthOptions)
  const identity = (session as unknown as { identity?: SessionIdentity } | null)?.identity
  return resolveActor(identity, process.env)
}

/** Server Components and Server Actions: redirects to login unless an active actor. */
export async function requireStaffActor(): Promise<StaffActor> {
  const actor = await getStaffActor()
  if (!actor) redirect('/admin/login')
  return actor
}

/**
 * Existing guard, kept for current callers. Same fail-closed rules as
 * requireStaffActor; the return value now also carries the stable actorId.
 * Sessions issued before this change have no identity and must sign in again.
 */
export async function requireAdmin(): Promise<{ email: string; actorId: string }> {
  const actor = await requireStaffActor()
  return { email: actor.email ?? '', actorId: actor.actorId }
}
