import { SITE } from '@/components/content/site-info'

interface NewsletterSignupProps {
  /** "inverse" for use on navy bands. */
  tone?: 'default' | 'inverse'
  idPrefix?: string
}

/**
 * Plain HTML form POST to the live Mailchimp list (audit: get-connected.md,
 * owner decision 2 in the RC2 assignment). No API calls, no keys, no Supabase.
 * Opens Mailchimp's confirmation page in a new tab.
 *
 * Honeypot name follows Mailchimp's b_<u>_<id> convention derived from the action URL.
 */
export function NewsletterSignup({ tone = 'default', idPrefix = 'newsletter' }: NewsletterSignupProps) {
  const inverse = tone === 'inverse'
  const inputId = `${idPrefix}-email`
  return (
    <form
      action={SITE.newsletterAction}
      method="post"
      target="_blank"
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <input
        id={inputId}
        name="EMAIL"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className={`min-h-11 w-full flex-1 rounded-md border px-4 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
          inverse
            ? 'border-white/30 bg-white/10 text-white placeholder:text-white/60'
            : 'border-neutral-600/30 bg-neutral-0 text-neutral-950'
        }`}
      />
      {/* Mailchimp bot honeypot: must stay empty and out of sight. */}
      <div aria-hidden="true" className="absolute -left-[5000px]">
        <input
          type="text"
          name="b_52ddf886e427ded72ba838cce_2f89d575c4"
          tabIndex={-1}
          defaultValue=""
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent-400 px-6 py-2.5 text-sm font-medium text-neutral-950 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Subscribe
      </button>
    </form>
  )
}
