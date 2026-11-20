// Kids & Youth: MDX-driven page (copy lives in content/pages/kids-youth.mdx).
// Source: docs/audit/2026-11/pages/kids-youth.md
import type { Metadata } from 'next'
import { compilePageMdx } from '@/components/content/compile-page'
import { getMdxContent } from '@/lib/mdx'
import { PageHero } from '@/components/content/PageHero'
import { pageMetadata } from '@/components/seo/metadata'

export const metadata: Metadata = pageMetadata({
  title: 'Kids & Youth',
  description: 'Kids are the Future! Safe places where kids can grow in their faith and encounter Jesus.',
  path: '/kids-youth',
})

export default async function KidsYouthPage() {
  const { content } = await compilePageMdx({
    source: getMdxContent('kids-youth.mdx'),
  })

  return (
    <>
      {/* Source: audit kids-youth.md ("Kids", "We partner with parents...") */}
      <PageHero
        photo="kidsMinistry"
        photoPosition="object-left"
        title="Kids & youth"
        lead="We partner with parents, creating safe places where kids can grow in their faith and encounter Jesus."
      />
      {content}
    </>
  )
}
