import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const base = 'https://thrivevineyard.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ['', '/plan-a-visit', '/sermons', '/sermons/series', '/events']
  const entries: MetadataRoute.Sitemap = routes.map(route => ({ url: `${base}${route}` }))
  const db = await createClient()
  const results = await Promise.all([
    db.from('sermons').select('slug').not('published_at', 'is', null),
    db.from('sermon_series').select('slug').not('published_at', 'is', null),
    db.from('one_time_events').select('slug').not('published_at', 'is', null),
    db.from('recurring_events').select('slug').not('published_at', 'is', null),
    db.from('landing_pages').select('slug').not('published_at', 'is', null),
  ])
  for (const result of results) {
    if (result.error) throw new Error(`Sitemap query failed: ${result.error.message}`)
  }
  const [sermons, series, oneTime, recurring, landingPages] = results
  for (const row of sermons.data ?? []) entries.push({ url: `${base}/sermons/${row.slug}` })
  for (const row of series.data ?? []) entries.push({ url: `${base}/sermons/series/${row.slug}` })
  const eventSlugs = new Set([...(oneTime.data ?? []), ...(recurring.data ?? [])].map(row => row.slug))
  for (const slug of eventSlugs) entries.push({ url: `${base}/events/${slug}` })
  for (const row of landingPages.data ?? []) entries.push({ url: `${base}/${row.slug}` })
  return entries
}
