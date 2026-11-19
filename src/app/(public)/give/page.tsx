// Give: MDX-driven page (copy lives in content/pages/give.mdx).
// Source: docs/audit/2026-11/pages/give.md
import type { Metadata } from 'next'
import { compilePageMdx } from '@/components/content/compile-page'
import { getMdxContent } from '@/lib/mdx'
import { PageHero } from '@/components/content/PageHero'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Give',
  description: 'Ways to give to Thrive Vineyard Church: time, talent, and treasure.',
}

export default async function GivePage() {
  const { content } = await compilePageMdx({
    source: getMdxContent('give.mdx'),
  })

  return (
    <>
      {/* Source: audit give.md (heading "Give"; CTA "Give" -> #give-now) */}
      <PageHero
        photo="worship"
        title="Give"
        actions={
          <Button variant="accent" href="#give-now">
            Give now
          </Button>
        }
      />
      {content}
    </>
  )
}
