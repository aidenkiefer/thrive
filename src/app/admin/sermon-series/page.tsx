import { adminDb } from '@/lib/admin-db'
import { readFeedback, type AdminFeedback } from '@/lib/admin-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { AdminForm } from '../_components/admin-form'
import { FormFeedback, feedbackTargets, formResetToken } from '../_components/form-feedback'
import { saveSeries } from './actions'

type Series = {
  id: string; slug: string; title: string; description: string | null; thumbnail_url: string | null
  start_date: string | null; end_date: string | null; seo_title: string | null
  seo_description: string | null; og_image_url: string | null; published_at: string | null
}

const COLUMNS = 'id,slug,title,description,thumbnail_url,start_date,end_date,seo_title,seo_description,og_image_url,published_at'

function SeriesForm({ item, feedback }: { item?: Series; feedback?: AdminFeedback }) {
  const formKey = item?.id || 'new'
  return <AdminForm resetToken={formResetToken(feedback, formKey)} id={`form-${formKey}`} action={saveSeries} className="space-y-3 rounded border bg-white p-5">
    <FormFeedback feedback={feedback} formKey={formKey} />
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Title<input name="title" defaultValue={item?.title} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Thumbnail URL (https)<input name="thumbnail_url" defaultValue={item?.thumbnail_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <DatePicker name="start_date" label="Start date (optional)" defaultValue={item?.start_date} />
    <DatePicker name="end_date" label="End date (optional)" defaultValue={item?.end_date} />
    <fieldset className="space-y-3 rounded border p-3">
      <legend className="px-1 text-sm font-medium">Search and sharing (optional)</legend>
      <label className="block text-sm">SEO title<input name="seo_title" defaultValue={item?.seo_title || ''} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">SEO description<textarea name="seo_description" defaultValue={item?.seo_description || ''} rows={2} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block text-sm">Social share image URL (https)<input name="og_image_url" defaultValue={item?.og_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    </fieldset>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <p className="text-xs text-gray-600">Only published series can be chosen on the sermon form.</p>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save series' : 'Create series'}</button>
  </AdminForm>
}

export default async function AdminSermonSeriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const feedback = await readFeedback(searchParams)
  const db = await adminDb()
  const { data, error } = await db.from('sermon_series').select(COLUMNS)
    .order('start_date', { ascending: false, nullsFirst: true }).order('title')
  if (error) throw new Error(error.message)
  const items = (data || []) as Series[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Sermon series</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New series</h2><SeriesForm feedback={feedback} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing series</h2>
      {items.length === 0 && <p>No series yet.</p>}
      {items.map(item => <details key={item.id} open={feedbackTargets(feedback, item.id)} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.title} — {item.published_at ? 'Published' : 'Draft'}</summary>
        <div className="mt-4"><SeriesForm item={item} feedback={feedback} /></div>
      </details>)}
    </section>
  </div>
}
