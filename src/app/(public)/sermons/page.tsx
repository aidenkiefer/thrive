import type { Metadata } from 'next'
import { getSermons } from '@/lib/queries'
import type { Sermon } from '@/lib/queries/sermons'
import { SermonCard } from '@/components/sermons/SermonCard'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, PendingNote, SITE, safely } from '@/components/content'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Watch & Listen',
  description: 'Sermons and messages from Thrive Vineyard Church.',
  alternates: { canonical: '/sermons' },
}

export default async function SermonsPage() {
  const sermons = await safely<Sermon[]>('sermons:list', () => getSermons(), [])

  return (
    <>
      <PageHero
        eyebrow="Sermons"
        title="Watch & Listen"
        lead="Messages from Sunday services."
        actions={<LinkButton href="/sermons/series" variant="onDark">Browse series</LinkButton>}
      />
      <Band tone="light" prose={false}>
        <h2 className="sr-only">All messages</h2>
        {sermons.length === 0 ? (
          <PendingNote title="Messages are being added" className="max-w-2xl">
            <p>New messages will appear here. You can also watch on our YouTube channel.</p>
            <div className="mt-4">
              <LinkButton href={SITE.social.youtube}>Visit our YouTube channel</LinkButton>
            </div>
          </PendingNote>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sermons.map(sermon => (
              <SermonCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        )}
      </Band>
    </>
  )
}
