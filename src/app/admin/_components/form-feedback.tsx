import type { AdminFeedback } from '@/lib/admin-form'

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
