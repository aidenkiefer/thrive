// Google Ads / campaign landing pages — root-level catch-all
// Data: landing_pages table by slug
// Named routes (sermons, events, groups, etc.) take priority over this catch-all.
// See: docs/05-content-models.md, docs/03-information-architecture.md

import { notFound } from 'next/navigation'
import { Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

// Reserved slugs that cannot be used for landing pages
const RESERVED_SLUGS = [
  'plan-a-visit',
  'sermons',
  'events',
  'groups',
  'kids-youth',
  'outreach',
  'about',
  'give',
  'ministries',
  'admin',
]

type Props = { params: Promise<{ slug: string }> }

export default async function LandingPage({ params }: Props) {
  const { slug } = await params

  if (RESERVED_SLUGS.includes(slug)) {
    notFound()
  }

  return (
    <Section background="light">
      <Container>
        <PageHeader title={slug} />
        <p className="mt-6 max-w-prose text-neutral-600">
          This page is being prepared.
        </p>
      </Container>
    </Section>
  )
}
