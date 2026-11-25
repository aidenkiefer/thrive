import { adminDb } from '@/lib/admin-db'
import { readFeedback, type AdminFeedback } from '@/lib/admin-form'
import { AdminForm } from '../_components/admin-form'
import { FormFeedback, feedbackTargets, formResetToken } from '../_components/form-feedback'
import { saveSpeaker } from './actions'

type Speaker = {
  id: string; slug: string; name: string; title: string | null; bio: string | null
  photo_url: string | null; email: string | null
}

function SpeakerForm({ item, feedback }: { item?: Speaker; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'new'
  return <AdminForm resetToken={formResetToken(feedback, formKey)} id={`form-${formKey}`} action={saveSpeaker} className="space-y-3 rounded border bg-white p-5">
    <FormFeedback feedback={feedback} formKey={formKey} />
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Name<input name="name" defaultValue={item?.name} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Title or role (optional)<input name="title" defaultValue={item?.title || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Bio<textarea name="bio" defaultValue={item?.bio || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Photo URL (https)<input name="photo_url" defaultValue={item?.photo_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Email (staff only, never shown on the site)<input name="email" type="email" defaultValue={item?.email || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save speaker' : 'Add speaker'}</button>
  </AdminForm>
}

export default async function AdminSpeakersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
  const db = await adminDb()
  const { data, error } = await db.from('speakers').select('id,slug,name,title,bio,photo_url,email').order('name')
  if (error) throw new Error(error.message)
  const items = (data || []) as Speaker[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Speakers</h1>
    <p className="text-sm text-gray-600">Every speaker here can be chosen on the sermon form.</p>
    <section><h2 className="mb-3 text-lg font-semibold">New speaker</h2><SpeakerForm feedback={feedback} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing speakers</h2>
      {items.length === 0 && <p>No speakers yet.</p>}
      {items.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.name}{item.title ? ` — ${item.title}` : ''}</summary>
        <div className="mt-4"><SpeakerForm item={item} feedback={feedback} /></div>
      </details>)}
    </section>
  </div>
}
