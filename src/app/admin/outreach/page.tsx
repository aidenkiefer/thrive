import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { readFeedback, saveWithFeedback, type AdminFeedback } from '@/lib/admin-form'
import { assertPublishable, fail, formUrlPublishProblems, httpsUrl, requireSlug, requireText } from '@/lib/admin-validation'
import { FormFeedback, feedbackTargets } from '../_components/form-feedback'

async function saveOutreach(form: FormData) {
  'use server'
  await requireAdmin()
  const id = String(form.get('id') || '')
  await saveWithFeedback('/admin/outreach', id || 'new', async () => {
    const db = await adminDb()
    const text = (key: string) => String(form.get(key) || '').trim() || null
    const name = requireText(String(form.get('name') || ''), 'Name')
    const slug = requireSlug(String(form.get('slug') || ''))
    let publishedAt: string | null = null
    if (id) {
      const { data, error } = await db.from('outreach').select('slug,published_at').eq('id', id).single()
      if (error) throw new Error(error.message)
      if (data.slug !== slug) fail('Changing an outreach URL requires a redirect plan')
      publishedAt = data.published_at
    } else {
      const { data, error } = await db.from('outreach').select('id').eq('slug', slug).maybeSingle()
      if (error) throw new Error(error.message)
      if (data) fail('That outreach URL already exists')
    }
    const start = String(form.get('start_date') || '') || null
    const end = String(form.get('end_date') || '') || null
    if ((start && Number.isNaN(Date.parse(start))) || (end && Number.isNaN(Date.parse(end)))) fail('Enter valid dates')
    if (start && end && end < start) fail('End date must follow start date')
    const publish = form.get('published') === 'on'
    const row = {
      slug, name,
      description: text('description'),
      short_summary: text('short_summary'),
      featured_image_url: httpsUrl(String(form.get('featured_image_url') || ''), 'Image URL'),
      contact_email: text('contact_email'),
      volunteer_signup_url: httpsUrl(String(form.get('volunteer_signup_url') || ''), 'Volunteer signup URL'),
      churchsuite_form_url: httpsUrl(String(form.get('churchsuite_form_url') || ''), 'ChurchSuite URL'),
      is_ongoing: form.get('is_ongoing') === 'on',
      start_date: start, end_date: end,
      published_at: publish ? (publishedAt || new Date().toISOString()) : null,
    }
    if (publish) assertPublishable('outreach initiative', formUrlPublishProblems(row.churchsuite_form_url, 'ChurchSuite URL'))
    const result = id ? await db.from('outreach').update(row).eq('id', id) : await db.from('outreach').insert(row)
    if (result.error) throw new Error(result.error.message)
    revalidatePath('/admin/outreach'); revalidatePath('/outreach'); revalidatePath(`/outreach/${slug}`); revalidatePath('/')
  })
}

type Outreach = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  featured_image_url: string | null; contact_email: string | null; volunteer_signup_url: string | null;
  churchsuite_form_url: string | null; is_ongoing: boolean; start_date: string | null;
  end_date: string | null; published_at: string | null;
}

function OutreachForm({ item, feedback }: { item?: Outreach; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'new'
  return <form id={`form-${formKey}`} action={saveOutreach} className="space-y-3 rounded border bg-white p-5">
    <FormFeedback feedback={feedback} formKey={formKey} />
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Short summary<input name="short_summary" defaultValue={item?.short_summary || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Contact email<input name="contact_email" type="email" defaultValue={item?.contact_email || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Volunteer signup URL<input name="volunteer_signup_url" defaultValue={item?.volunteer_signup_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">ChurchSuite URL<input name="churchsuite_form_url" defaultValue={item?.churchsuite_form_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Start date<input name="start_date" type="date" defaultValue={item?.start_date || ''} className="mt-1 block rounded border p-2" /></label>
    <label className="block text-sm">End date<input name="end_date" type="date" defaultValue={item?.end_date || ''} className="mt-1 block rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="is_ongoing" defaultChecked={item?.is_ongoing} />Ongoing</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save outreach' : 'Create outreach'}</button>
  </form>
}

export default async function AdminOutreachPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
  const db = await adminDb()
  const { data, error } = await db.from('outreach').select('*').order('name')
  if (error) throw new Error(error.message)
  const rows = (data || []) as unknown as Outreach[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Outreach</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New initiative</h2><OutreachForm feedback={feedback} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing initiatives</h2>
      {rows.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><OutreachForm item={item} feedback={feedback} /></div></details>)}
    </section>
  </div>
}
