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
  /** Optional env key holding extra recipients (comma list) added to the global default inbox */
  extraRecipientsEnv?: string
  /**
   * Optional env key holding this form's only inbox (one address). When set,
   * the form never uses the global default or any extras.
   */
  recipientEnv?: string
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
  extraRecipientsEnv: 'FORMS_FEEDBACK_EXTRA_RECIPIENTS',
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

const NAME_MAX = 100
const CONTROL = /[\u0000-\u001f\u007f]/
const PHONE = /^\+?[0-9][0-9 ().-]*[0-9]$/

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '').length
  return value.length <= 30 && PHONE.test(value) && digits >= 7 && digits <= 15
}

/**
 * Prayer request. Delivered only to the inbox in FORMS_PRAYER_RECIPIENT. An
 * email contact is used only as the reply-to address and never appears in the
 * body; a phone contact is written in the body.
 */
const prayer: FormDefinition = {
  id: 'prayer',
  recipientEnv: 'FORMS_PRAYER_RECIPIENT',
  validate(fields) {
    const errors: Record<string, string> = {}
    const name = text(fields, 'name')
    const contact = text(fields, 'contact')
    const request = text(fields, 'request').replace(/\r\n/g, '\n')

    if (name.length > NAME_MAX || CONTROL.test(name)) errors.name = `Please keep your name to one line under ${NAME_MAX} characters.`
    const email = contact && isEmail(contact) ? contact : ''
    const phone = contact && !email && isPhone(contact) ? contact : ''
    if (contact && !email && !phone) errors.contact = 'Enter an email address or phone number, or leave it blank.'
    if (request.length < MESSAGE_MIN) errors.request = `Tell us how we can be praying for you, in at least ${MESSAGE_MIN} characters.`
    else if (request.length > MESSAGE_MAX) errors.request = `Please keep it under ${MESSAGE_MAX} characters.`
    if (Object.keys(errors).length) return { ok: false, fieldErrors: errors }
    return { ok: true, values: { name, email, phone, request } }
  },
  compose(v) {
    const contact = v.phone ? `Phone: ${v.phone}` : v.email ? 'Contact: reply to this email' : 'Contact: (not given)'
    return {
      subject: '[Website] Prayer request',
      text: [`Name: ${v.name || '(not given)'}`, contact, '', v.request].join('\n'),
    }
  },
  replyTo: v => v.email || undefined,
}

const FORMS: Record<string, FormDefinition> = { feedback, prayer }

export function getForm(formId: string): FormDefinition | null {
  return Object.prototype.hasOwnProperty.call(FORMS, formId) ? FORMS[formId] : null
}
