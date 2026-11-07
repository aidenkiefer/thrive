import type { Metadata } from 'next'
import { compileMDX } from 'next-mdx-remote/rsc'
import { Container, Section } from '@/components/ui'
import { getMdxContent } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Kids',
  description: 'Kids are the Future!',
}

export default async function KidsYouthPage() {
  const { content } = await compileMDX({
    source: getMdxContent('kids-youth.mdx'),
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
