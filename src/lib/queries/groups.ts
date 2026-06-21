import { createClient } from '../supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Group {
  id: string
  slug: string
  name: string
  description: string | null
  short_summary: string | null
  category: string | null
  meeting_schedule: string | null
  location: string | null
  leader: string | null
  contact_email: string | null
  contact_phone: string | null
  featured_image_url: string | null
  churchsuite_form_url: string | null
  is_open: boolean
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a selection of published groups for highlight display.
 * Defaults to 3; ordered by created_at ASC (stable editorial order).
 */
export async function getHighlightedGroups(limit: number = 3): Promise<Group[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .not('published_at', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error || !data) return []
  return data as Group[]
}
