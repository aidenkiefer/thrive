import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

/** Service-role client for admin pages and actions. Always re-checks the admin session first. */
export async function adminDb() {
  await requireAdmin()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin connection is not configured')
  return createClient(url, key)
}
