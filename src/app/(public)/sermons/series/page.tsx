import { getSermonSeries } from '@/lib/queries'
import { Section, Container, Heading } from '@/components/ui'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Sermon Series',
  description: 'Browse sermon series from Thrive Vineyard.',
}

export default async function SeriesListPage() {
  const series = await getSermonSeries()

  return (
    <Section background="light">
      <Container>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/sermons" className="text-sm text-brand-600 hover:text-brand-800 transition-colors">← All sermons</Link>
          <Heading level="h1">Sermon Series</Heading>
        </div>

        {series.length === 0 ? (
          <p className="text-neutral-600">No series available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map(s => (
              <Link key={s.id} href={`/sermons/series/${s.slug}`}
                className="block rounded-lg bg-neutral-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow p-5">
                {s.thumbnail_url && (
                  <img src={s.thumbnail_url} alt={s.title} className="w-full aspect-video object-cover rounded mb-3" />
                )}
                <h3 className="font-display text-lg font-semibold text-neutral-950">{s.title}</h3>
                {s.description && <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{s.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
