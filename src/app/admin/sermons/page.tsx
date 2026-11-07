import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

const list = (value: FormDataEntryValue | null) =>
  String(value || '').split(',').map(item => item.trim()).filter(Boolean)

const httpsUrl = (value: FormDataEntryValue | null) => {
  const url = String(value || '').trim()
  if (!url) return null
  if (!url.startsWith('https://')) throw new Error('Media URLs must use HTTPS')
  return url
}

async function saveSermon(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const slug = String(form.get('slug') || '').trim().toLowerCase()
  const title = String(form.get('title') || '').trim()
  const date = String(form.get('preached_at') || '')
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Title and valid URL slug are required')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error('Enter a valid preached date')
  let currentPublished: string | null = null
  if (id) {
    const { data, error } = await db.from('sermons').select('slug,published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing a sermon URL requires a redirect plan')
    currentPublished = data.published_at
  } else {
    const { data, error } = await db.from('sermons').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('That sermon URL already exists')
  }
  const speakerId = String(form.get('speaker_id') || '') || null
  const seriesId = String(form.get('series_id') || '') || null
  const publish = form.get('published') === 'on'
  const row = {
    slug, title, preached_at: date,
    description: String(form.get('description') || '').trim() || null,
    speaker_id: speakerId, series_id: seriesId,
    scripture_references: list(form.get('scripture_references')),
    topics: list(form.get('topics')),
    service_type: String(form.get('service_type') || '').trim() || null,
    youtube_url: httpsUrl(form.get('youtube_url')),
    audio_url: httpsUrl(form.get('audio_url')),
    video_url: httpsUrl(form.get('video_url')),
    thumbnail_url: httpsUrl(form.get('thumbnail_url')),
    published_at: publish ? (currentPublished || new Date().toISOString()) : null,
  }
  const result = id
    ? await db.from('sermons').update(row).eq('id', id)
    : await db.from('sermons').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/sermons')
  revalidatePath('/sermons')
  revalidatePath(`/sermons/${slug}`)
  revalidatePath('/')
}

type Speaker = { id: string; name: string }
type Series = { id: string; title: string }
type Sermon = {
  id: string; slug: string; title: string; description: string | null; preached_at: string
  speaker_id: string | null; series_id: string | null; scripture_references: string[] | null
  topics: string[] | null; service_type: string | null; youtube_url: string | null
  audio_url: string | null; video_url: string | null; thumbnail_url: string | null; published_at: string | null
}

function SermonForm({ item, speakers, series }: { item?: Sermon; speakers: Speaker[]; series: Series[] }) {
  return <form action={saveSermon} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Title<input name="title" defaultValue={item?.title} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Preached date<input name="preached_at" type="date" defaultValue={item?.preached_at} required className="mt-1 block rounded border p-2" /></label>
    <label className="block text-sm">Speaker<select name="speaker_id" defaultValue={item?.speaker_id || ''} className="mt-1 block w-full rounded border p-2"><option value="">No speaker</option>{speakers.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
    <label className="block text-sm">Series<select name="series_id" defaultValue={item?.series_id || ''} className="mt-1 block w-full rounded border p-2"><option value="">No series</option>{series.map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
    <label className="block text-sm">Description<textarea name="description" defaultValue={item?.description || ''} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Scripture references (comma separated)<input name="scripture_references" defaultValue={item?.scripture_references?.join(', ')} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Topics (comma separated)<input name="topics" defaultValue={item?.topics?.join(', ')} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Service type<input name="service_type" defaultValue={item?.service_type || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">YouTube URL<input name="youtube_url" defaultValue={item?.youtube_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Audio URL<input name="audio_url" defaultValue={item?.audio_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Video URL<input name="video_url" defaultValue={item?.video_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Thumbnail URL<input name="thumbnail_url" defaultValue={item?.thumbnail_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save sermon' : 'Create sermon'}</button>
  </form>
}

export default async function AdminSermonsPage() {
  const db = await adminDb()
  const [sermonsResult, speakersResult, seriesResult] = await Promise.all([
    db.from('sermons').select('*').order('preached_at', { ascending: false }),
    db.from('speakers').select('id,name').order('name'),
    db.from('sermon_series').select('id,title').not('published_at', 'is', null).order('title'),
  ])
  if (sermonsResult.error || speakersResult.error || seriesResult.error) {
    throw new Error(sermonsResult.error?.message || speakersResult.error?.message || seriesResult.error?.message)
  }
  const sermons = (sermonsResult.data || []) as unknown as Sermon[]
  const speakers = (speakersResult.data || []) as unknown as Speaker[]
  const series = (seriesResult.data || []) as unknown as Series[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Sermons</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New sermon</h2><SermonForm speakers={speakers} series={series} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing sermons</h2>
      {sermons.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4">
        <summary className="cursor-pointer font-medium">{item.title} — {item.published_at ? 'Published' : 'Draft'}</summary>
        <div className="mt-4"><SermonForm item={item} speakers={speakers} series={series} /></div>
      </details>)}
    </section>
  </div>
}
