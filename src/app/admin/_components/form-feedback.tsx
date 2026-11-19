import type { AdminFeedback } from '@/lib/admin-form'
import { instanceKey } from '@/lib/admin-form-instance'

/** Inline result message for one admin form. Renders nothing unless the feedback targets this form. */
export function FormFeedback({ feedback, formKey }: { feedback?: AdminFeedback; formKey: string }) {
  if (!feedback || feedback.form !== formKey) return null
  if (feedback.error) {
    return <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{feedback.error}</p>
  }
  return <p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">Saved.</p>
}

export function feedbackTargets(feedback: AdminFeedback | undefined, formKey: string): boolean {
  return Boolean(feedback && feedback.form === formKey)
}

/**
 * React key for an admin form. A successful save issues a new instance token
 * (?fi=), so the form remounts showing the saved values (or blank, for "new").
 * Rejected saves carry the same token forward, so the key stays stable and
 * AdminForm keeps the typed values, including after save-then-invalid.
 */
export function formInstanceKey(feedback: AdminFeedback | undefined, formKey: string): string {
  return instanceKey(formKey, feedback?.instance)
}
