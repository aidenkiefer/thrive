import { getToken } from 'next-auth/jwt'
import { type NextRequest, NextResponse } from 'next/server'
import { mergeResponseCookies, updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)

  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  if (isAdminRoute && !isLoginPage) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      const redirect = NextResponse.redirect(loginUrl)
      return mergeResponseCookies(supabaseResponse, redirect)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Refresh Supabase sessions on all routes except static assets.
     * NextAuth admin protection applies to /admin/* (except login).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
