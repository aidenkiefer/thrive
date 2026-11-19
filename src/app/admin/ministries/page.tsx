import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { readFeedback, saveWithFeedback, type AdminFeedback } from '@/lib/admin-form'
import { assertPublishable, fail, formUrlPublishProblems, httpsUrl, requireSlug, requireText } from '@/lib/admin-validation'
import { FormFeedback, feedbackTargets } from '../_components/form-feedback'

async function saveMinistry(form: FormData) {
  'use server'
  await requireAdmin()
  const id = String(form.get('id') || '')
  await saveWithFeedback('/admin/ministries', id || 'new', async () => {
    const db = await adminDb()
    const text = (key: string) => String(form.get(key) || '').trim() || null
    const name = requireText(String(form.get('name') || ''), 'Name')
    const slug = requireSlug(String(form.get('slug') || ''))
    let publishedAt: string | null = null
    if (id) {
      const { data, error } = await db.from('ministries').select('slug,published_at').eq('id', id).single()
      if (error) throw new Error(error.message)
      if (data.slug !== slug) fail('Changing a ministry URL requires a redirect plan')
      publishedAt = data.published_at
    } else {
      const { data, error } = await db.from('ministries').select('id').eq('slug', slug).maybeSingle()
      if (error) throw new Error(error.message)
      if (data) fail('That ministry URL already exists')
    }
    const photo = httpsUrl(String(form.get('featured_image_url') || ''), 'Image URL')
    const publish = form.get('published') === 'on'
    const row = {
      slug, name,
      description: text('description'),
      short_summary: text('short_summary'),
      leader: text('leader'),
      contact_email: text('contact_email'), featured_image_url: photo,
      schedule_description: text('schedule_description'),
      churchsuite_form_url: httpsUrl(String(form.get('churchsuite_form_url') || ''), 'Signup form URL'),
      seo_title: text('seo_title'),
      seo_description: text('seo_description'),
      og_image_url: photo,
      published_at: publish ? (publishedAt || new Date().toISOString()) : null,
    }
    if (publish) assertPublishable('ministry', formUrlPublishProblems(row.churchsuite_form_url))
    const result = id ? await db.from('ministries').update(row).eq('id', id) : await db.from('ministries').insert(row)
    if (result.error) throw new Error(result.error.message)
    revalidatePath('/admin/ministries')
    revalidatePath(`/ministries/${slug}`)
    revalidatePath('/sitemap.xml')
  })
}

type Ministry = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  leader: string | null; contact_email: string | null; featured_image_url: string | null;
  schedule_description: string | null; churchsuite_form_url: string | null;
  seo_title: string | null; seo_description: string | null; published_at: string | null;
}

function MinistryForm({ item, feedback }: { item?: Ministry; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'new'
  return <form id={`form-${formKey}`} action={saveMinistry} className="space-y-3 rounded border bg-white p-5">
    <FormFeedback feedback={feedback} formKey={formKey} />
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Short summary<input name="short_summary" defaultValue={item?.short_summary || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Leader<input name="leader" defaultValue={item?.leader || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Contact email<input name="contact_email" type="email" defaultValue={item?.contact_email || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Schedule (for example the meeting day and time; leave blank if unknown)<input name="schedule_description" defaultValue={item?.schedule_description || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Signup form URL (ChurchSuite or Google Forms)<input name="churchsuite_form_url" type="url" defaultValue={item?.churchsuite_form_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">SEO title<input name="seo_title" defaultValue={item?.seo_title || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">SEO description<textarea name="seo_description" defaultValue={item?.seo_description || ''} rows={2} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save ministry' : 'Create ministry'}</button>
  </form>
}

export default async function AdminMinistriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
  const db = await adminDb()
  const { data, error } = await db.from('ministries').select('*').order('name')
  if (error) throw new Error(error.message)
  const rows = (data || []) as unknown as Ministry[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Ministries</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New ministry</h2><MinistryForm feedback={feedback} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing ministries</h2>
      {rows.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><MinistryForm item={item} feedback={feedback} /></div></details>)}
    </section>
  </div>
}
