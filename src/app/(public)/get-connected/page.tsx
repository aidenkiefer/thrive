// Get Connected: NEW route (same path as the legacy WordPress page, so no redirect needed).
// Copy lives in content/pages/get-connected.mdx.
// Source: docs/audit/2026-11/pages/get-connected.md
import type { Metadata } from 'next'
import { compilePageMdx } from '@/components/content/compile-page'
import { getMdxContent } from '@/lib/mdx'
import { PageHero } from '@/components/content/PageHero'
import { ServiceTimesLines } from './ServiceTimesLines'
import { pageMetadata } from '@/components/seo/metadata'

export const metadata: Metadata = pageMetadata({
  title: 'Get Connected',
  description:
    'Find a group, pre-register your kids, or let us know if you have any questions. Thrive Vineyard Church, Palatine, IL.',
  path: '/get-connected',
})

export default async function GetConnectedPage() {
  const { content } = await compilePageMdx({
    source: getMdxContent('get-connected.mdx'),
    components: { ServiceTimesLines },
  })

  return (
    <>
      {/* Source: audit get-connected.md ("Contact Us", "Find a Group, pre-register your kids...") */}
      <PageHero
        photo="water"
        eyebrow="Contact us"
        title="Get connected"
        lead="Find a Group, pre-register your kids, or let us know if you have any questions. We’ll be in touch shortly!"
      />
      {content}
    </>
  )
}
