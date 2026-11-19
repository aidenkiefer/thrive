import { NextResponse } from 'next/server'
import { clientKeyFrom, createOtpAuth, createStaffStore, requestStaffCode } from '@/lib/admin-identities'

/** Pads every response so known and unknown emails take similar time. */
const MIN_DURATION_MS = 700

/**
 * Step 1 of staff sign-in. Always answers the same generic 200 for any email;
 * only a client-address/global throttle (429) differs, and it ignores the email.
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
  if (result.status === 'rate_limited') {
    return NextResponse.json({ status: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '900' } })
  }
  return NextResponse.json({ status: 'accepted' })
}
