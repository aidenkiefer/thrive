import { createClient } from '../supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Outreach {
  id: string
  slug: string
  name: string
  description: string | null
  short_summary: string | null
  featured_image_url: string | null
  contact_email: string | null
  volunteer_signup_url: string | null
  churchsuite_form_url: string | null
  is_ongoing: boolean
  start_date: string | null
  end_date: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns active published outreach initiatives ordered by start_date ASC (nulls last).
 * Defaults to 3 results.
 */
export async function getActiveOutreach(limit: number = 3): Promise<Outreach[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('outreach')
    .select('*')
    .not('published_at', 'is', null)
    .order('start_date', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []
  return data as Outreach[]
}
