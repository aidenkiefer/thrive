import Link from 'next/link'
import { Section, Container, Heading, Card } from '@/components/ui'

interface OneTimeEvent {
  slug: string
  name: string
  short_summary: string | null
  start_datetime: string
  featured_image_url: string | null
}

interface EventOccurrence {
  start_datetime: string
  location: string | null
  recurring_event: {
    name: string
    slug: string
    short_summary: string | null
    featured_image_url: string | null
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function UpcomingEventsSection({
  oneTime,
  occurrences,
}: {
  oneTime: OneTimeEvent[]
  occurrences: EventOccurrence[]
}) {
  const allEvents = [
    ...oneTime.map((e) => ({
      slug: e.slug,
      name: e.name,
      summary: e.short_summary,
      date: e.start_datetime,
      image: e.featured_image_url,
    })),
    ...occurrences.map((o) => ({
      slug: o.recurring_event.slug,
      name: o.recurring_event.name,
      summary: o.recurring_event.short_summary,
      date: o.start_datetime,
      image: o.recurring_event.featured_image_url,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  return (
    <Section background="white">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <Heading level="h2">Upcoming Events</Heading>
          <Link
            href="/events"
            className="text-sm font-medium text-brand-800 hover:text-brand-600 transition-colors"
          >
            View all →
          </Link>
        </div>
        {allEvents.length === 0 ? (
          <p className="text-neutral-600">No upcoming events. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allEvents.map((event, i) => (
              <Card
                key={`${event.slug}-${i}`}
                href={`/events/${event.slug}`}
                title={event.name}
                description={
                  formatDate(event.date) + (event.summary ? ` · ${event.summary}` : '')
                }
                imageUrl={event.image ?? undefined}
                imageAlt={event.name}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
