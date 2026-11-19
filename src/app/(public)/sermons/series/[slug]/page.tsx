import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSermonsBySeriesSlug, getSermonSeries } from '@/lib/queries'
import type { Sermon, SermonSeries } from '@/lib/queries/sermons'
import { SermonCard } from '@/components/sermons/SermonCard'
import { BackLink } from '@/components/ui'
import { Band, PageHero, PendingNote, safely } from '@/components/content'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

const loadAllSeries = cache(() => safely<SermonSeries[]>('sermons:series-all', () => getSermonSeries(), []))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const allSeries = await loadAllSeries()
  const series = allSeries.find(s => s.slug === slug)
  if (!series) return {}
  return {
    title: series.title,
    description: series.description ?? undefined,
    alternates: { canonical: `/sermons/series/${slug}` },
  }
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params

  // Fetch both in parallel
  const [sermons, allSeries] = await Promise.all([
    safely<Sermon[]>(`sermons:series:${slug}`, () => getSermonsBySeriesSlug(slug), []),
    loadAllSeries(),
  ])

  const series = allSeries.find(s => s.slug === slug)
  if (!series) notFound()

  return (
    <>
      <PageHero eyebrow="Sermon series" title={series.title} lead={series.description ?? undefined} />
      <Band tone="light" prose={false}>
        <BackLink href="/sermons/series" className="mb-8 min-h-11">All series</BackLink>
        <h2 className="sr-only">Messages in this series</h2>

        {sermons.length === 0 ? (
          <PendingNote title="Messages are being added" className="max-w-2xl">
            <p>No messages have been published in this series yet.</p>
          </PendingNote>
        ) : (
          <>
            <p className="mb-6 text-sm text-neutral-600">{sermons.length} message{sermons.length !== 1 ? 's' : ''}</p>
            <div className="reveal-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map(sermon => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          </>
        )}
      </Band>
    </>
  )
}
