import { createClient } from '../supabase/server'

export interface Ministry {
  id: string; slug: string; name: string; description: string | null; short_summary: string | null;
  leader: string | null; contact_email: string | null; featured_image_url: string | null;
  /** Free-text meeting schedule entered by staff. Null when unknown. */
  schedule_description: string | null;
  /** Signup form (ChurchSuite or Google Forms). Check with isApprovedFormUrl() before embedding. */
  churchsuite_form_url: string | null;
  seo_title: string | null; seo_description: string | null; og_image_url: string | null;
  published_at: string | null; created_at: string;
}

export async function getMinistryBySlug(slug: string): Promise<Ministry | null> {
  const db = await createClient()
  const { data, error } = await db.from('ministries').select('*').eq('slug', slug).not('published_at', 'is', null).maybeSingle()
  if (error || !data) return null
  return data as unknown as Ministry
}
