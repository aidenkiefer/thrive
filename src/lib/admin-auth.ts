import { getServerSession, type NextAuthOptions } from 'next-auth'
import { redirect } from 'next/navigation'
import CredentialsProvider from 'next-auth/providers/credentials'
import { scryptSync, timingSafeEqual } from 'node:crypto'

function validAdmin(email: string, password: string): boolean {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const encoded = process.env.ADMIN_PASSWORD_SCRYPT
  if (!configuredEmail || !encoded || !process.env.NEXTAUTH_SECRET) return false
  const [saltHex, hashHex] = encoded.split(':')
  if (!saltHex || !hashHex || !/^[0-9a-f]{32,}$/i.test(saltHex) || !/^[0-9a-f]{128}$/i.test(hashHex)) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return email.trim().toLowerCase() === configuredEmail && timingSafeEqual(actual, expected)
}

export const adminAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [CredentialsProvider({
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
  })],
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
}

/**
 * Server-side admin check for Server Components and Server Actions.
 * Middleware is not enough: server actions are POST endpoints that write with
 * the service-role key, so each one must verify the session itself.
 * Fails closed: no session, a non-admin email, or missing config redirects to login.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const session = configuredEmail && process.env.NEXTAUTH_SECRET
    ? await getServerSession(adminAuthOptions)
    : null
  const email = session?.user?.email?.trim().toLowerCase()
  if (!configuredEmail || !email || email !== configuredEmail) redirect('/admin/login')
  return { email }
}
