/**
 * Per-form reset token: an opaque, non-sensitive random id issued by a
 * successful save (?saved=<form>&fi=<token>). Only the form named by `saved`
 * receives it, and each AdminForm tracks its own last-seen token in client
 * state, so saving one form never remounts (or clears the typed edits of) any
 * other form, and nothing depends on the Referer header. No submitted content
 * is ever involved.
 */
const TOKEN = /^[A-Za-z0-9-]{8,64}$/

export function newFormInstance(): string {
  return crypto.randomUUID()
}

/** Returns the token only if it is a well-formed, bounded id; anything else is dropped. */
export function parseFormInstance(value: unknown): string | undefined {
  return typeof value === 'string' && TOKEN.test(value) ? value : undefined
}

export type ResetState = { seen: string | undefined; epoch: number }

/**
 * Decides whether a form must remount (to show freshly saved values, or blank
 * for "new"). A form remounts only when it is handed a token it has not seen.
 * No token (another form's save, a rejected save, a plain navigation) leaves it
 * untouched.
 */
export function nextResetState(state: ResetState, token: string | undefined): ResetState {
  if (!token || token === state.seen) return state
  return { seen: token, epoch: state.epoch + 1 }
}

/** Reset token for one form: only the form that just saved receives it. */
export function formResetToken(
  feedback: { saved?: string; form?: string; instance?: string } | undefined,
  formKey: string,
): string | undefined {
  return feedback && feedback.saved === formKey && feedback.form === formKey ? feedback.instance : undefined
}
