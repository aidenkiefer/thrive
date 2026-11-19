import type { Metadata } from 'next'
import { compilePageMdx } from '@/components/content/compile-page'
import { PageHero } from '@/components/content/PageHero'
import { getMdxContent } from '@/lib/mdx'
import { ContactDetails, EmailLink } from './ContactDetails'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'The story of Thrive Vineyard Church, a Vineyard church plant that began in Palatine, IL in August 2009.',
}

export default async function AboutPage() {
  const { content } = await compilePageMdx({
    source: getMdxContent('about.mdx'),
    components: { ContactDetails, EmailLink },
  })

  return (
    <>
      {/* Source: docs/audit/2026-11/pages/about.md ("Our History") */}
      <PageHero
        eyebrow="About us"
        title="Our story"
        lead="Thrive Vineyard Church began in August of 2009, in the living room of Kevin and Molly Kiefer’s home in Palatine, IL."
        photo="worship"
      />
      {content}
    </>
  )
}
