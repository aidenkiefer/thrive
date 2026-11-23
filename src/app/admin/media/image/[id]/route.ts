import { getStaffActor } from '@/lib/admin-auth'
import { readMediaPreview } from '@/lib/media/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getStaffActor()) return new Response(null, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const variant = new URL(request.url).searchParams.get('size') ?? 'preview'
  if (variant !== 'thumbnail' && variant !== 'preview') return new Response(null, { status: 400 })
  const bytes = await readMediaPreview((await params).id, variant)
  if (!bytes) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  return new Response(bytes, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
