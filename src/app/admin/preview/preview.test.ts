import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Synthetic fixtures only: no real ministry data.
const { requireAdmin, createClient, query } = vi.hoisted(() => {
  const query = {
    table: '', columns: '', filter: [] as unknown[],
    result: { data: null as unknown, error: null as { message: string } | null },
  }
  const createClient = vi.fn(() => ({
    from(table: string) {
      query.table = table
      const chain = {
        select(columns: string) { query.columns = columns; return chain },
        eq(...args: unknown[]) { query.filter = args; return chain },
        maybeSingle: async () => query.result,
      }
      return chain
    },
  }))
  return { requireAdmin: vi.fn(), createClient, query }
})

vi.mock('next/navigation', () => ({
  redirect: (to: string) => { throw new Error(`REDIRECT:${to}`) },
  notFound: () => { throw new Error('NOT_FOUND') },
}))
vi.mock('@/lib/admin-auth', () => ({ requireAdmin }))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

import AnnouncementPreviewPage, { metadata as announcementMetadata } from './announcement/[id]/page'
import EventPreviewPage, { metadata as eventMetadata } from './event/[id]/page'
import { announcementVisibilityNotes, eventVisibilityNotes, loadAnnouncementPreview } from './preview-data'

const ID = '00000000-0000-4000-8000-000000000001'
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const html = async (page: Promise<ReactElement>) => renderToStaticMarkup(await page)

const draftAnnouncement = {
  id: ID, title: 'Synthetic Test Announcement', body: 'Synthetic body text.', cta_text: 'Synthetic button',
  cta_url: '/synthetic-path', is_homepage_feature: true, expires_at: null, published_at: null,
}
const draftEvent = {
  id: ID, slug: 'synthetic-test-event', name: 'Synthetic Test Event', description: 'Synthetic event description.',
  category: 'Synthetic', start_datetime: '2099-01-01T18:00:00Z', end_datetime: null, location: 'Synthetic Room',
  venue: null, featured_image_url: null, churchsuite_form_url: null, external_url: null, published_at: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://synthetic.example.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-key'
  requireAdmin.mockResolvedValue({ email: 'staff@example.test', actorId: 'actor', role: 'staff' })
  query.result = { data: null, error: null }
  query.table = ''
})

describe('admin preview access', () => {
  it('redirects an unauthenticated or inactive request to login before any database access', async () => {
    requireAdmin.mockRejectedValue(new Error('REDIRECT:/admin/login'))
    await expect(AnnouncementPreviewPage(params(ID))).rejects.toThrow('REDIRECT:/admin/login')
    await expect(EventPreviewPage(params(ID))).rejects.toThrow('REDIRECT:/admin/login')
    expect(createClient).not.toHaveBeenCalled()
  })

  it('checks auth before validating the id, so a bad id reveals nothing to signed-out users', async () => {
    requireAdmin.mockRejectedValue(new Error('REDIRECT:/admin/login'))
    await expect(loadAnnouncementPreview('not-a-uuid')).rejects.toThrow('REDIRECT:/admin/login')
  })

  it('is never indexed', () => {
    expect(announcementMetadata.robots).toEqual({ index: false, follow: false })
    expect(eventMetadata.robots).toEqual({ index: false, follow: false })
  })
})

describe('missing records', () => {
  it('404s a malformed id without querying', async () => {
    await expect(AnnouncementPreviewPage(params('../../etc'))).rejects.toThrow('NOT_FOUND')
    await expect(EventPreviewPage(params('1 or 1=1'))).rejects.toThrow('NOT_FOUND')
    expect(query.table).toBe('')
  })

  it('404s an id with no record', async () => {
    await expect(AnnouncementPreviewPage(params(ID))).rejects.toThrow('NOT_FOUND')
    expect(query.table).toBe('announcements')
    expect(query.filter).toEqual(['id', ID])
    await expect(EventPreviewPage(params(ID))).rejects.toThrow('NOT_FOUND')
    expect(query.table).toBe('one_time_events')
  })

  it('surfaces database errors instead of pretending the record is missing', async () => {
    query.result = { data: null, error: { message: 'synthetic failure' } }
    await expect(AnnouncementPreviewPage(params(ID))).rejects.toThrow('synthetic failure')
  })
})

describe('draft rendering', () => {
  it('renders a draft announcement with the public component inside a not-published banner', async () => {
    query.result = { data: draftAnnouncement, error: null }
    const out = await html(AnnouncementPreviewPage(params(ID)))
    expect(out).toContain('Preview — not published')
    expect(out).toContain('Synthetic Test Announcement')
    expect(out).toContain('Synthetic body text.')
    expect(out).toContain('aria-label="Announcement"') // the public FeaturedAnnouncement section
    expect(out).toContain(`href="/admin/announcements#form-${ID}"`)
    expect(out).not.toContain('View live page')
  })

  it('renders a draft event with the public event detail inside a not-published banner', async () => {
    query.result = { data: draftEvent, error: null }
    const out = await html(EventPreviewPage(params(ID)))
    expect(out).toContain('Preview — not published')
    expect(out).toContain('Synthetic Test Event')
    expect(out).toContain('Synthetic event description.')
    expect(out).toContain('Event details') // the public EventDetail aside
    expect(out).toContain('/events/synthetic-test-event')
    expect(out).toContain(`href="/admin/events#form-${ID}"`)
    expect(out).not.toContain('View live page')
  })

  it('labels a published record and links to the live page', async () => {
    query.result = { data: { ...draftEvent, published_at: '2026-01-01T00:00:00Z' }, error: null }
    const out = await html(EventPreviewPage(params(ID)))
    expect(out).toContain('Preview — this is published')
    expect(out).toContain('href="/events/synthetic-test-event"')
    expect(out).toContain('View live page')
  })
})

describe('visibility notes', () => {
  const now = new Date('2030-06-01T00:00:00Z')
  it('explains why an announcement would not reach the homepage', () => {
    expect(announcementVisibilityNotes(draftAnnouncement, now)).toEqual([])
    expect(announcementVisibilityNotes({ ...draftAnnouncement, is_homepage_feature: false }, now)[0]).toMatch(/Feature on homepage/)
    expect(announcementVisibilityNotes({ ...draftAnnouncement, expires_at: '2030-01-01T00:00:00Z' }, now)[0]).toMatch(/expired/)
  })
  it('flags an event that has already started', () => {
    expect(eventVisibilityNotes(draftEvent, now)).toEqual([])
    expect(eventVisibilityNotes({ ...draftEvent, start_datetime: '2030-05-01T00:00:00Z' }, now)[0]).toMatch(/already started/)
  })
})
