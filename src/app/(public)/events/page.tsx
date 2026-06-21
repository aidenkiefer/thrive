import { getUpcomingEvents } from '@/lib/queries'
import { EventCard } from '@/components/events/EventCard'
import { Section, Container, Heading } from '@/components/ui'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming events at Thrive Vineyard Church.',
}

export default async function EventsPage() {
  const { oneTime, occurrences } = await getUpcomingEvents()

  // Merge and sort all upcoming events (skip any one-time events missing a start date)
  const allEvents = [
    ...oneTime
      .filter(e => e.start_datetime !== null)
      .map(e => ({
        slug: e.slug,
        name: e.name,
        date: e.start_datetime as string,
        summary: e.short_summary,
        imageUrl: e.featured_image_url,
        category: e.category,
        location: e.location,
      })),
    ...occurrences.map(o => ({
      slug: o.recurring_event.slug,
      name: o.recurring_event.name,
      date: o.start_datetime,
      summary: o.recurring_event.short_summary,
      imageUrl: o.recurring_event.featured_image_url,
      category: null as string | null,
      location: o.location ?? o.recurring_event.location,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Section background="light">
      <Container>
        <Heading level="h1" className="mb-8">Upcoming Events</Heading>
        {allEvents.length === 0 ? (
          <p className="text-neutral-600">No upcoming events. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((event, i) => (
              <EventCard key={`${event.slug}-${i}`} {...event} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
