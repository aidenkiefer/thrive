import { Band } from '@/components/content/Band'
import { FeatureSplit } from '@/components/content/FeatureSplit'
import { Button } from '@/components/ui'

/**
 * "Come as you are" welcome split.
 * Sources:
 *  - "Come as you are": existing homepage hero lead.
 *  - Worship invitation: docs/audit/2026-11/pages/about.md ("Get in Touch").
 *  - Volunteer welcome + gift: docs/audit/2026-11/pages/plan-a-visit.md (step 5).
 * Photo: PHOTOS.familyWorship (audited).
 */
export function WelcomeSection() {
  return (
    <Band tone="white" prose={false}>
      <FeatureSplit photo="familyWorship" aspect="aspect-[4/5]" position="object-top" className="max-w-5xl mx-auto">
        <p className="text-sm font-medium tracking-wide text-brand-600">Come as you are</p>
        <h2>We can&rsquo;t wait to meet you</h2>
        {/* Source: about.md "Get in Touch" */}
        <p>Join us for our worship service, Sundays at 9:30am. Or feel free to reach out and let&rsquo;s connect. We can&rsquo;t wait to meet you!</p>
        {/* Source: plan-a-visit.md step 5 */}
        <p>
          Being new isn&rsquo;t easy. At every entrance you&rsquo;ll find volunteers ready to help you find your way
          around the building, answer questions, and make you feel at home. They&rsquo;ll also have a gift for you!
          Just say &ldquo;I&rsquo;m new!&rdquo;
        </p>
        <p>
          <Button href="/plan-a-visit" variant="primary" className="min-h-11 px-6 no-underline !text-white">
            Plan your visit
          </Button>
        </p>
      </FeatureSplit>
    </Band>
  )
}
