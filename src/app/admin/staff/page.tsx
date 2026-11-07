import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

async function saveStaff(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const slug = String(form.get('slug') || '').trim().toLowerCase()
  const name = String(form.get('name') || '').trim()
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Name and valid profile slug are required')
  const email = String(form.get('email') || '').trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address')
  const phone = String(form.get('phone') || '').trim()
  let order = Number(form.get('display_order') || 0)
  if (!Number.isInteger(order) || order < 0) throw new Error('Display order must be a whole number at least zero')
  if (id) {
    const { data, error } = await db.from('staff').select('slug').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing a staff URL requires a redirect plan')
  } else {
    const { data, error } = await db.from('staff').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('That staff profile slug already exists')
  }
  const photo = String(form.get('photo_url') || '').trim()
  if (photo && !photo.startsWith('https://')) throw new Error('Photo URL must use HTTPS')
  const row = {
    slug, name,
    title: String(form.get('title') || '').trim() || null,
    bio: String(form.get('bio') || '').trim() || null,
    photo_url: photo || null,
    email: email || null,
    phone: phone || null,
    display_order: order,
  }
  const result = id ? await db.from('staff').update(row).eq('id', id) : await db.from('staff').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/staff'); revalidatePath('/about/team'); revalidatePath('/about')
}

type Staff = { id: string; slug: string; name: string; title: string | null; bio: string | null; photo_url: string | null; email: string | null; phone: string | null; display_order: number | null }

function StaffForm({ item }: { item?: Staff }) {
  return <form action={saveStaff} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Profile slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Title<input name="title" defaultValue={item?.title || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Biography<textarea name="bio" defaultValue={item?.bio || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Photo URL<input name="photo_url" defaultValue={item?.photo_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Email<input name="email" type="email" defaultValue={item?.email || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Phone<input name="phone" defaultValue={item?.phone || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Display order<input name="display_order" type="number" min="0" step="1" defaultValue={item?.display_order ?? 0} className="mt-1 block w-full rounded border p-2" /></label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save profile' : 'Add staff profile'}</button>
  </form>
}

export default async function AdminStaffPage() {
  const db = await adminDb()
  const { data, error } = await db.from('staff').select('*').order('display_order', { ascending: true }).order('name')
  if (error) throw new Error(error.message)
  const rows = (data || []) as unknown as Staff[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Staff directory</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New profile</h2><StaffForm /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing profiles</h2>
      {rows.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">{item.display_order ?? 0}. {item.name}</summary><div className="mt-4"><StaffForm item={item} /></div></details>)}
    </section>
  </div>
}
