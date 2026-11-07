import { getToken } from 'next-auth/jwt'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Admin gate: /admin/** (except /admin/login) needs a NextAuth session token.
 * Server pages and actions re-check the session with requireAdmin()
 * (src/lib/admin-auth.ts); this is the first layer, not the only one.
 *
 * No Supabase session refresh here: the site doesn't use Supabase Auth
 * (admin uses NextAuth; public pages read with the anon key), so there are no
 * Supabase auth cookies to refresh. Importing @supabase/ssr here also pulled
 * supabase-js into the Edge bundle and caused the process.version warning.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/admin/login'

  if (!isLoginPage) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // '/admin/:path*' also matches '/admin' itself.
  matcher: ['/admin/:path*'],
}
