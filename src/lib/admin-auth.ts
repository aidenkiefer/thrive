import type { NextAuthOptions } from 'next-auth'
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
