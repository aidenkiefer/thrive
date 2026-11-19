import { getForm } from './registry'
import { resolveRecipients } from './recipients'
import { senderFromEnv, transportFromEnv } from './transport'
import type { FormEnv, FormFields, FormResult, MailTransport } from './types'

export interface SubmitDeps {
  env?: FormEnv & { NODE_ENV?: string }
  transport?: MailTransport | null
}

/**
 * F1: submitWebsiteForm(formId, fields).
 * - 'invalid': visitor input failed validation (retry after fixing fields).
 * - 'unavailable': configuration or delivery failed (retry later). Callers
 *   cannot distinguish which, by design.
 * Submitted text is never logged. Recipients and sender are server-resolved.
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

  const env = deps.env ?? process.env
  const recipients = resolveRecipients(form.recipientEnv, env)
  const from = senderFromEnv(env)
  const transport = deps.transport === undefined ? transportFromEnv(env) : deps.transport
  if (!recipients || !from || !transport) return { status: 'unavailable' }

  const { subject, text } = form.compose(checked.values)
  try {
    await transport.send({ from, to: recipients, replyTo: form.replyTo?.(checked.values), subject, text })
    return { status: 'sent' }
  } catch {
    return { status: 'unavailable' }
  }
}
