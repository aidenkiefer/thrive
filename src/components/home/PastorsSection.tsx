import Link from 'next/link'
import { Band } from '@/components/content/Band'
import { FeatureSplit } from '@/components/content/FeatureSplit'
import { PullQuote } from '@/components/content/PullQuote'
import { SectionIntro } from '@/components/content/SectionIntro'
import { Button } from '@/components/ui'

/**
 * Meet the pastors.
 * Source: docs/audit/2026-11/pages/about.md, "Our History":
 *  - "Co-Pastors Kevin and Molly Kiefer" (attribution)
 *  - Kevin's quote, verbatim: "It's a privilege to be able to show our community the goodness of Jesus and how He can change lives."
 * Photos: Kevin and Molly at the pulpit (LaSalle set), shown together as co-pastors.
 */
export function PastorsSection() {
  return (
    <Band tone="white" prose={false}>
      <FeatureSplit
        photos={['pastors', 'mollyPulpit']}
        captions={['Kevin Kiefer', 'Molly Kiefer']}
        positions={['object-center', 'object-[center_32%]']}
        aspect="aspect-[3/4]"
        reverse
        className="mx-auto max-w-5xl"
      >
        <SectionIntro eyebrow="Meet the pastors" title="Pastors Kevin and Molly Kiefer" />
        <PullQuote attribution="Pastor Kevin Kiefer, Co-Pastor">
          It&rsquo;s a privilege to be able to show our community the goodness of Jesus and how He can change lives.
        </PullQuote>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button href="/about" variant="primary" className="min-h-11 px-6 no-underline !text-white">
            Our story
          </Button>
          <Link
            href="/about/team"
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-800 underline decoration-brand-600/40 underline-offset-4 hover:text-brand-600"
          >
            Meet the team
          </Link>
        </div>
      </FeatureSplit>
    </Band>
  )
}
