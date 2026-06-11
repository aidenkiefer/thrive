// Google Ads / campaign landing pages — root-level catch-all
// Data: landing_pages table by slug
// Named routes (sermons, events, groups, etc.) take priority over this catch-all.
// See: docs/05-content-models.md, docs/03-information-architecture.md

import { notFound } from 'next/navigation'

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

  // TODO: Fetch from landing_pages table where slug = slug and published_at IS NOT NULL
  // If not found: notFound()

  return (
    <div>
      {/* TODO: Hero (heading, subheading, hero image) */}
      {/* TODO: Body content */}
      {/* TODO: Single CTA button (cta_text → cta_url / churchsuite_form_url) */}
      {/* TODO: Pull linked entity data if linked_entity_type is set */}
      <h1>Landing page: {slug}</h1>
    </div>
  )
}
