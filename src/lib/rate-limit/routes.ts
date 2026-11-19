/**
 * Every API route and how it is protected from abuse (#48). routes.test.ts
 * fails when a `src/app/api/**\/route.ts` file is missing here, when an entry
 * has no route file, or when a `limited` route stops reaching the shared
 * Postgres limiter. A new route ships only with a line here.
 *
 * `chain` is the import path from the route file to the module that calls
 * createSubjectLimiter() with the listed purposes; each file imports the next.
 */
export type RouteProtection =
  | { class: 'limited'; purposes: readonly string[]; chain: readonly string[]; note?: string }
  | { class: 'exempt'; reason: string }

/**
 * NextAuth (v4) serves several endpoints from one handler. Only the credentials
 * sign-in does work an attacker would repeat, and it is limited by us:
 *
 * - POST /api/auth/callback/staff-code: `authorize` calls verifyStaffCode, which
 *   takes `otp.verify.ip` and `otp.verify.email` before checking the code. A
 *   denied or unhealthy limiter returns null, so NextAuth answers with its
 *   normal sign-in failure (fail closed; no session is issued).
 * - NextAuth's own protection: a CSRF token is required on sign-in and sign-out
 *   POSTs. NextAuth has no rate limiting of its own.
 * - Not limited by us: GET session, csrf, providers and the sign-in/sign-out
 *   pages. They read a cookie or render a page and send nothing; they are left
 *   to the hosting platform's general traffic protection.
 * - Sending a code is step 1 at /api/admin-login/request-code (below). Supabase
 *   Auth also applies its project-level email and verify limits (dashboard
 *   settings, not in this repo).
 */
const NEXTAUTH_NOTE = 'Credentials sign-in is limited via authorize(); other NextAuth endpoints are cheap reads, CSRF-protected POSTs or pages (see the comment above NEXTAUTH_NOTE in src/lib/rate-limit/routes.ts).'

export const API_ROUTES: Record<string, RouteProtection> = {
  'api/admin-login/request-code': {
    class: 'limited',
    purposes: ['otp.request.ip', 'otp.request.global', 'otp.request.email'],
    chain: ['src/app/api/admin-login/request-code/route.ts', 'src/lib/admin-identities.ts'],
  },
  'api/auth/[...nextauth]': {
    class: 'limited',
    purposes: ['otp.verify.ip', 'otp.verify.email'],
    chain: ['src/app/api/auth/[...nextauth]/route.ts', 'src/lib/admin-auth.ts', 'src/lib/admin-identities.ts'],
    note: NEXTAUTH_NOTE,
  },
  'api/forms/[formId]': {
    class: 'limited',
    purposes: ['form.submit'],
    chain: ['src/app/api/forms/[formId]/route.ts'],
  },
}
