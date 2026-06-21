import { createClient } from '../supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string
  title: string
  body: string | null
  cta_text: string | null
  cta_url: string | null
  featured_image_url: string | null
  is_homepage_feature: boolean
  expires_at: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the most recent homepage-featured announcement that has not expired.
 */
export async function getFeaturedAnnouncement(): Promise<Announcement | null> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_homepage_feature', true)
    .not('published_at', 'is', null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as Announcement
}
