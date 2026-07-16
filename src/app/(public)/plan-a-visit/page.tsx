// Plan a Visit — MDX-driven page
// Source: content/pages/plan-a-visit.mdx
// See: docs/03-information-architecture.md

import { compileMDX } from 'next-mdx-remote/rsc'
import { getMdxContent } from '@/lib/mdx'
import { Section, Container } from '@/components/ui'
import type { Metadata } from 'next'

interface Frontmatter {
  title: string
  description?: string
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Plan Your Visit',
    description:
      'Everything you need to know before your first visit to Thrive Vineyard Church in Palatine, IL.',
  }
}

export default async function PlanAVisitPage() {
  const source = getMdxContent('plan-a-visit.mdx')

  const { content } = await compileMDX<Frontmatter>({
    source,
    options: { parseFrontmatter: true },
  })

  return (
    <Section background="white">
      <Container>
        <article className="prose-content mx-auto">
          {content}
        </article>
      </Container>
    </Section>
  )
}
