import { getServerSession, type NextAuthOptions } from 'next-auth'
import { redirect } from 'next/navigation'
import CredentialsProvider from 'next-auth/providers/credentials'
import { can, type Permission, type StaffRole } from './admin-permissions'
import {
  SESSION_MAX_AGE_SECONDS, clientKeyFrom, createOtpAuth, createStaffStore, parseSessionIdentity,
  resolveActor, verifyStaffCode, type SessionIdentity, type StaffActor,
} from './admin-identities'

/** Pads every verification so unknown or disabled emails (no Supabase call) take similar time. */
const VERIFY_MIN_DURATION_MS = 700

/**
 * Staff sign-in is a one-time email code (Supabase Auth OTP). Rostered staff
 * of any domain, plus self-signup for new @thrivevineyard.com addresses
 * (see admin-identities.ts). There is no shared-password or OIDC path. The JWT carries only
 * {actorId, authUserId, authVersion}; no Supabase tokens and no email.
 */
export const adminAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'staff-code',
      name: 'Email code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!process.env.NEXTAUTH_SECRET) return null
        const actor = await verifyStaffCode(credentials?.email, credentials?.code, {
          store: createStaffStore(),
          otp: createOtpAuth(),
          clientKey: clientKeyFrom(req?.headers),
          minDurationMs: VERIFY_MIN_DURATION_MS,
        })
        if (!actor) return null
        // No email/name here, so NextAuth cannot copy them into the JWT.
        return { id: actor.actorId, actorId: actor.actorId, authUserId: actor.authUserId, authVersion: actor.authVersion }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000)
      if (user) {
        // Sign-in: rebuild the token from scratch with only the identity claims.
        const identity = parseSessionIdentity(user)
        return identity ? { ...identity, signedInAt: now } : {}
      }
      // NextAuth re-issues the cookie on use, so maxAge alone would slide.
      // Cap the session at SESSION_MAX_AGE_SECONDS from sign-in instead.
      const signedInAt = token.signedInAt
      if (typeof signedInAt !== 'number' || now - signedInAt >= SESSION_MAX_AGE_SECONDS) return {}
      return token
    },
    async session({ session, token }) {
      const identity = parseSessionIdentity(token)
      return { expires: session.expires, ...(identity ? { identity } : {}) } as typeof session
    },
  },
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
}

/**
 * A1: resolve the current request to an active staff actor, or null.
 * Rechecks the membership row (active, same auth user, same auth version) on
 * every call; the cookie alone is never trusted. API routes return 401 on null.
 */
export async function getStaffActor(): Promise<StaffActor | null> {
  if (!process.env.NEXTAUTH_SECRET) return null
  const session = await getServerSession(adminAuthOptions)
  const claims = (session as unknown as { identity?: SessionIdentity } | null)?.identity
  return resolveActor(claims, createStaffStore())
}

/** Server Components and Server Actions: redirects to login unless an active actor. */
export async function requireStaffActor(): Promise<StaffActor> {
  const actor = await getStaffActor()
  if (!actor) redirect('/admin/login')
  return actor
}

/**
 * Guard used by every admin page, action and adminDb(). Same fail-closed rules
 * as requireStaffActor; also returns the durable actorId for attribution.
 * Sessions from the old shared login carry no identity and must sign in again.
 */
export async function requireAdmin(): Promise<{ email: string; actorId: string; role: StaffRole }> {
  const actor = await requireStaffActor()
  return { email: actor.email, actorId: actor.actorId, role: actor.role }
}

/** Thrown by requirePermission for an active actor whose role lacks the permission. */
export class PermissionDeniedError extends Error {
  constructor(readonly permission: Permission) {
    super(`permission denied: ${permission}`)
    this.name = 'PermissionDeniedError'
  }
}

/**
 * Guard for actions that need more than content editing, starting with staff
 * account control ('staff_accounts.manage', admin-only). Redirects to login
 * without an active actor; throws PermissionDeniedError when the role lacks the
 * permission. The role is re-read from the membership row on every call.
 */
export async function requirePermission(permission: Permission): Promise<StaffActor> {
  const actor = await requireStaffActor()
  if (!can(actor.role, permission)) throw new PermissionDeniedError(permission)
  return actor
}
