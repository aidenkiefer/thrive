/** F1 native forms contract. Consumers (Experience, Ops) depend only on these shapes. */

export type FormFields = Record<string, unknown>

export type FormResult =
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: Record<string, string> }
  | { status: 'unavailable' }

export interface FeedbackFields {
  category: 'bug' | 'idea'
  message: string
  replyEmail?: string
  pagePath?: string
}

export interface MailMessage {
  from: string
  to: string[]
  replyTo?: string
  subject: string
  text: string
}

/** Server-only. The fake and any deployment transport obey the same contract. */
export interface MailTransport {
  /** Resolves on accepted delivery; rejects on any failure. */
  send(message: MailMessage): Promise<void>
}

export type FormEnv = Record<string, string | undefined>
