import { Band } from '@/components/content/Band'
import { SectionIntro } from '@/components/content/SectionIntro'
import { NewsletterSignup } from '@/components/forms/NewsletterSignup'

/**
 * Newsletter band.
 * Source: heading "Subscribe to the Thrive Newsletter" from docs/audit/2026-11/pages/get-connected.md.
 * Form: Mailchimp POST via NewsletterSignup (live list, no API calls).
 */
export function NewsletterSection() {
  return (
    <Band tone="navy" prose={false}>
      <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <SectionIntro tone="inverse" title="Subscribe to the Thrive newsletter" />
        <NewsletterSignup tone="inverse" idPrefix="home-newsletter" />
      </div>
    </Band>
  )
}
