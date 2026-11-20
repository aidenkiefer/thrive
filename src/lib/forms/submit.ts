import { getForm } from './registry'
import { resolveOwnRecipient, resolveRecipients } from './recipients'
import { senderFromEnv, transportFromEnv } from './transport'
import type { FormEnv, FormFields, FormResult, MailTransport } from './types'

export interface SubmitDeps {
  env?: FormEnv & { NODE_ENV?: string }
  transport?: MailTransport | null
  /** Receives one fixed, PII-free line per unavailable result. Defaults to console.error. */
  log?: (line: string) => void
}

/** Fixed codes only: never the fields, recipients, or the transport's error text. */
type UnavailableCode = 'not_configured' | 'send_failed'

/**
 * F1: submitWebsiteForm(formId, fields).
 * - 'invalid': visitor input failed validation (retry after fixing fields).
 * - 'unavailable': configuration or delivery failed (retry later). Callers
 *   cannot distinguish which, by design.
 * Submitted text is never logged; an unavailable result logs one fixed code
 * and the registry form id. Recipients and sender are server-resolved.
 */
export async function submitWebsiteForm(
  formId: string,
  fields: FormFields,
  deps: SubmitDeps = {},
): Promise<FormResult> {
  const form = getForm(formId)
  if (!form) return { status: 'invalid', fieldErrors: { form: 'Unknown form.' } }

  const checked = form.validate(fields ?? {})
  if (!checked.ok) return { status: 'invalid', fieldErrors: checked.fieldErrors }

  const log = deps.log ?? console.error
  const unavailable = (code: UnavailableCode): FormResult => {
    log(`[forms] unavailable code=${code} form=${form.id}`)
    return { status: 'unavailable' }
  }

  const env = deps.env ?? process.env
  const recipients = form.recipientEnv
    ? resolveOwnRecipient(env, form.recipientEnv)
    : resolveRecipients(env, form.extraRecipientsEnv)
  const from = senderFromEnv(env)
  const transport = deps.transport === undefined ? transportFromEnv(env) : deps.transport
  if (!recipients || !from || !transport) return unavailable('not_configured')

  const { subject, text } = form.compose(checked.values)
  try {
    await transport.send({ from, to: recipients, replyTo: form.replyTo?.(checked.values), subject, text })
    return { status: 'sent' }
  } catch {
    return unavailable('send_failed')
  }
}
