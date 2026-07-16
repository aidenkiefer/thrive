import { getSermonSeries } from '@/lib/queries'
import { BackLink, Container, PageHeader, Section } from '@/components/ui'
import Image from 'next/image'
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
        <div className="mb-10">
          <BackLink href="/sermons">All sermons</BackLink>
          <PageHeader title="Sermon Series" className="mt-5" />
        </div>

        {series.length === 0 ? (
          <p className="text-neutral-600">No series available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map(s => (
              <Link key={s.id} href={`/sermons/series/${s.slug}`}
                className="group block overflow-hidden rounded-lg bg-neutral-0 shadow-sm transition-shadow hover:shadow-md">
                {s.thumbnail_url && (
                  <div className="relative aspect-video">
                    <Image
                      src={s.thumbnail_url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800">{s.title}</h3>
                  {s.description && <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{s.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
