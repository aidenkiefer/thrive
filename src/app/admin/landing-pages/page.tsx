import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'

const reserved = new Set(['plan-a-visit', 'sermons', 'events', 'groups', 'kids-youth', 'outreach', 'about', 'give', 'ministries', 'admin'])
function secureUrl(value: FormDataEntryValue | null) {
  const url = String(value || '').trim()
  if (!url) return null
  if (!url.startsWith('/') && !url.startsWith('https://')) throw new Error('Use an HTTPS link or a site path')
  return url
}

async function saveLanding(form: FormData) {
  'use server'
  await requireAdmin()
  const db = await adminDb()
  const id = String(form.get('id') || '')
  const slug = String(form.get('slug') || '').trim().toLowerCase()
  const title = String(form.get('title') || '').trim()
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reserved.has(slug)) {
    throw new Error('Enter a title and a valid, available root URL slug')
  }
  let publishedAt: string | null = null
  if (id) {
    const { data, error } = await db.from('landing_pages').select('slug,published_at').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (data.slug !== slug) throw new Error('Changing a campaign URL requires a redirect plan')
    publishedAt = data.published_at
  } else {
    const { data, error } = await db.from('landing_pages').select('id').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) throw new Error('That root URL already exists')
  }
  const linked = String(form.get('linked_entity') || '')
  const [entityType = '', entityId = ''] = linked.split('|')
  const allowed = new Set(['recurring_event', 'one_time_event', 'group', 'ministry'])
  if (entityType && (!allowed.has(entityType) || !entityId)) throw new Error('Select a valid canonical record')
  const publish = form.get('published') === 'on'
  const row = {
    slug, title,
    hero_heading: String(form.get('hero_heading') || '').trim() || null,
    hero_subheading: String(form.get('hero_subheading') || '').trim() || null,
    hero_image_url: secureUrl(form.get('hero_image_url')),
    body_content: String(form.get('body_content') || '').trim() || null,
    cta_text: String(form.get('cta_text') || '').trim() || null,
    cta_url: secureUrl(form.get('cta_url')),
    linked_entity_type: entityType || null,
    linked_entity_id: entityId || null,
    seo_title: String(form.get('seo_title') || '').trim() || null,
    seo_description: String(form.get('seo_description') || '').trim() || null,
    og_image_url: secureUrl(form.get('og_image_url')),
    published_at: publish ? (publishedAt || new Date().toISOString()) : null,
  }
  const result = id ? await db.from('landing_pages').update(row).eq('id', id) : await db.from('landing_pages').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/landing-pages')
  revalidatePath(`/${slug}`)
  revalidatePath('/sitemap.xml')
}

type EntityChoice = { id: string; name: string; type: string }
type Landing = {
  id: string; slug: string; title: string; hero_heading: string | null; hero_subheading: string | null;
  hero_image_url: string | null; body_content: string | null; cta_text: string | null; cta_url: string | null;
  linked_entity_type: string | null; linked_entity_id: string | null; seo_title: string | null;
  seo_description: string | null; og_image_url: string | null; published_at: string | null;
}

function LandingForm({ item, entities }: { item?: Landing; entities: EntityChoice[] }) {
  const selected = item?.linked_entity_type && item.linked_entity_id ? `${item.linked_entity_type}|${item.linked_entity_id}` : ''
  return <form action={saveLanding} className="space-y-3 rounded border bg-white p-5">
    {item && <input type="hidden" name="id" value={item.id} />}
    <label className="block text-sm">Internal title<input name="title" defaultValue={item?.title} required className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Root URL slug<input name="slug" defaultValue={item?.slug} required readOnly={Boolean(item)} className="mt-1 block w-full rounded border p-2 read-only:bg-gray-100" /></label>
    <label className="block text-sm">Linked canonical record<select name="linked_entity" defaultValue={selected} className="mt-1 block w-full rounded border p-2"><option value="">No linked record</option>{entities.map(entity => <option key={entity.id} value={`${entity.type}|${entity.id}`}>{entity.type.replace('_', ' ')} — {entity.name}</option>)}</select></label>
    <label className="block text-sm">Hero heading<input name="hero_heading" defaultValue={item?.hero_heading || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Hero subheading<textarea name="hero_subheading" defaultValue={item?.hero_subheading || ''} rows={2} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Hero image URL<input name="hero_image_url" defaultValue={item?.hero_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Body copy<textarea name="body_content" defaultValue={item?.body_content || ''} rows={5} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Button text<input name="cta_text" defaultValue={item?.cta_text || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Button URL<input name="cta_url" defaultValue={item?.cta_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">SEO title<input name="seo_title" defaultValue={item?.seo_title || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">SEO description<textarea name="seo_description" defaultValue={item?.seo_description || ''} rows={2} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="block text-sm">Social image URL<input name="og_image_url" defaultValue={item?.og_image_url || ''} className="mt-1 block w-full rounded border p-2" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={Boolean(item?.published_at)} />Published</label>
    <button type="submit" className="rounded bg-brand-800 px-4 py-2 text-white">{item ? 'Save landing page' : 'Create landing page'}</button>
  </form>
}

export default async function AdminLandingPagesPage() {
  const db = await adminDb()
  const [pages, recurring, oneTime, groups, ministries] = await Promise.all([
    db.from('landing_pages').select('*').order('title'),
    db.from('recurring_events').select('id,name').not('published_at', 'is', null),
    db.from('one_time_events').select('id,name').not('published_at', 'is', null),
    db.from('groups').select('id,name').not('published_at', 'is', null),
    db.from('ministries').select('id,name').not('published_at', 'is', null),
  ])
  const error = pages.error || recurring.error || oneTime.error || groups.error || ministries.error
  if (error) throw new Error(error.message)
  const options: EntityChoice[] = [
    ...((recurring.data || []) as unknown as { id: string; name: string }[]).map(x => ({ ...x, type: 'recurring_event' })),
    ...((oneTime.data || []) as unknown as { id: string; name: string }[]).map(x => ({ ...x, type: 'one_time_event' })),
    ...((groups.data || []) as unknown as { id: string; name: string }[]).map(x => ({ ...x, type: 'group' })),
    ...((ministries.data || []) as unknown as { id: string; name: string }[]).map(x => ({ ...x, type: 'ministry' })),
  ]
  const items = (pages.data || []) as unknown as Landing[]
  return <div className="max-w-3xl space-y-8">
    <h1 className="text-2xl font-bold">Campaign landing pages</h1>
    <section><h2 className="mb-3 text-lg font-semibold">New landing page</h2><LandingForm entities={options} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Existing pages</h2>
      {items.map(item => <details key={item.id} className="rounded border bg-gray-50 p-4"><summary className="cursor-pointer font-medium">/{item.slug} — {item.published_at ? 'Published' : 'Draft'}</summary><div className="mt-4"><LandingForm item={item} entities={options} /></div></details>)}
    </section>
  </div>
}
