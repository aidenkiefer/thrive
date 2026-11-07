import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { readFeedback, saveWithFeedback, type AdminFeedback } from '@/lib/admin-form'
import {
  announcementPublishProblems, assertPublishable, httpsUrl, parseInstant, requireText, siteOrHttpsUrl,
} from '@/lib/admin-validation'
import { FormFeedback, feedbackTargets } from '../_components/form-feedback'

async function saveAnnouncement(formData: FormData) {
  'use server'
  await requireAdmin()
  const id = String(formData.get('id') || '')
  await saveWithFeedback('/admin/announcements', id || 'new', async () => {
    const db = await adminDb()
    const text = (key: string) => String(formData.get(key) || '').trim() || null
    const title = requireText(String(formData.get('title') || ''), 'Title')
    const ctaUrl = siteOrHttpsUrl(String(formData.get('cta_url') || ''), 'Button URL')
    const expiresAt = parseInstant(String(formData.get('expires_at') || ''), 'Expiry')
    let currentPublishedAt: string | null = null
    if (id) {
      const { data, error } = await db.from('announcements').select('published_at').eq('id', id).single()
      if (error) throw new Error(error.message)
      currentPublishedAt = data.published_at
    }
    const publish = formData.get('published') === 'on'
    const row = {
      title,
      body: text('body'),
      cta_text: text('cta_text'),
      cta_url: ctaUrl,
      featured_image_url: httpsUrl(String(formData.get('featured_image_url') || ''), 'Image URL'),
      is_homepage_feature: formData.get('is_homepage_feature') === 'on',
      expires_at: expiresAt,
      published_at: publish ? (currentPublishedAt || new Date().toISOString()) : null,
    }
    if (publish) assertPublishable('announcement', announcementPublishProblems(row, new Date()))
    const result = id
      ? await db.from('announcements').update(row).eq('id', id)
      : await db.from('announcements').insert(row)
    if (result.error) throw new Error(result.error.message)
    revalidatePath('/admin/announcements')
    revalidatePath('/')
  })
}

type Announcement = {
  id: string; title: string; body: string | null; cta_text: string | null;
  cta_url: string | null; featured_image_url: string | null;
  is_homepage_feature: boolean; expires_at: string | null; published_at: string | null;
}

function AnnouncementForm({ item, feedback }: { item?: Announcement; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'new'
  return (
    <form id={`form-${formKey}`} action={saveAnnouncement} className="space-y-3 rounded border bg-white p-5">
      <FormFeedback feedback={feedback} formKey={formKey} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <label className="block text-sm">Title<input name="title" defaultValue={item?.title} required className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Body<textarea name="body" defaultValue={item?.body || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Button text<input name="cta_text" defaultValue={item?.cta_text || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Button URL<input name="cta_url" defaultValue={item?.cta_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Image URL<input name="featured_image_url" defaultValue={item?.featured_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Expires (ISO date and time with timezone, optional)<input name="expires_at" type="text" placeholder="2026-12-01T00:00:00-06:00" defaultValue={item?.expires_at || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="is_homepage_feature" defaultChecked={item?.is_homepage_feature} />Feature on homepage</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
      <button className="rounded bg-brand-800 px-4 py-2 text-white" type="submit">{item ? 'Save changes' : 'Create announcement'}</button>
    </form>
  )
}

export default async function AdminAnnouncementsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
  const db = await adminDb()
  const { data, error } = await db.from('announcements').select('id,title,body,cta_text,cta_url,featured_image_url,is_homepage_feature,expires_at,published_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const items = (data || []) as Announcement[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Announcements</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New announcement</h2><AnnouncementForm feedback={feedback} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing announcements</h2>
      {items.length === 0 && <p>No announcements yet.</p>}
      {items.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.title} — {item.published_at ? 'Published' : 'Draft'}</summary>
        <div className="mt-4"><AnnouncementForm item={item} feedback={feedback} /></div>
      </details>)}
    </section>
  </div>
}
