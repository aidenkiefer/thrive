import { NextResponse, type NextRequest } from 'next/server'
import { getForm } from '../../../../lib/forms/registry'
import { submitWebsiteForm } from '../../../../lib/forms/submit'
import { createSubjectLimiter, normalizeIpSubject, type LimitRule } from '../../../../lib/rate-limit'

const MAX_BODY_BYTES = 16_000

/** Counts are shared across serverless instances in Postgres (D1L). Any limiter failure denies (fail closed). */
const limiter = createSubjectLimiter()
const FORM_SUBMIT: LimitRule = { purpose: 'form.submit', limit: 5, windowSeconds: 600 }

export async function POST(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  if (!getForm(formId)) return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Unknown form.' } }, { status: 404 })

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Request too large.' } }, { status: 413 })
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Request too large.' } }, { status: 413 })

  let body: unknown
  try { body = JSON.parse(raw) } catch { body = null }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Send the form fields as a JSON object.' } }, { status: 400 })
  }
  const fields = body as Record<string, unknown>

  // Honeypot: a hidden "website" field that people leave empty. Pretend success to bots.
  if (typeof fields.website === 'string' && fields.website.trim()) return NextResponse.json({ status: 'sent' })

  const hop = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip')
  const limit = await limiter(FORM_SUBMIT, `${formId}\u0000${normalizeIpSubject(hop)}`)
  if (!limit.allowed) {
    const limited = limit.reason === 'limited'
    return NextResponse.json({ status: 'unavailable' }, {
      status: limited ? 429 : 503,
      headers: { 'Retry-After': limited ? String(limit.retryAfterSeconds) : '60', 'Cache-Control': 'no-store' },
    })
  }

  const result = await submitWebsiteForm(formId, fields)
  const status = result.status === 'sent' ? 200 : result.status === 'invalid' ? 422 : 503
  return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } })
}
