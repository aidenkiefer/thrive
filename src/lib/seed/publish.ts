import type { SupabaseClient } from '@supabase/supabase-js'
import type { SeedTable } from './plan'
import { PUBLISH_AS } from './sql'

export type SeedPublishOutcome = 'published' | 'skipped' | 'none'

/**
 * Publish one seeded row through cms_set_published as the seed system actor,
 * keeping its original publish time: the service-role twin of publishSql.
 * Skipped when publication_events already has a row for this entity, so a
 * re-run never overrides a publish state someone set (a staff unpublish).
 * 'none' when the table has no publish state or the row has no publish time.
 * 'published' means the call was made; cms_set_published itself leaves an
 * already published row and its time alone.
 */
export async function publishSeedRow(
  db: SupabaseClient,
  table: SeedTable,
  id: string,
  publishedAt: unknown,
  actorId: string,
): Promise<SeedPublishOutcome> {
  const type = PUBLISH_AS[table]
  if (!type || publishedAt == null) return 'none'
  const { data, error } = await db.from('publication_events').select('entity_id')
    .eq('entity_type', type).eq('entity_id', id).limit(1)
  if (error) throw new Error(`publication history ${table} ${id}: ${error.message}`)
  if (data?.length) return 'skipped'
  const { error: publishError } = await db.rpc('cms_set_published', {
    p_entity_type: type, p_entity_id: id, p_publish: true, p_actor_id: actorId, p_published_at: publishedAt,
  })
  if (publishError) throw new Error(`publish ${table} ${id}: ${publishError.message}`)
  return 'published'
}
