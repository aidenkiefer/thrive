/** Client-facing F1 shapes. Mirror Data's FormResult / FeedbackFields without importing server modules. */

export type FeedbackCategory = 'bug' | 'idea'

export interface FeedbackFields {
  category: FeedbackCategory
  message: string
  replyEmail?: string
  pagePath?: string
}

export type FormResult =
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: Record<string, string> }
  | { status: 'unavailable' }
