import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

async function saveMinistry(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const slug = String(form.get('slug') || '').trim().toLowerCase()
  const name = String(form.get('name') || '').trim()
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Name and valid URL slug are required')
  let publishedAt: string | null = null
  if (id) {
    const { data, error } = await db.from('ministries').select('slug,published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing a ministry URL requires a redirect plan')
    publishedAt = data.published_at
  } else {
    const { data, error } = await db.from('ministries').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('That ministry URL already exists')
  }
  const photo = String(form.get('featured_image_url') || '').trim()
  if (photo && !photo.startsWith('https://')) throw new Error('Image URL must use HTTPS')
  const email = String(form.get('contact_email') || '').trim()
  const publish = form.get('published') === 'on'
  const row = {
    slug, name,
    description: String(form.get('description') || '').trim() || null,
    short_summary: String(form.get('short_summary') || '').trim() || null,
    leader: String(form.get('leader') || '').trim() || null,
    contact_email: email || null, featured_image_url: photo || null,
    seo_title: String(form.get('seo_title') || '').trim() || null,
    seo_description: String(form.get('seo_description') || '').trim() || null,
    og_image_url: photo || null,
    published_at: publish ? (publishedAt || new Date().toISOString()) : null,
  }
  const result = id ? await db.from('ministries').update(row).eq('id', id) : await db.from('ministries').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/ministries')
  revalidatePath(`/ministries/${slug}`)
  revalidatePath('/sitemap.xml')
}

type Ministry = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  leader: string | null; contact_email: string | null; featured_image_url: string | null;
  seo_title: string | null; seo_description: string | null; published_at: string | null;
}

function MinistryForm({ item }: { item?: Ministry }) {
  return <form action={saveMinistry} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Short summary<input name="short_summary" defaultValue={item?.short_summary || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Leader<input name="leader" defaultValue={item?.leader || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Contact email<input name="contact_email" type="email" defaultValue={item?.contact_email || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">SEO title<input name="seo_title" defaultValue={item?.seo_title || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">SEO description<textarea name="seo_description" defaultValue={item?.seo_description || ''} rows={2} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save ministry' : 'Create ministry'}</button>
  </form>
}

export default async function AdminMinistriesPage() {
  const db = await adminDb()
  const { data, error } = await db.from('ministries').select('*').order('name')
  if (error) throw new Error(error.message)
  const rows = (data || []) as unknown as Ministry[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Ministries</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New ministry</h2><MinistryForm /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing ministries</h2>
      {rows.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><MinistryForm item={item} /></div></details>)}
    </section>
  </div>
}
