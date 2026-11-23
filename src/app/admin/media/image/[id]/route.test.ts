import { beforeEach, describe, expect, it, vi } from 'vitest'

const { actor, preview } = vi.hoisted(() => ({ actor: vi.fn(), preview: vi.fn() }))
vi.mock('@/lib/admin-auth', () => ({ getStaffActor: actor }))
vi.mock('@/lib/media/catalog', () => ({ readMediaPreview: preview }))
import { GET } from './route'

const context = { params: Promise.resolve({ id: 'a'.repeat(24) }) }
beforeEach(() => { vi.resetAllMocks() })

describe('private media previews', () => {
  it('denies inactive/missing staff before any file lookup', async () => {
    actor.mockResolvedValue(null)
    const response = await GET(new Request('https://example.test/admin/media/image/a'), context)
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(preview).not.toHaveBeenCalled()
  })
  it('does not accept a filesystem path as a variant', async () => {
    actor.mockResolvedValue({ actorId: 'staff' })
    const response = await GET(new Request('https://example.test/admin/media/image/a?size=../../secret'), context)
    expect(response.status).toBe(400)
    expect(preview).not.toHaveBeenCalled()
  })
  it('returns 404 for a missing catalog image', async () => {
    actor.mockResolvedValue({ actorId: 'staff' }); preview.mockResolvedValue(null)
    expect((await GET(new Request('https://example.test/admin/media/image/a'), context)).status).toBe(404)
  })
  it('serves only private, non-cacheable WebP bytes after membership checks', async () => {
    actor.mockResolvedValue({ actorId: 'staff' }); preview.mockResolvedValue(new Uint8Array([82, 73, 70, 70]))
    const response = await GET(new Request('https://example.test/admin/media/image/a?size=thumbnail'), context)
    expect(preview).toHaveBeenCalledWith('a'.repeat(24), 'thumbnail')
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([82, 73, 70, 70]))
  })
})
