import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/admin-db'

/**
 * Loaders for the admin draft previews. adminDb() re-checks the staff session
 * (redirecting to /admin/login without an active actor) before anything is read,
 * so an unauthenticated request never reaches the database or learns whether an
 * id exists. Drafts and published records load alike: that is the point of a preview.
 */

const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type AnnouncementPreview = {
  id: string; title: string; body: string | null; cta_text: string | null; cta_url: string | null;
  is_homepage_feature: boolean; expires_at: string | null; published_at: string | null;
}

export type EventPreview = {
  id: string; slug: string; name: string; description: string | null; category: string | null;
  start_datetime: string; end_datetime: string | null; location: string | null; venue: string | null;
  featured_image_url: string | null; churchsuite_form_url: string | null; external_url: string | null;
  published_at: string | null;
}

async function loadById<T>(table: string, columns: string, id: string): Promise<T> {
  const db = await adminDb()
  // A malformed id would be a Postgres cast error; treat it as "no such record".
  if (!RECORD_ID.test(id)) notFound()
  const { data, error } = await db.from(table).select(columns).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  return data as T
}

export function loadAnnouncementPreview(id: string): Promise<AnnouncementPreview> {
  return loadById('announcements', 'id,title,body,cta_text,cta_url,is_homepage_feature,expires_at,published_at', id)
}

export function loadEventPreview(id: string): Promise<EventPreview> {
  return loadById(
    'one_time_events',
    'id,slug,name,description,category,start_datetime,end_datetime,location,venue,featured_image_url,churchsuite_form_url,external_url,published_at',
    id,
  )
}

/** Why a published announcement would still not appear on the homepage, if anything. */
export function announcementVisibilityNotes(item: AnnouncementPreview, now: Date): string[] {
  const notes: string[] = []
  if (!item.is_homepage_feature) notes.push('"Feature on homepage" is off, so this announcement will not appear on the homepage even when published.')
  if (item.expires_at && new Date(item.expires_at) <= now) notes.push('This announcement has expired, so the homepage no longer shows it.')
  return notes
}

/** Why a published event would be missing from upcoming-event lists, if anything. */
export function eventVisibilityNotes(event: EventPreview, now: Date): string[] {
  // Public upcoming lists filter on start_datetime > now (src/lib/queries/events.ts).
  const started = new Date(event.start_datetime) <= now
  return started ? ['This event has already started, so upcoming-event lists will not show it.'] : []
}
