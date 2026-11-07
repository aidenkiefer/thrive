import type { Metadata } from 'next'
import { compileMDX } from 'next-mdx-remote/rsc'
import { Container, Section } from '@/components/ui'
import { getMdxContent } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About Thrive Vineyard Church',
}

export default async function AboutPage() {
  const { content } = await compileMDX({
    source: getMdxContent('about.mdx'),
    options: { parseFrontmatter: true },
  })

  return (
    <Section background="white">
      <Container>
        <article className="prose-content mx-auto">{content}</article>
      </Container>
    </Section>
  )
}
