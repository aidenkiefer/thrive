import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

async function saveAnnouncement(formData: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '').trim()
  if (!title) throw new Error('Announcement title is required')
  const ctaUrl = String(formData.get('cta_url') || '').trim()
  if (ctaUrl && !ctaUrl.startsWith('/') && !/^https:\/\//i.test(ctaUrl)) throw new Error('CTA URL must be an HTTPS URL or site path')
  const expiry = String(formData.get('expires_at') || '').trim()
  if (expiry && !/(Z|[+-]\d{2}:\d{2})$/i.test(expiry)) throw new Error('Expiry requires a timezone, such as Z or -06:00')
  const parsedExpiry = expiry ? new Date(expiry) : null
  if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) throw new Error('Invalid expiry date')
  let currentPublishedAt: string | null = null
  if (id) {
    const { data, error } = await db.from('announcements').select('published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    currentPublishedAt = data.published_at
  }
  const publish = formData.get('published') === 'on'
  const row = {
    title,
    body: String(formData.get('body') || '').trim() || null,
    cta_text: String(formData.get('cta_text') || '').trim() || null,
    cta_url: ctaUrl || null,
    featured_image_url: String(formData.get('featured_image_url') || '').trim() || null,
    is_homepage_feature: formData.get('is_homepage_feature') === 'on',
    expires_at: parsedExpiry?.toISOString() || null,
    published_at: publish ? (currentPublishedAt || new Date().toISOString()) : null,
  }
  const result = id
    ? await db.from('announcements').update(row).eq('id', id)
    : await db.from('announcements').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

type Announcement = {
  id: string; title: string; body: string | null; cta_text: string | null;
  cta_url: string | null; featured_image_url: string | null;
  is_homepage_feature: boolean; expires_at: string | null; published_at: string | null;
}

function AnnouncementForm({ item }: { item?: Announcement }) {
  return (
    <form action={saveAnnouncement} className="space-y-3 rounded border bg-white p-5">
      {item && <input type="hidden" name="id" value={item.id} />}
      <label className="block text-sm">Title<input name="title" defaultValue={item?.title} required className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Body<textarea name="body" defaultValue={item?.body || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Button text<input name="cta_text" defaultValue={item?.cta_text || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Button URL<input name="cta_url" defaultValue={item?.cta_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Expires (ISO date and time with timezone)<input name="expires_at" type="text" placeholder="2026-12-01T00:00:00Z" defaultValue={item?.expires_at || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="is_homepage_feature" defaultChecked={item?.is_homepage_feature} />Feature on homepage</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
      <button className="rounded bg-brand-800 px-4 py-2 text-white" type="submit">{item ? 'Save changes' : 'Create announcement'}</button>
    </form>
  )
}

export default async function AdminAnnouncementsPage() {
  const db = await adminDb()
  const { data, error } = await db.from('announcements').select('id,title,body,cta_text,cta_url,featured_image_url,is_homepage_feature,expires_at,published_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const items = (data || []) as Announcement[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Announcements</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New announcement</h2><AnnouncementForm /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing announcements</h2>
      {items.length === 0 && <p>No announcements yet.</p>}
      {items.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.title} — {item.published_at ? 'Published' : 'Draft'}</summary>
        <div className="mt-4"><AnnouncementForm item={item} /></div>
      </details>)}
    </section>
  </div>
}
