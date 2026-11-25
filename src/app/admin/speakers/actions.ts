'use server'

import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { saveWithFeedback } from '@/lib/admin-form'
import { revalidateEntity } from '@/lib/revalidate'
import { fail, httpsUrl, optionalEmail, requireSlug, requireText } from '@/lib/admin-validation'

/**
 * Create or update one speaker (#42). Speakers have no published state: the
 * sermon form lists every speaker, and the public site shows a speaker only
 * through a published sermon. `email` is staff-only; public queries never select it.
 */
export async function saveSpeaker(form: FormData): Promise<void> {
  await requireAdmin()
  const id = String(form.get('id') || '')
  await saveWithFeedback('/admin/speakers', id || 'new', async () => {
    const db = await adminDb()
    const value = (key: string) => String(form.get(key) || '')
    const text = (key: string) => value(key).trim() || null
    const slug = requireSlug(value('slug'))
    const row = {
      slug,
      name: requireText(value('name'), 'Name'),
      title: text('title'),
      bio: text('bio'),
      photo_url: httpsUrl(value('photo_url'), 'Photo URL'),
      email: optionalEmail(value('email'), 'Email'),
    }
    if (id) {
      const { data, error } = await db.from('speakers').select('slug').eq('id', id).single()
      if (error) throw new Error(error.message)
      if (data.slug !== slug) fail("A speaker's URL slug can't change after it is created")
    } else {
      const { data, error } = await db.from('speakers').select('id').eq('slug', slug).maybeSingle()
      if (error) throw new Error(error.message)
      if (data) fail('That speaker slug already exists')
    }
    try {
      const { error } = id
        ? await db.from('speakers').update(row).eq('id', id)
        : await db.from('speakers').insert(row)
      if (error) throw new Error(error.message)
    } finally {
      revalidateEntity('speaker')
    }
  })
}
