import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { readFeedback, saveWithFeedback, type AdminFeedback } from '@/lib/admin-form'
import {
  assertEndAfterStart, assertPublishable, fail, formUrlPublishProblems, httpsUrl, parseInstant, recurringEventPublishProblems,
  requireInstant, requireSlug, requireText,
} from '@/lib/admin-validation'
import { FormFeedback, feedbackTargets } from '../_components/form-feedback'

async function saveRecurring(form: FormData) {
  'use server'
  await requireAdmin()
  const id = String(form.get('id') || '')
  await saveWithFeedback('/admin/recurring-events', id || 'rec-new', async () => {
    const db = await adminDb()
    const value = (key: string) => String(form.get(key) || '')
    const text = (key: string) => value(key).trim() || null
    const slug = requireSlug(value('slug'))
    const name = requireText(value('name'), 'Name')
    let publishedAt: string | null = null
    if (id) {
      const { data, error } = await db.from('recurring_events').select('slug,published_at').eq('id', id).single()
      if (error) throw new Error(error.message)
      if (data.slug !== slug) fail('Changing an event URL requires a redirect plan')
      publishedAt = data.published_at
    } else {
      const [oneTime, existing] = await Promise.all([
        db.from('one_time_events').select('id').eq('slug', slug).maybeSingle(),
        db.from('recurring_events').select('id').eq('slug', slug).maybeSingle(),
      ])
      if (oneTime.error || existing.error) throw new Error(oneTime.error?.message || existing.error?.message)
      if (oneTime.data) fail('This URL belongs to a one-time event')
      if (existing.data) fail('That recurring event URL already exists')
    }
    const publish = form.get('published') === 'on'
    const row = {
      slug, name,
      description: text('description'),
      short_summary: text('short_summary'),
      category: text('category'),
      recurrence_description: text('recurrence_description'),
      typical_time: text('typical_time'),
      location: text('location'),
      venue: text('venue'),
      featured_image_url: httpsUrl(value('featured_image_url'), 'Image URL'),
      churchsuite_form_url: httpsUrl(value('churchsuite_form_url'), 'ChurchSuite URL'),
      external_url: httpsUrl(value('external_url'), 'Other action URL'),
      published_at: publish ? (publishedAt || new Date().toISOString()) : null,
    }
    if (publish) assertPublishable('recurring event', [...recurringEventPublishProblems(row), ...formUrlPublishProblems(row.churchsuite_form_url, 'ChurchSuite URL')])
    const result = id ? await db.from('recurring_events').update(row).eq('id', id) : await db.from('recurring_events').insert(row)
    if (result.error) throw new Error(result.error.message)
    revalidatePath('/admin/recurring-events'); revalidatePath('/admin/events'); revalidatePath('/events'); revalidatePath(`/events/${slug}`); revalidatePath('/')
  })
}

async function saveOccurrence(form: FormData) {
  'use server'
  await requireAdmin()
  const id = String(form.get('id') || '')
  await saveWithFeedback('/admin/recurring-events', id || 'occ-new', async () => {
    const db = await adminDb()
    const value = (key: string) => String(form.get(key) || '')
    const eventId = value('recurring_event_id') || fail('Choose a recurring event')
    const start = requireInstant(value('start_datetime'), 'Start')
    const end = parseInstant(value('end_datetime'), 'End')
    assertEndAfterStart(start, end, false)
    const { data: parent, error: parentError } = await db.from('recurring_events').select('slug').eq('id', eventId).maybeSingle()
    if (parentError) throw new Error(parentError.message)
    if (!parent) fail('The selected recurring event no longer exists')
    const row = {
      recurring_event_id: eventId, start_datetime: start, end_datetime: end,
      location: value('location').trim() || null,
      notes: value('notes').trim() || null,
      cancelled: form.get('cancelled') === 'on',
    }
    const result = id
      ? await db.from('event_occurrences').update(row).eq('id', id)
      : await db.from('event_occurrences').upsert(row, { onConflict: 'recurring_event_id,start_datetime' })
    if (result.error) throw new Error(result.error.message)
    revalidatePath('/admin/recurring-events'); revalidatePath('/admin/events'); revalidatePath('/events'); revalidatePath(`/events/${parent.slug}`); revalidatePath('/')
  })
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

function RecurringForm({ item, feedback }: { item?: Recurring; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'rec-new'
  return <form id={`form-${formKey}`} action={saveRecurring} className="space-y-3 rounded border bg-white p-5">
    <FormFeedback feedback={feedback} formKey={formKey} />
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

function OccurrenceForm({ item, events, feedback }: { item?: Occurrence; events: Recurring[]; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'occ-new'
  return <form id={`form-${formKey}`} action={saveOccurrence} className="grid gap-3 rounded border bg-white p-4 md:grid-cols-2">
    <div className="md:col-span-2"><FormFeedback feedback={feedback} formKey={formKey} /></div>
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

export default async function AdminRecurringEventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
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
    <section><h2 className="mb-3 text-lg font-semibold">Recurring events</h2><RecurringForm feedback={feedback} />
      <div className="mt-4 space-y-3">{recurring.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><RecurringForm item={item} feedback={feedback} /></div></details>)}</div>
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Upcoming schedule occurrences</h2><OccurrenceForm events={recurring.filter(e => e.published_at)} feedback={feedback} />
      <div className="mt-4 space-y-3">{occurrences.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer">{recurring.find(e => e.id === item.recurring_event_id)?.name || 'Event'} — {item.start_datetime}{item.cancelled ? ' (cancelled)' : ''}</summary><div className="mt-4"><OccurrenceForm item={item} events={recurring.filter(e => e.published_at)} feedback={feedback} /></div></details>)}</div>
    </section>
  </div>
}
