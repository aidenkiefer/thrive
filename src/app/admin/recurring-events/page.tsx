import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

function timestamp(form: FormData, key: string, label: string): string {
  const value = String(form.get(key) || '').trim()
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value)) throw new Error(`${label} needs an ISO timezone offset`)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error(`${label} is invalid`)
  return parsed.toISOString()
}

async function saveRecurring(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const slug = String(form.get('slug') || '').trim().toLowerCase()
  const name = String(form.get('name') || '').trim()
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Name and valid URL slug are required')
  let publishedAt: string | null = null
  if (id) {
    const { data, error } = await db.from('recurring_events').select('slug,published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing an event URL requires a redirect plan')
    publishedAt = data.published_at
  } else {
    const { data, error } = await db.from('one_time_events').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('This URL belongs to a one-time event')
  }
  const publish = form.get('published') === 'on'
  const row = {
    slug, name,
    description: String(form.get('description') || '').trim() || null,
    short_summary: String(form.get('short_summary') || '').trim() || null,
    category: String(form.get('category') || '').trim() || null,
    recurrence_description: String(form.get('recurrence_description') || '').trim() || null,
    typical_time: String(form.get('typical_time') || '').trim() || null,
    location: String(form.get('location') || '').trim() || null,
    venue: String(form.get('venue') || '').trim() || null,
    featured_image_url: secureUrl(form.get('featured_image_url')),
    churchsuite_form_url: secureUrl(form.get('churchsuite_form_url')),
    external_url: secureUrl(form.get('external_url')),
    published_at: publish ? (publishedAt || new Date().toISOString()) : null,
  }
  const result = id ? await db.from('recurring_events').update(row).eq('id', id) : await db.from('recurring_events').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/events'); revalidatePath('/events'); revalidatePath(`/events/${slug}`); revalidatePath('/')
}

function secureUrl(value: FormDataEntryValue | null): string | null {
  const url = String(value || '').trim()
  if (!url) return null
  if (!url.startsWith('https://')) throw new Error('Links must use HTTPS')
  return url
}

async function saveOccurrence(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const eventId = String(form.get('recurring_event_id') || '')
  if (!eventId) throw new Error('Choose a recurring event')
  const start = timestamp(form, 'start_datetime', 'Start')
  const endRaw = String(form.get('end_datetime') || '').trim()
  const end = endRaw ? timestamp(form, 'end_datetime', 'End') : null
  if (end && end <= start) throw new Error('End must follow start')
  const row = {
    recurring_event_id: eventId, start_datetime: start, end_datetime: end,
    location: String(form.get('location') || '').trim() || null,
    notes: String(form.get('notes') || '').trim() || null,
    cancelled: form.get('cancelled') === 'on',
  }
  const result = id
    ? await db.from('event_occurrences').update(row).eq('id', id)
    : await db.from('event_occurrences').upsert(row, { onConflict: 'recurring_event_id,start_datetime' })
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/events'); revalidatePath('/events'); revalidatePath('/')
}

type Recurring = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  category: string | null; recurrence_description: string | null; typical_time: string | null;
  location: string | null; venue: string | null; featured_image_url: string | null;
  churchsuite_form_url: string | null; external_url: string | null; published_at: string | null;
}
type Occurrence = {
  id: string; recurring_event_id: string; start_datetime: string; end_datetime: string | null;
  location: string | null; notes: string | null; cancelled: boolean;
}

function RecurringForm({ item }: { item?: Recurring }) {
  return <form action={saveRecurring} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Short summary<input name="short_summary" defaultValue={item?.short_summary || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Category<input name="category" defaultValue={item?.category || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Schedule description<input name="recurrence_description" defaultValue={item?.recurrence_description || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Typical time<input name="typical_time" defaultValue={item?.typical_time || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Location<input name="location" defaultValue={item?.location || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Venue<input name="venue" defaultValue={item?.venue || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">ChurchSuite URL<input name="churchsuite_form_url" defaultValue={item?.churchsuite_form_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Other action URL<input name="external_url" defaultValue={item?.external_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save event' : 'Create event'}</button>
  </form>
}

function OccurrenceForm({ item, events }: { item?: Occurrence; events: Recurring[] }) {
  return <form action={saveOccurrence} className="grid gap-3 rounded border bg-white p-4 md:grid-cols-2">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Recurring event<select name="recurring_event_id" defaultValue={item?.recurring_event_id || ''} required className="mt-1 block w-full rounded border p-2"><option value="">Select event</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
    <label className="block text-sm">Starts (ISO offset)<input name="start_datetime" defaultValue={item?.start_datetime || ''} placeholder="2026-11-15T09:30:00-06:00" required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Ends (optional)<input name="end_datetime" defaultValue={item?.end_datetime || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Location override<input name="location" defaultValue={item?.location || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Notes<input name="notes" defaultValue={item?.notes || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="cancelled" defaultChecked={item?.cancelled} />Cancelled</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save occurrence' : 'Add occurrence'}</button>
  </form>
}

export default async function AdminEventsPage() {
  const db = await adminDb()
  const [eventResult, occurrenceResult] = await Promise.all([
    db.from('recurring_events').select('*').order('name'),
    db.from('event_occurrences').select('*').order('start_datetime', { ascending: true }).limit(250),
  ])
  if (eventResult.error || occurrenceResult.error) throw new Error(eventResult.error?.message || occurrenceResult.error?.message)
  const recurring = (eventResult.data || []) as unknown as Recurring[]
  const occurrences = (occurrenceResult.data || []) as unknown as Occurrence[]
  return <div className="max-w-4xl space-y-8">
    <h1 className="text-2xl font-bold">Recurring events</h1>
    <section><h2 className="mb-3 text-lg font-semibold">Recurring events</h2><RecurringForm />
      <div className="mt-4 space-y-3">{recurring.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><RecurringForm item={item} /></div></details>)}</div>
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Upcoming schedule occurrences</h2><OccurrenceForm events={recurring.filter(e => e.published_at)} />
      <div className="mt-4 space-y-3">{occurrences.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer">{recurring.find(e => e.id === item.recurring_event_id)?.name || 'Event'} — {item.start_datetime}{item.cancelled ? ' (cancelled)' : ''}</summary><div className="mt-4"><OccurrenceForm item={item} events={recurring.filter(e => e.published_at)} /></div></details>)}</div>
    </section>
  </div>
}
