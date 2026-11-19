import type { Metadata } from 'next'
import { compilePageMdx } from '@/components/content/compile-page'
import { PageHero } from '@/components/content/PageHero'
import { getMdxContent } from '@/lib/mdx'
import { EmailButton } from '../ContactDetails'
import { pageMetadata } from '@/components/seo/metadata'

export const revalidate = 60

export const metadata: Metadata = pageMetadata({
  title: 'Our Team',
  description: 'Meet the pastors, staff, and leaders of Thrive Vineyard Church in Palatine, IL.',
  path: '/about/team',
})

export default async function TeamPage() {
  const { content } = await compilePageMdx({
    source: getMdxContent('team.mdx'),
    components: { EmailButton },
  })

  return (
    <>
      <PageHero eyebrow="About us" title="Our team" photo="prayer" />
      {content}
    </>
  )
}
