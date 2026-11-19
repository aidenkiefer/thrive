import { NextResponse, type NextRequest } from 'next/server'
import { getForm } from '@/lib/forms/registry'
import { submitWebsiteForm } from '@/lib/forms/submit'

const MAX_BODY_BYTES = 16_000
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

/** Best-effort per-instance limiter. Serverless instances do not share it; a platform-level limit is a deployment follow-up. */
function limited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) { hits.set(key, recent); return true }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every(t => now - t >= WINDOW_MS)) hits.delete(k)
  return false
}

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

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (limited(`${formId}:${ip}`)) {
    return NextResponse.json({ status: 'unavailable' }, { status: 429, headers: { 'Retry-After': '600' } })
  }

  const result = await submitWebsiteForm(formId, fields)
  const status = result.status === 'sent' ? 200 : result.status === 'invalid' ? 422 : 503
  return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } })
}
