import { getEventBySlug } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { EventDetail } from '@/components/events/EventDetail'
import { Section, Container, Heading } from '@/components/ui'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { event } = await getEventBySlug(slug)
  if (!event) return {}
  return {
    title: ('seo_title' in event ? event.seo_title : null) ?? event.name,
    description: ('seo_description' in event ? event.seo_description : null) ?? undefined,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const { event, type, nextOccurrence } = await getEventBySlug(slug)
  if (!event) notFound()

  const isOneTime = type === 'one_time'
  const isRecurring = type === 'recurring'

  return (
    <Section background="white">
      <Container>
        <div className="mb-4">
          <Link href="/events" className="text-sm text-brand-600 hover:text-brand-800 transition-colors">
            ← Back to events
          </Link>
        </div>

        <Heading level="h1" className="mb-6">{event.name}</Heading>

        <EventDetail
          name={event.name}
          description={event.description}
          category={event.category}
          imageUrl={event.featured_image_url}
          location={event.location}
          venue={event.venue}
          churchsuiteFormUrl={event.churchsuite_form_url}
          startDatetime={isOneTime && 'start_datetime' in event ? event.start_datetime : null}
          endDatetime={isOneTime && 'end_datetime' in event ? event.end_datetime : null}
          recurrenceDescription={isRecurring && 'recurrence_description' in event ? event.recurrence_description : null}
          typicalTime={isRecurring && 'typical_time' in event ? event.typical_time : null}
          nextOccurrenceStart={nextOccurrence?.start_datetime ?? null}
        />
      </Container>
    </Section>
  )
}
