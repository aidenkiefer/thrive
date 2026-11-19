/**
 * Attributed publishing. In editors wired to it (announcements so far; the
 * other editors and database-level enforcement are #91), content writes never
 * touch `published_at`: the `cms_set_published` database function changes it
 * and records the durable staff actor id (never an email) in the same
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

const ROLLED_BACK = Symbol('publicationRolledBack')

/**
 * True when the error came back from Postgres itself (it has a SQLSTATE), so the
 * cms_set_published transaction rolled back and nothing changed. A network or
 * gateway failure has no code: the call may or may not have committed.
 */
export function publicationRolledBack(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as Record<symbol, unknown>)[ROLLED_BACK] === true
}

/** Staff-actionable failures become AdminInputError so the form shows them inline and keeps its input. */
function publicationError(error: PublicationRpcError): Error {
  const result = toError(error)
  if (error.code) Object.defineProperty(result, ROLLED_BACK, { value: true })
  return result
}

function toError(error: PublicationRpcError): Error {
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
