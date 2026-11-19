import type { Metadata } from 'next'
import Link from 'next/link'
import { getSermonSeries } from '@/lib/queries'
import type { SermonSeries } from '@/lib/queries/sermons'
import { BackLink } from '@/components/ui'
import { CardImage } from '@/components/events/CardImage'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, PendingNote, SITE, safely } from '@/components/content'
import { PlayIcon } from '@/components/content/icons'
import { pageMetadata } from '@/components/seo/metadata'

export const revalidate = 60

export const metadata: Metadata = pageMetadata({
  title: 'Sermon Series',
  description: 'Browse sermon series from Thrive Vineyard.',
  path: '/sermons/series',
})

export default async function SeriesListPage() {
  const series = await safely<SermonSeries[]>('sermons:series-list', () => getSermonSeries(), [])

  return (
    <>
      <PageHero eyebrow="Watch & Listen" title="Sermon Series" lead="Messages grouped by series." />
      <Band tone="light" prose={false}>
        <BackLink href="/sermons" className="mb-8 min-h-11">All messages</BackLink>
        <h2 className="sr-only">All series</h2>

        {series.length === 0 ? (
          <PendingNote title="Series are being added" className="max-w-2xl">
            <p>Sermon series will appear here. You can also watch on our YouTube channel.</p>
            <div className="mt-4">
              <LinkButton href={SITE.social.youtube}>Visit our YouTube channel</LinkButton>
            </div>
          </PendingNote>
        ) : (
          <div className="reveal-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {series.map(s => (
              <Link
                key={s.id}
                href={`/sermons/series/${s.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 motion-lift hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <div className="relative aspect-video overflow-hidden bg-brand-100">
                  {s.thumbnail_url ? (
                    <CardImage src={s.thumbnail_url} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-accent-50 text-brand-600">
                      <PlayIcon className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 md:p-6">
                  <h3 className="font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800">{s.title}</h3>
                  {s.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{s.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Band>
    </>
  )
}
