import { createClient } from '../supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Speaker {
  id: string
  slug: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  email: string | null
  created_at: string
}

export interface SermonSeries {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  start_date: string | null
  end_date: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
  sermon_count?: number
}

export interface Sermon {
  id: string
  slug: string
  title: string
  description: string | null
  speaker_id: string | null
  series_id: string | null
  scripture_references: string[] | null
  audio_url: string | null
  video_url: string | null
  youtube_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  preached_at: string | null
  location: string | null
  topics: string[] | null
  service_type: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
  speaker: Speaker | null
  series: SermonSeries | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the most recent published sermon with speaker and series joined.
 */
export async function getLatestSermon(): Promise<Sermon | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sermons')
    .select('*, speaker:speakers(*), series:sermon_series(*)')
    .not('published_at', 'is', null)
    .order('preached_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as Sermon
}

/**
 * Returns all published sermons ordered by preached_at DESC.
 * Optionally limited to `limit` results.
 */
export async function getSermons(limit?: number): Promise<Sermon[]> {
  const supabase = await createClient()

  let query = supabase
    .from('sermons')
    .select('*, speaker:speakers(*), series:sermon_series(*)')
    .not('published_at', 'is', null)
    .order('preached_at', { ascending: false })

  if (limit !== undefined) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data as Sermon[]
}

/**
 * Returns a single published sermon by slug with speaker and series joined.
 */
export async function getSermonBySlug(slug: string): Promise<Sermon | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sermons')
    .select('*, speaker:speakers(*), series:sermon_series(*)')
    .not('published_at', 'is', null)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Sermon
}

/**
 * Returns all published sermon series ordered by start_date DESC.
 */
export async function getSermonSeries(): Promise<SermonSeries[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sermon_series')
    .select('*')
    .not('published_at', 'is', null)
    .order('start_date', { ascending: false })

  if (error || !data) return []
  return data as SermonSeries[]
}

/**
 * Returns all published sermons in a given series, ordered by preached_at DESC.
 */
export async function getSermonsBySeriesSlug(seriesSlug: string): Promise<Sermon[]> {
  const supabase = await createClient()

  // First resolve the series id from its slug
  const { data: series, error: seriesError } = await supabase
    .from('sermon_series')
    .select('id')
    .not('published_at', 'is', null)
    .eq('slug', seriesSlug)
    .single()

  if (seriesError || !series) return []

  const { data, error } = await supabase
    .from('sermons')
    .select('*, speaker:speakers(*), series:sermon_series(*)')
    .not('published_at', 'is', null)
    .eq('series_id', series.id)
    .order('preached_at', { ascending: false })

  if (error || !data) return []
  return data as Sermon[]
}
