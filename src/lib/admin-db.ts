import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { adminAuthOptions } from '@/lib/admin-auth'

export async function adminDb() {
  const session = await getServerSession(adminAuthOptions)
  if (!session?.user?.email || session.user.email.toLowerCase() !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    throw new Error('Administrator access required')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin connection is not configured')
  return createClient(url, key)
}
