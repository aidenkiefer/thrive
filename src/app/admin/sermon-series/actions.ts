'use server'

import { adminDb } from '@/lib/admin-db'
import { requireAdmin } from '@/lib/admin-auth'
import { publishIntent, saveWithPublication } from '@/lib/cms'
import { saveWithFeedback } from '@/lib/admin-form'
import { revalidateEntity } from '@/lib/revalidate'
import {
  assertDateRange, fail, httpsUrl, parseDateOnly, requireSlug, requireText, seriesUnpublishProblem,
} from '@/lib/admin-validation'

/** Create or update one sermon series and set its publish state (#42). */
export async function saveSeries(form: FormData): Promise<void> {
  const { actorId } = await requireAdmin()
  const id = String(form.get('id') || '')
  await saveWithFeedback('/admin/sermon-series', id || 'new', async () => {
    const db = await adminDb()
    const value = (key: string) => String(form.get(key) || '')
    const text = (key: string) => value(key).trim() || null
    const slug = requireSlug(value('slug'))
    const title = requireText(value('title'), 'Title')
    const startDate = parseDateOnly(value('start_date'), 'Start date')
    const endDate = parseDateOnly(value('end_date'), 'End date')
    assertDateRange(startDate, endDate)
    // Content columns only: saveWithPublication is the only path that sets published_at.
    const row = {
      slug, title,
      description: text('description'),
      thumbnail_url: httpsUrl(value('thumbnail_url'), 'Thumbnail URL'),
      start_date: startDate,
      end_date: endDate,
      seo_title: text('seo_title'),
      seo_description: text('seo_description'),
      og_image_url: httpsUrl(value('og_image_url'), 'Social share image URL'),
    }
    const publish = publishIntent(form)
    if (id) {
      const { data, error } = await db.from('sermon_series').select('slug,published_at').eq('id', id).single()
      if (error) throw new Error(error.message)
      if (data.slug !== slug) fail('Changing a series URL requires a redirect plan')
      if (data.published_at && !publish) {
        const { count, error: countError } = await db.from('sermons')
          .select('id', { count: 'exact', head: true })
          .eq('series_id', id)
          .not('published_at', 'is', null)
        if (countError || count === null) throw new Error(countError?.message || "Could not check this series' sermons")
        const problem = seriesUnpublishProblem(count)
        if (problem) fail(problem)
      }
    } else {
      const { data, error } = await db.from('sermon_series').select('id').eq('slug', slug).maybeSingle()
      if (error) throw new Error(error.message)
      if (data) fail('That series URL already exists')
    }
    try {
      await saveWithPublication(db, {
        table: 'sermon_series', entityType: 'sermon_series', label: 'series',
        id: id || null, row, publish, actorId,
      })
    } finally {
      // Also on failure: an unpublish may have committed before a later step threw.
      revalidateEntity('sermon_series', slug)
    }
  })
}
