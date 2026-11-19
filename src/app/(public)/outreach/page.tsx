import Link from 'next/link'
import type { Metadata } from 'next'
import { getOutreachItems } from '@/lib/queries/outreach'
import type { Outreach } from '@/lib/queries/outreach'
import { Badge } from '@/components/ui'
import { CardImage } from '@/components/events/CardImage'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, PendingNote, SITE, safely } from '@/components/content'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Outreach',
  description: 'Outreach initiatives at Thrive Vineyard Church.',
  alternates: { canonical: '/outreach' },
}

export default async function OutreachPage() {
  const items = await safely<Outreach[]>('outreach:list', () => getOutreachItems(), [])
  return (
    <>
      <PageHero eyebrow="Serve" title="Outreach" lead="Outreach initiatives at Thrive Vineyard." />
      <Band tone="light" prose={false}>
        <h2 className="sr-only">All outreach initiatives</h2>
        {items.length === 0 ? (
          <PendingNote title="No outreach initiatives are listed right now" className="max-w-2xl">
            <p>Initiatives will appear here as they are published. In the meantime, we would love to hear from you.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <LinkButton href="/get-connected">Get connected</LinkButton>
              <LinkButton href={`mailto:${SITE.email}`} variant="secondary">Email us</LinkButton>
            </div>
          </PendingNote>
        ) : (
          <div className="reveal-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => (
              <Link
                key={item.id}
                href={`/outreach/${item.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 motion-lift hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                {item.featured_image_url && (
                  <div className="relative aspect-[3/2] overflow-hidden bg-brand-100">
                    <CardImage src={item.featured_image_url} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  {item.is_ongoing && <div><Badge tone="accent">Ongoing</Badge></div>}
                  <h3 className={`font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800 ${item.is_ongoing ? 'mt-3' : ''}`}>{item.name}</h3>
                  {item.short_summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{item.short_summary}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Band>
    </>
  )
}
