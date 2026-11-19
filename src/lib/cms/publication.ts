/**
 * Attributed publishing. Content writes never touch `published_at`; the only
 * way to publish or unpublish is the `cms_set_published` database function,
 * which records the durable staff actor id (never an email) in the same
 * transaction. See supabase/migrations/20261119000000_publication_events.sql.
 */

import { AdminInputError } from '../admin-validation'

export type PublishableEntity =
  | 'sermon_series'
  | 'sermon'
  | 'recurring_event'
  | 'one_time_event'
  | 'group'
  | 'ministry'
  | 'announcement'
  | 'landing_page'
  | 'outreach'

export interface PublicationRpcError {
  code?: string | null
  message?: string | null
}

/** The slice of a Supabase client this module needs, so tests can pass a fake. */
export interface PublicationDb {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: PublicationRpcError | null }>
}

export interface SetPublishedInput {
  entityType: PublishableEntity
  entityId: string
  publish: boolean
  /** admin_staff_accounts.actor_id from requireAdmin(); never an email. */
  actorId: string
}

/** The "Published" checkbox convention used by the admin forms. */
export function publishIntent(formData: FormData, field = 'published'): boolean {
  return formData.get(field) === 'on'
}

/** Staff-actionable failures become AdminInputError so the form shows them inline and keeps its input. */
function publicationError(error: PublicationRpcError): Error {
  switch (error.code) {
    case '42501':
      return new AdminInputError('Your staff account is not active; sign in again')
    case 'P0002':
      return new AdminInputError('This item no longer exists, so its publish state could not be changed')
    case '22023':
      return new AdminInputError('This item cannot be published from this form')
    default:
      return new Error(`Could not change the publish state: ${error.message || 'unknown error'}`)
  }
}

/**
 * Publish or unpublish one content row and return its resulting `published_at`
 * (null when it is a draft). Re-publishing an already published row keeps its
 * original publish time and records no event. Throws a staff-friendly Error.
 */
export async function setPublished(db: PublicationDb, input: SetPublishedInput): Promise<string | null> {
  const { data, error } = await db.rpc('cms_set_published', {
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_publish: input.publish,
    p_actor_id: input.actorId,
  })
  if (error) throw publicationError(error)
  return typeof data === 'string' ? data : null
}
