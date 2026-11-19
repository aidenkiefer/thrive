import { resendFromEnv, type ResendOptions } from './resend'
import type { FormEnv, MailMessage, MailTransport } from './types'

/** In-memory transport for tests and local development. Never delivers anything. */
export class FakeMailTransport implements MailTransport {
  readonly outbox: MailMessage[] = []
  constructor(private readonly failWith?: Error) {}
  async send(message: MailMessage): Promise<void> {
    if (this.failWith) throw this.failWith
    this.outbox.push(message)
  }
}

let sharedFake: FakeMailTransport | undefined

/** Shared instance so a dev server request and a local inspector see one outbox. */
export function sharedFakeTransport(): FakeMailTransport {
  return (sharedFake ??= new FakeMailTransport())
}

/**
 * Pick the transport from configuration. FORMS_MAIL_TRANSPORT=resend with a
 * nonempty RESEND_API_KEY selects the Resend adapter; anything else in
 * production resolves to null and submissions report 'unavailable'. The fake
 * is refused in production even if requested, so a stray variable cannot
 * silently swallow visitor messages.
 */
export function transportFromEnv(
  env: FormEnv & { NODE_ENV?: string },
  options?: ResendOptions,
): MailTransport | null {
  if (env.FORMS_MAIL_TRANSPORT === 'resend') return resendFromEnv(env, options)
  if (env.FORMS_MAIL_TRANSPORT === 'fake' && env.NODE_ENV !== 'production') return sharedFakeTransport()
  return null
}

/** Sender comes from configuration only; visitors never influence it. */
export function senderFromEnv(env: FormEnv): string | null {
  const from = env.FORMS_MAIL_FROM?.trim()
  return from && !/[\r\n]/.test(from) ? from : null
}
