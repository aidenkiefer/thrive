import { LinkButton } from '@/components/events/LinkButton'
import {
  formProvider,
  providerLabel,
  resolveResponderUrl,
  isDemoFormUrl,
} from './signup-form'

type SignupKind = 'event' | 'group'

interface SignupPanelProps {
  /** Canonical entity name, used in the context sentence (not the heading). */
  entityName: string
  kind: SignupKind
  /** Raw form URL from the canonical entity; validated internally. */
  formUrl: string | null | undefined
  /** Optional secondary external info link (events). */
  moreUrl?: string | null
  /** Optional contact fallback (groups). */
  contactEmail?: string | null
  /** Show the pending state when no form is wired yet. */
  expectSignup?: boolean
  className?: string
}

const copy: Record<SignupKind, { heading: string; action: string; context: (name: string) => string }> = {
  event: {
    heading: 'Sign up',
    action: 'Sign up',
    context: (name) => `Save your place for ${name}.`,
  },
  group: {
    heading: 'Join this group',
    action: 'Ask to join',
    context: (name) => `Let us know you’d like to join ${name} and a leader will be in touch.`,
  },
}

/**
 * Reusable, intentional Thrive-branded signup handoff for canonical event and
 * group pages (#149). It frames the signup, labels the hosting provider, and
 * hands the visitor to the approved responder URL in a new tab — never a bare
 * embed, custom fields, a submission proxy, or a per-visitor Forms API call.
 * Responses and review stay with the provider.
 */
export function SignupPanel({
  entityName,
  kind,
  formUrl,
  moreUrl,
  contactEmail,
  expectSignup = false,
  className = '',
}: SignupPanelProps) {
  const responder = resolveResponderUrl(formUrl)
  const provider = responder ? formProvider(responder) : null
  const demo = responder ? isDemoFormUrl(responder) : false
  const text = copy[kind]
  const headingId = `signup-${kind}`

  const wrapper = `mt-6 border-t border-neutral-200 pt-5 ${className}`.trim()

  // No approved responder URL to show.
  if (!responder || !provider) {
    if (moreUrl) {
      return (
        <section aria-labelledby={headingId} className={wrapper}>
          <h3 id={headingId} className="font-display text-lg font-semibold text-neutral-950">
            {text.heading}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Sign-up and full details are on the organiser’s page. It opens in a new tab.
          </p>
          <div className="mt-4">
            <LinkButton href={moreUrl} className="w-full sm:w-auto">
              Details &amp; sign up
            </LinkButton>
          </div>
        </section>
      )
    }
    if (!expectSignup) return null
    return (
      <section aria-labelledby={headingId} className={wrapper}>
        <h3 id={headingId} className="font-display text-lg font-semibold text-neutral-950">
          Signups aren’t open yet
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          There’s no signup link for this {kind} yet. Please check back soon
          {contactEmail ? ' or get in touch below.' : '.'}
        </p>
        {contactEmail && (
          <div className="mt-4">
            <LinkButton href={`mailto:${contactEmail}`} variant="secondary" className="w-full sm:w-auto">
              Get in touch
            </LinkButton>
          </div>
        )}
      </section>
    )
  }

  const label = providerLabel(provider)

  return (
    <section aria-labelledby={headingId} className={wrapper}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 id={headingId} className="font-display text-lg font-semibold text-neutral-950">
          {text.heading}
        </h3>
        {demo && (
          <span className="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-700 ring-1 ring-inset ring-warning-700/20">
            Demo preview
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{text.context(entityName)}</p>

      {demo && (
        <p className="mt-2 text-sm leading-relaxed text-warning-700">
          This is a development preview, not a live signup. No real registration is recorded.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <LinkButton href={responder} className="w-full sm:w-auto">
          {demo ? 'Open demo form' : text.action}
        </LinkButton>
        {contactEmail && (
          <LinkButton href={`mailto:${contactEmail}`} variant="secondary" className="w-full sm:w-auto">
            Ask a question
          </LinkButton>
        )}
        {moreUrl && (
          <LinkButton href={moreUrl} variant="secondary" className="w-full sm:w-auto">
            More details
          </LinkButton>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Opens in a new tab on {label}. Your responses are handled by {label}, not stored on this website.
      </p>
    </section>
  )
}
