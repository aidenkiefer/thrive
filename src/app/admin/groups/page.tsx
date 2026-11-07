import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

const safeUrl = (value: FormDataEntryValue | null) => {
  const url = String(value || '').trim()
  if (!url) return null
  if (!url.startsWith('https://')) throw new Error('Signup links must use HTTPS')
  return url
}

async function saveGroup(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const slug = String(form.get('slug') || '').trim().toLowerCase()
  const name = String(form.get('name') || '').trim()
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Name and valid URL slug are required')
  let publishedAt: string | null = null
  if (id) {
    const { data, error } = await db.from('groups').select('slug,published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing a group URL requires a redirect plan')
    publishedAt = data.published_at
  } else {
    const { data, error } = await db.from('groups').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('That group URL already exists')
  }
  const publish = form.get('published') === 'on'
  const row = {
    slug, name,
    description: String(form.get('description') || '').trim() || null,
    short_summary: String(form.get('short_summary') || '').trim() || null,
    category: String(form.get('category') || '').trim() || null,
    meeting_schedule: String(form.get('meeting_schedule') || '').trim() || null,
    location: String(form.get('location') || '').trim() || null,
    leader: String(form.get('leader') || '').trim() || null,
    contact_email: String(form.get('contact_email') || '').trim() || null,
    contact_phone: String(form.get('contact_phone') || '').trim() || null,
    featured_image_url: safeUrl(form.get('featured_image_url')),
    churchsuite_form_url: safeUrl(form.get('churchsuite_form_url')),
    is_open: form.get('is_open') === 'on',
    published_at: publish ? (publishedAt || new Date().toISOString()) : null,
  }
  const result = id ? await db.from('groups').update(row).eq('id', id) : await db.from('groups').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/groups'); revalidatePath('/groups'); revalidatePath(`/groups/${slug}`); revalidatePath('/')
}

type Group = {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  category: string | null; meeting_schedule: string | null; location: string | null; leader: string | null;
  contact_email: string | null; contact_phone: string | null; featured_image_url: string | null;
  churchsuite_form_url: string | null; is_open: boolean; published_at: string | null;
}

function GroupForm({ item }: { item?: Group }) {
  return <form action={saveGroup} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Short summary<input name="short_summary" defaultValue={item?.short_summary || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Category<input name="category" defaultValue={item?.category || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Meeting schedule<input name="meeting_schedule" defaultValue={item?.meeting_schedule || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Location<input name="location" defaultValue={item?.location || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Leader<input name="leader" defaultValue={item?.leader || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Contact email<input name="contact_email" type="email" defaultValue={item?.contact_email || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Contact phone<input name="contact_phone" defaultValue={item?.contact_phone || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Signup URL<input name="churchsuite_form_url" defaultValue={item?.churchsuite_form_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="is_open" defaultChecked={item?.is_open ?? true} />Open to new participants</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save group' : 'Create group'}</button>
  </form>
}

export default async function AdminGroupsPage() {
  const db = await adminDb()
  const { data, error } = await db.from('groups').select('*').order('name')
  if (error) throw new Error(error.message)
  const items = (data || []) as unknown as Group[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Groups</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New group</h2><GroupForm /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing groups</h2>
      {items.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.name} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><GroupForm item={item} /></div></details>)}
    </section>
  </div>
}
