import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import Link from 'next/link'

function requiredInstant(value: string, label: string): string {
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value)) throw new Error(`${label} requires a timezone, such as -06:00`)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`)
  return date.toISOString()
}

function optionalUrl(value: string): string | null {
  if (!value) return null
  if (!/^https:\/\//i.test(value)) throw new Error('Event links must use HTTPS')
  return value
}

async function saveEvent(formData: FormData) {
  'use server'
  const db = await adminDb()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const slug = String(formData.get('slug') || '').trim().toLowerCase()
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Name and a valid URL slug are required')
  const start = requiredInstant(String(formData.get('start_datetime') || '').trim(), 'Start')
  const endRaw = String(formData.get('end_datetime') || '').trim()
  const end = endRaw ? requiredInstant(endRaw, 'End') : null
  if (end && end < start) throw new Error('End must follow start')
  let currentPublishedAt: string | null = null
  if (id) {
    const { data, error } = await db.from('one_time_events').select('slug,published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing an event URL requires a redirect plan')
    currentPublishedAt = data.published_at
  } else {
    const { data, error } = await db.from('recurring_events').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('This URL slug belongs to a recurring event')
  }
  const publish = formData.get('published') === 'on'
  const row = {
    slug, name, start_datetime: start, end_datetime: end,
    description: String(formData.get('description') || '').trim() || null,
    short_summary: String(formData.get('short_summary') || '').trim() || null,
    category: String(formData.get('category') || '').trim() || null,
    location: String(formData.get('location') || '').trim() || null,
    venue: String(formData.get('venue') || '').trim() || null,
    featured_image_url: optionalUrl(String(formData.get('featured_image_url') || '').trim()),
    churchsuite_form_url: optionalUrl(String(formData.get('churchsuite_form_url') || '').trim()),
    external_url: optionalUrl(String(formData.get('external_url') || '').trim()),
    published_at: publish ? (currentPublishedAt || new Date().toISOString()) : null,
  }
  const result = id
    ? await db.from('one_time_events').update(row).eq('id', id)
    : await db.from('one_time_events').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${slug}`)
  revalidatePath('/')
}

type EventRow = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  category: string | null; start_datetime: string; end_datetime: string | null;
  location: string | null; venue: string | null; featured_image_url: string | null;
  churchsuite_form_url: string | null; external_url: string | null; published_at: string | null;
}

function EventForm({ item }: { item?: EventRow }) {
  return <form action={saveEvent} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Start (ISO time with offset)<input name="start_datetime" placeholder="2026-12-05T09:00:00-06:00" defaultValue={item?.start_datetime} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">End (ISO time with offset)<input name="end_datetime" defaultValue={item?.end_datetime || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Short summary<input name="short_summary" defaultValue={item?.short_summary || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Category<input name="category" defaultValue={item?.category || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Location<input name="location" defaultValue={item?.location || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Venue<input name="venue" defaultValue={item?.venue || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">ChurchSuite URL<input name="churchsuite_form_url" defaultValue={item?.churchsuite_form_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Other action URL<input name="external_url" defaultValue={item?.external_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save event' : 'Create event'}</button>
  </form>
}

export default async function AdminEventsPage() {
  const db = await adminDb()
  const { data, error } = await db.from('one_time_events').select('*').order('start_datetime', { ascending: false })
  if (error) throw new Error(error.message)
  const items = (data || []) as EventRow[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">One-time events</h1>
    <Link href="/admin/recurring-events" className="inline-block rounded border px-4 py-2">Manage recurring events &amp; schedules</Link>
    <p className="text-sm text-neutral-600">Recurring event schedules are managed through the migration workflow while their rules are reconciled.</p>
    <section><h2 className="mb-3 text-lg font-semibold">New event</h2><EventForm /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing events</h2>
      {items.length === 0 && <p>No one-time events yet.</p>}
      {items.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary>
        <div className="mt-4"><EventForm item={item} /></div>
      </details>)}
    </section>
  </div>
}
