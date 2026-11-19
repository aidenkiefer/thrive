import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const base = 'https://thrivevineyard.com'

export const STATIC_ROUTES = [
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
  // Same path as the legacy WordPress page (docs/04-seo-url-migration-map.md), so it needs no redirect.
  '/get-connected',
] as const

export function buildStaticEntries(siteBase: string = base): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map(route => ({ url: `${siteBase}${route}` }))
}

// Why: in production a failed database read must surface as an error so crawlers retry later
// instead of caching a silently truncated sitemap. Previews and local builds often have no
// Supabase config, and a 500 there only hides the (still valid) static routes.
export function shouldFallbackToStatic(vercelEnv: string | undefined): boolean {
  return vercelEnv !== 'production'
}

async function buildDatabaseEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = buildStaticEntries()
  try {
    return [...entries, ...(await buildDatabaseEntries())]
  } catch (error) {
    if (!shouldFallbackToStatic(process.env.VERCEL_ENV)) throw error
    // Message only: never log row data or connection details.
    const message = error instanceof Error ? error.message : 'unknown error'
    console.warn(`Sitemap: database entries skipped, serving static routes only (${message})`)
    return entries
  }
}
