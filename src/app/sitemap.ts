import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const base = 'https://thrivevineyard.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/plan-a-visit',
    '/sermons',
    '/sermons/series',
    '/events',
    '/about',
    '/about/team',
    '/give',
    '/kids-youth',
    '/groups',
    '/outreach',
  ]
  const entries: MetadataRoute.Sitemap = routes.map(route => ({ url: `${base}${route}` }))
  const db = await createClient()
  const results = await Promise.all([
    db.from('sermons').select('slug').not('published_at', 'is', null),
    db.from('sermon_series').select('slug').not('published_at', 'is', null),
    db.from('one_time_events').select('slug').not('published_at', 'is', null),
    db.from('recurring_events').select('slug').not('published_at', 'is', null),
    db.from('landing_pages').select('slug').not('published_at', 'is', null),
    db.from('ministries').select('slug').not('published_at', 'is', null),
  ])
  for (const result of results) {
    if (result.error) throw new Error(`Sitemap query failed: ${result.error.message}`)
  }
  const [sermons, series, oneTime, recurring, landingPages, ministries] = results
  type SlugRow = { slug: string }
  const sermonRows = sermons.data as unknown as SlugRow[] | null
  const seriesRows = series.data as unknown as SlugRow[] | null
  const oneTimeRows = oneTime.data as unknown as SlugRow[] | null
  const recurringRows = recurring.data as unknown as SlugRow[] | null
  const landingRows = landingPages.data as unknown as SlugRow[] | null
  const ministryRows = ministries.data as unknown as SlugRow[] | null
  for (const row of sermonRows ?? []) entries.push({ url: `${base}/sermons/${row.slug}` })
  for (const row of seriesRows ?? []) entries.push({ url: `${base}/sermons/series/${row.slug}` })
  const eventSlugs = new Set([...(oneTimeRows ?? []), ...(recurringRows ?? [])].map(row => row.slug))
  for (const slug of eventSlugs) entries.push({ url: `${base}/events/${slug}` })
  for (const row of landingRows ?? []) entries.push({ url: `${base}/${row.slug}` })
  for (const row of ministryRows ?? []) entries.push({ url: `${base}/ministries/${row.slug}` })
  return entries
}
