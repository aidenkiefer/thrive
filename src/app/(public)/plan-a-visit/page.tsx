// Plan a Visit: MDX-driven page (copy lives in content/pages/plan-a-visit.mdx).
// Source: docs/audit/2026-11/pages/plan-a-visit.md
import type { Metadata } from 'next'
import { compilePageMdx } from '@/components/content/compile-page'
import { getMdxContent } from '@/lib/mdx'
import { PageHero } from '@/components/content/PageHero'
import { ServiceCards, ServiceDetails } from './ServiceCards'
import { pageMetadata } from '@/components/seo/metadata'

export const metadata: Metadata = pageMetadata({
  title: 'Plan Your Visit',
  description:
    'Everything you need to know before your first visit to Thrive Vineyard Church in Palatine, IL.',
  path: '/plan-a-visit',
})

export default async function PlanAVisitPage() {
  const { content } = await compilePageMdx({
    source: getMdxContent('plan-a-visit.mdx'),
    components: { ServiceCards, ServiceDetails },
  })

  return (
    <>
      {/* Source: audit plan-a-visit.md ("Being new isn't easy.") */}
      <PageHero
        photo="worship"
        title="Plan your visit"
        lead="Being new isn’t easy. Here’s what to expect, step by step."
      />
      {content}
    </>
  )
}
