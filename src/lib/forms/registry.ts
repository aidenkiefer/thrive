import { isEmail } from './recipients'
import type { FormFields } from './types'

export interface ValidatedForm {
  ok: true
  /** Normalized, visitor-safe values */
  values: Record<string, string>
}
export interface InvalidForm { ok: false; fieldErrors: Record<string, string> }

export interface FormDefinition {
  id: string
  /** Env var prefix for recipient resolution: <PREFIX>_RECIPIENT, <PREFIX>_EXTRA_RECIPIENTS */
  recipientEnv: string
  validate(fields: FormFields): ValidatedForm | InvalidForm
  /** Build subject and body from validated values. Server-side text only. */
  compose(values: Record<string, string>): { subject: string; text: string }
  replyTo?(values: Record<string, string>): string | undefined
}

const MESSAGE_MIN = 10
const MESSAGE_MAX = 4000

function text(fields: FormFields, key: string): string {
  const v = fields[key]
  return typeof v === 'string' ? v.trim() : ''
}

const feedback: FormDefinition = {
  id: 'feedback',
  recipientEnv: 'FORMS_FEEDBACK',
  validate(fields) {
    const errors: Record<string, string> = {}
    const category = text(fields, 'category')
    const message = text(fields, 'message').replace(/\r\n/g, '\n')
    const replyEmail = text(fields, 'replyEmail')
    const pagePath = text(fields, 'pagePath')

    if (category !== 'bug' && category !== 'idea') errors.category = 'Choose bug or idea.'
    if (message.length < MESSAGE_MIN) errors.message = `Please write at least ${MESSAGE_MIN} characters.`
    else if (message.length > MESSAGE_MAX) errors.message = `Please keep it under ${MESSAGE_MAX} characters.`
    if (replyEmail && !isEmail(replyEmail)) errors.replyEmail = 'Enter a valid email address or leave it blank.'
    if (pagePath && (!/^\/[^\s\u0000-\u001f]*$/.test(pagePath) || pagePath.length > 200)) {
      errors.pagePath = 'Page must be a site path such as /events.'
    }
    if (Object.keys(errors).length) return { ok: false, fieldErrors: errors }
    return { ok: true, values: { category, message, replyEmail, pagePath } }
  },
  compose(v) {
    const label = v.category === 'bug' ? 'Bug report' : 'Idea'
    return {
      subject: `[Website feedback] ${label}`,
      text: [
        `Type: ${label}`,
        `Page: ${v.pagePath || '(not given)'}`,
        `Reply to: ${v.replyEmail || '(not given)'}`,
        '',
        v.message,
      ].join('\n'),
    }
  },
  replyTo: v => v.replyEmail || undefined,
}

const FORMS: Record<string, FormDefinition> = { feedback }

export function getForm(formId: string): FormDefinition | null {
  return Object.prototype.hasOwnProperty.call(FORMS, formId) ? FORMS[formId] : null
}
