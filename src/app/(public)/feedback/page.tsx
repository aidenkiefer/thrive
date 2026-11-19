import type { Metadata } from 'next'
import { Container, PageHeader, Section } from '@/components/ui'
import { FeedbackForm } from '@/components/forms'

export const metadata: Metadata = {
  title: 'Website feedback',
  description: 'Report a website problem or suggest an improvement.',
}

function pagePathFromSearch(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.length > 200 || /\s/.test(trimmed)) return ''
  return trimmed
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const initialPagePath = pagePathFromSearch(params.page)

  return (
    <Section background="light">
      <Container>
        <PageHeader
          title="Website feedback"
          description="Report a problem with this website or suggest an improvement. This is for the site itself, not general church questions."
        />
        <div className="mt-10 max-w-xl">
          <FeedbackForm initialPagePath={initialPagePath} />
        </div>
      </Container>
    </Section>
  )
}
