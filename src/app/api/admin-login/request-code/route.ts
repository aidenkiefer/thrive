import { NextResponse } from 'next/server'
import { clientKeyFrom, createOtpAuth, createStaffStore, requestStaffCode } from '../../../../lib/admin-identities'

/** Pads every response so known and unknown emails take similar time. */
const MIN_DURATION_MS = 700

/**
 * Step 1 of staff sign-in. Always answers the same generic 200 for any email.
 * The 429 and 503 depend only on the client address, the global cap, or limiter
 * health, never on the email or on whether it is a staff member.
 */
export async function POST(request: Request) {
  let email: unknown
  try {
    email = ((await request.json()) as { email?: unknown } | null)?.email
  } catch {
    return NextResponse.json({ status: 'invalid' }, { status: 400 })
  }
  const result = await requestStaffCode(email, {
    store: createStaffStore(),
    otp: createOtpAuth(),
    clientKey: clientKeyFrom(request.headers),
    minDurationMs: MIN_DURATION_MS,
  })
  if (result.status === 'unavailable') {
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    )
  }
  if (result.status === 'rate_limited') {
    return NextResponse.json(
      { status: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds), 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json({ status: 'accepted' }, { headers: { 'Cache-Control': 'no-store' } })
}
