/**
 * Save one content row and set its publish state through cms_set_published,
 * in an order that never leaves the row more public than staff asked for:
 *
 *   existing row, unpublish: unpublish, then write content
 *   existing row, publish:   write content, then publish
 *   new row:                 insert as a draft, then publish if asked
 *
 * A new row whose publish rolled back (the error has a SQLSTATE) is deleted so
 * a retry cannot create a duplicate. A code-less failure may have committed,
 * so the row is kept and staff are told to check the list.
 */

import { AdminInputError } from '../admin-validation'
import { publicationRolledBack, setPublished, type PublicationDb, type PublishableEntity } from './publication'

type DbError = { message: string } | null

/** The slice of a Supabase client a content save needs, so tests can pass a fake. */
export interface ContentDb extends PublicationDb {
  from(table: string): {
    insert(row: Record<string, unknown>): {
      select(columns: 'id'): { single(): PromiseLike<{ data: { id: string } | null; error: DbError }> }
    }
    update(row: Record<string, unknown>): { eq(column: 'id', value: string): PromiseLike<{ error: DbError }> }
    delete(): { eq(column: 'id', value: string): PromiseLike<{ error: DbError }> }
  }
}

export interface SaveWithPublicationInput {
  table: string
  entityType: PublishableEntity
  /** Staff-facing noun for messages, e.g. 'announcement'. */
  label: string
  /** Existing row id, or null to insert. */
  id: string | null
  /** Content columns only. Never `published_at`. */
  row: Record<string, unknown>
  publish: boolean
  /** admin_staff_accounts.actor_id from requireAdmin(); never an email. */
  actorId: string
}

/** Returns the row id (the new one after an insert). Throws a staff-friendly Error. */
export async function saveWithPublication(db: ContentDb, input: SaveWithPublicationInput): Promise<string> {
  const { table, entityType, label, row, publish, actorId } = input
  const publication = (entityId: string) => setPublished(db, { entityType, entityId, publish, actorId })

  if (input.id) {
    const id = input.id
    if (!publish) await publication(id)
    const { error } = await db.from(table).update(row).eq('id', id)
    if (error) throw new Error(error.message)
    if (publish) await publication(id)
    return id
  }

  const { data, error } = await db.from(table).insert(row).select('id').single()
  if (error || !data) throw new Error(error?.message ?? `The ${label} could not be saved`)
  if (!publish) return data.id
  try {
    await publication(data.id)
  } catch (publishError) {
    if (!publicationRolledBack(publishError)) {
      throw new AdminInputError(`The ${label} was saved, but publishing could not be confirmed. Check the list below before trying again.`)
    }
    // The publish rolled back: drop the new draft so a retry can't duplicate it.
    const { error: cleanupError } = await db.from(table).delete().eq('id', data.id)
    if (cleanupError) {
      throw new AdminInputError(`The ${label} was saved as a draft but could not be published. Open it from the list below instead of creating it again.`)
    }
    throw publishError
  }
  return data.id
}
