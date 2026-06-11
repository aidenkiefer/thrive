import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// TODO: Replace placeholder auth with real implementation.
// Options:
//   A) Credentials provider — validate email/password against a Supabase `admin_users` table
//   B) Google OAuth restricted to @thrivevineyard.com accounts (if Google Workspace is used)
// See: docs/06-integrations.md — NextAuth section

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Validate credentials against Supabase admin_users table
        // Return null on failure, user object on success
        if (!credentials?.email || !credentials?.password) return null
        return null
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
})

export { handler as GET, handler as POST }
