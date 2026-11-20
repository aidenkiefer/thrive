import type { FormEnv, MailMessage, MailTransport } from './types'

/** Resend Email API, POST /emails (https://github.com/resend/resend-openapi). */
export const RESEND_ENDPOINT = 'https://api.resend.com/emails'
export const RESEND_TIMEOUT_MS = 8000

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>

export interface ResendOptions {
  fetch?: FetchLike
  timeoutMs?: number
}

/**
 * Deployment transport over the Resend HTTP API (no SDK dependency).
 * Every failure rejects with a generic error that carries no message text,
 * recipient, or key, so nothing sensitive can reach logs. There is no retry:
 * a timed-out request may already have been accepted, and resending would
 * duplicate the visitor's report. The sender must be on a domain verified in
 * Resend; that is deployment configuration, never code.
 */
export class ResendMailTransport implements MailTransport {
  constructor(private readonly apiKey: string, private readonly options: ResendOptions = {}) {}

  async send(message: MailMessage): Promise<void> {
    const doFetch = this.options.fetch ?? ((input, init) => fetch(input, init))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? RESEND_TIMEOUT_MS)
    try {
      const res = await doFetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        redirect: 'error',
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`resend: http ${res.status}`)
      const body: unknown = await res.json()
      const id = (body as { id?: unknown } | null)?.id
      if (typeof id !== 'string' || !id) throw new Error('resend: malformed response')
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('resend:')) throw e
      throw new Error(controller.signal.aborted ? 'resend: timeout' : 'resend: request failed')
    } finally {
      clearTimeout(timer)
    }
  }
}

/** Enabled only by a nonempty RESEND_API_KEY. */
export function resendFromEnv(env: FormEnv, options?: ResendOptions): ResendMailTransport | null {
  const key = env.RESEND_API_KEY?.trim()
  return key ? new ResendMailTransport(key, options) : null
}
