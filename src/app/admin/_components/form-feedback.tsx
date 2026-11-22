import type { AdminFeedback } from '@/lib/admin-form'

export { formResetToken } from '@/lib/admin-form-instance'

/** Inline result message for one admin form. Renders nothing unless the feedback targets this form. */
export function FormFeedback({ feedback, formKey }: { feedback?: AdminFeedback; formKey: string }) {
  if (!feedback || feedback.form !== formKey) return null
  if (feedback.error) {
    return <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger-600/25 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"><span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger-600" />{feedback.error}</p>
  }
  return <p role="status" className="flex items-center gap-2.5 rounded-xl border border-success-600/25 bg-success-50 px-4 py-3 text-sm font-medium text-success-700"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-success-600" />Saved.</p>
}

export function feedbackTargets(feedback: AdminFeedback | undefined, formKey: string): boolean {
  return Boolean(feedback && feedback.form === formKey)
}
