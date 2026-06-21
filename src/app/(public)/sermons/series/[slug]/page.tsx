import { getSermonsBySeriesSlug, getSermonSeries } from '@/lib/queries'
import { SermonCard } from '@/components/sermons/SermonCard'
import { Section, Container, Heading } from '@/components/ui'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const allSeries = await getSermonSeries()
  const series = allSeries.find(s => s.slug === slug)
  if (!series) return {}
  return { title: series.title, description: series.description ?? undefined }
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params

  // Fetch both in parallel
  const [sermons, allSeries] = await Promise.all([
    getSermonsBySeriesSlug(slug),
    getSermonSeries(),
  ])

  const series = allSeries.find(s => s.slug === slug)
  if (!series) notFound()

  return (
    <Section background="light">
      <Container>
        <div className="mb-4">
          <Link href="/sermons/series" className="text-sm text-brand-600 hover:text-brand-800 transition-colors">
            ← All series
          </Link>
        </div>

        <Heading level="h1" className="mb-2">{series.title}</Heading>
        {series.description && (
          <p className="text-neutral-600 max-w-prose mb-8">{series.description}</p>
        )}

        {sermons.length === 0 ? (
          <p className="text-neutral-600">No sermons in this series yet.</p>
        ) : (
          <>
            <p className="text-sm text-neutral-600 mb-6">{sermons.length} message{sermons.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sermons.map(sermon => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          </>
        )}
      </Container>
    </Section>
  )
}
