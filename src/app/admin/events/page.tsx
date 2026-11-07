import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { readFeedback, saveWithFeedback, type AdminFeedback } from '@/lib/admin-form'
import {
  assertEndAfterStart, assertPublishable, fail, formUrlPublishProblems, httpsUrl, oneTimeEventPublishProblems,
  parseInstant, requireInstant, requireSlug, requireText,
} from '@/lib/admin-validation'
import { AdminForm } from '../_components/admin-form'
import { FormFeedback, feedbackTargets, formInstanceKey } from '../_components/form-feedback'
import Link from 'next/link'

async function saveEvent(formData: FormData) {
  'use server'
  await requireAdmin()
  const id = String(formData.get('id') || '')
  await saveWithFeedback('/admin/events', id || 'new', async () => {
    const db = await adminDb()
    const value = (key: string) => String(formData.get(key) || '')
    const text = (key: string) => value(key).trim() || null
    const name = requireText(value('name'), 'Name')
    const slug = requireSlug(value('slug'))
    const start = requireInstant(value('start_datetime'), 'Start')
    const end = parseInstant(value('end_datetime'), 'End')
    assertEndAfterStart(start, end, true)
    let currentPublishedAt: string | null = null
    if (id) {
      const { data, error } = await db.from('one_time_events').select('slug,published_at').eq('id', id).single()
      if (error) throw new Error(error.message)
      if (data.slug !== slug) fail('Changing an event URL requires a redirect plan')
      currentPublishedAt = data.published_at
    } else {
      const [recurring, existing] = await Promise.all([
        db.from('recurring_events').select('id').eq('slug', slug).maybeSingle(),
        db.from('one_time_events').select('id').eq('slug', slug).maybeSingle(),
      ])
      if (recurring.error || existing.error) throw new Error(recurring.error?.message || existing.error?.message)
      if (recurring.data) fail('This URL slug belongs to a recurring event')
      if (existing.data) fail('That event URL already exists')
    }
    const publish = formData.get('published') === 'on'
    const row = {
      slug, name, start_datetime: start, end_datetime: end,
      description: text('description'),
      short_summary: text('short_summary'),
      category: text('category'),
      location: text('location'),
      venue: text('venue'),
      featured_image_url: httpsUrl(value('featured_image_url'), 'Image URL'),
      churchsuite_form_url: httpsUrl(value('churchsuite_form_url'), 'ChurchSuite URL'),
      external_url: httpsUrl(value('external_url'), 'Other action URL'),
      published_at: publish ? (currentPublishedAt || new Date().toISOString()) : null,
    }
    if (publish) assertPublishable('event', [...oneTimeEventPublishProblems(row), ...formUrlPublishProblems(row.churchsuite_form_url, 'ChurchSuite URL')])
    const result = id
      ? await db.from('one_time_events').update(row).eq('id', id)
      : await db.from('one_time_events').insert(row)
    if (result.error) throw new Error(result.error.message)
    revalidatePath('/admin/events')
    revalidatePath('/events')
    revalidatePath(`/events/${slug}`)
    revalidatePath('/')
  })
}

type EventRow = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  category: string | null; start_datetime: string; end_datetime: string | null;
  location: string | null; venue: string | null; featured_image_url: string | null;
  churchsuite_form_url: string | null; external_url: string | null; published_at: string | null;
}

function EventForm({ item, feedback }: { item?: EventRow; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'new'
  return <AdminForm key={formInstanceKey(feedback, formKey)} id={`form-${formKey}`} action={saveEvent} className="space-y-3 rounded border bg-white p-5">
    <FormFeedback feedback={feedback} formKey={formKey} />
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Start (ISO time with Chicago offset: -06:00 winter, -05:00 summer)<input name="start_datetime" placeholder="2026-12-05T09:00:00-06:00" defaultValue={item?.start_datetime} required className="mt-1 block w-full rounded border p-2" /></label>
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
  </AdminForm>
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
  const db = await adminDb()
  const { data, error } = await db.from('one_time_events').select('*').order('start_datetime', { ascending: false })
  if (error) throw new Error(error.message)
  const items = (data || []) as EventRow[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">One-time events</h1>
    <Link href="/admin/recurring-events" className="inline-block rounded border px-4 py-2">Manage recurring events &amp; schedules</Link>
    <p className="text-sm text-neutral-600">Recurring event schedules are managed through the migration workflow while their rules are reconciled.</p>
    <section><h2 className="mb-3 text-lg font-semibold">New event</h2><EventForm feedback={feedback} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing events</h2>
      {items.length === 0 && <p>No one-time events yet.</p>}
      {items.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary>
        <div className="mt-4"><EventForm item={item} feedback={feedback} /></div>
      </details>)}
    </section>
  </div>
}
