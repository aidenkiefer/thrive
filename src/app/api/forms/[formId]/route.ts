import { NextResponse, type NextRequest } from 'next/server'
import { getForm } from '../../../../lib/forms/registry'
import { submitWebsiteForm } from '../../../../lib/forms/submit'
import { readLimitedText } from '../../../../lib/http/limited-body'
import { clientKeyFrom, createSubjectLimiter, type LimitRule } from '../../../../lib/rate-limit'

const MAX_BODY_BYTES = 16_000

/** Counts are shared across serverless instances in Postgres (D1L). Any limiter failure denies (fail closed). */
const limiter = createSubjectLimiter()
const FORM_SUBMIT: LimitRule = { purpose: 'form.submit', limit: 5, windowSeconds: 600 }

const noStore = { 'Cache-Control': 'no-store' }

export async function POST(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  const form = getForm(formId)
  if (!form) return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Unknown form.' } }, { status: 404 })

  // A body that fails mid-read is treated like malformed JSON below.
  const raw = await readLimitedText(request, MAX_BODY_BYTES).catch(() => '')
  if (raw === null) return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Request too large.' } }, { status: 413 })

  let body: unknown
  try { body = JSON.parse(raw) } catch { body = null }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ status: 'invalid', fieldErrors: { form: 'Send the form fields as a JSON object.' } }, { status: 400 })
  }
  const fields = body as Record<string, unknown>

  // Honeypot: a hidden "website" field that people leave empty. Pretend success to bots.
  if (typeof fields.website === 'string' && fields.website.trim()) return NextResponse.json({ status: 'sent' })

  // Validate before counting: fixing a field must not spend the visitor's budget,
  // and invalid input is a 422 even while the limiter is down.
  const checked = form.validate(fields)
  if (!checked.ok) {
    return NextResponse.json({ status: 'invalid', fieldErrors: checked.fieldErrors }, { status: 422, headers: noStore })
  }

  const limit = await limiter(FORM_SUBMIT, `${formId}\u0000${clientKeyFrom(request.headers)}`)
  if (!limit.allowed) {
    const limited = limit.reason === 'limited'
    return NextResponse.json({ status: 'unavailable' }, {
      status: limited ? 429 : 503,
      headers: { 'Retry-After': limited ? String(limit.retryAfterSeconds) : '60', ...noStore },
    })
  }

  const result = await submitWebsiteForm(formId, fields)
  const status = result.status === 'sent' ? 200 : result.status === 'invalid' ? 422 : 503
  return NextResponse.json(result, { status, headers: noStore })
}
