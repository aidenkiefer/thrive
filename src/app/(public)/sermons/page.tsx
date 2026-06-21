import { getSermons } from '@/lib/queries'
import { SermonCard } from '@/components/sermons/SermonCard'
import { Section, Container, Heading } from '@/components/ui'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Watch & Listen',
  description: 'Sermons and messages from Thrive Vineyard Church.',
}

export default async function SermonsPage() {
  const sermons = await getSermons()

  return (
    <Section background="light">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <Heading level="h1">Watch &amp; Listen</Heading>
          <Link href="/sermons/series" className="text-sm font-medium text-brand-800 hover:text-brand-600 transition-colors">
            Browse Series →
          </Link>
        </div>

        {sermons.length === 0 ? (
          <p className="text-neutral-600">No sermons available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sermons.map(sermon => (
              <SermonCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
