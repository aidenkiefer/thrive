import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEventBySlug } from '@/lib/queries'
import { EventDetail } from '@/components/events/EventDetail'
import { BackLink } from '@/components/ui'
import { Band, PageHero, safely } from '@/components/content'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL } from '@/components/seo/church'
import { buildEventJsonLd } from '@/components/seo/event'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

const emptyEvent = { event: null, type: null, nextOccurrence: null } as Awaited<ReturnType<typeof getEventBySlug>>
const loadEvent = cache((slug: string) => safely(`events:${slug}`, () => getEventBySlug(slug), emptyEvent))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { event } = await loadEvent(slug)
  if (!event) return {}
  return {
    title: ('seo_title' in event ? event.seo_title : null) ?? event.name,
    description: ('seo_description' in event ? event.seo_description : null) ?? undefined,
    alternates: { canonical: `/events/${slug}` },
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const { event, type, nextOccurrence } = await loadEvent(slug)
  if (!event) notFound()

  const isOneTime = type === 'one_time'
  const isRecurring = type === 'recurring'

  // Recurring events have no start of their own; the next non-cancelled occurrence
  // (already fetched) stands in, and the builder returns null when there is none.
  const jsonLd = buildEventJsonLd(
    {
      name: event.name,
      startDatetime: isOneTime && 'start_datetime' in event ? event.start_datetime : nextOccurrence?.start_datetime,
      endDatetime: isOneTime && 'end_datetime' in event ? event.end_datetime : nextOccurrence?.end_datetime,
      shortSummary: event.short_summary,
      description: event.description,
      featuredImageUrl: event.featured_image_url,
      venue: event.venue,
      location: event.location,
    },
    `${SITE_URL}/events/${slug}`,
  )

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <PageHero eyebrow={event.category || 'Event'} title={event.name} />
      <Band tone="white" prose={false}>
        <BackLink href="/events" className="mb-8 min-h-11">All events</BackLink>
        <EventDetail
          name={event.name}
          description={event.description}
          category={event.category}
          imageUrl={event.featured_image_url}
          location={event.location}
          venue={event.venue}
          churchsuiteFormUrl={event.churchsuite_form_url}
          externalUrl={event.external_url}
          startDatetime={isOneTime && 'start_datetime' in event ? event.start_datetime : null}
          endDatetime={isOneTime && 'end_datetime' in event ? event.end_datetime : null}
          recurrenceDescription={isRecurring && 'recurrence_description' in event ? event.recurrence_description : null}
          typicalTime={isRecurring && 'typical_time' in event ? event.typical_time : null}
          nextOccurrenceStart={nextOccurrence?.start_datetime ?? null}
        />
      </Band>
    </>
  )
}
