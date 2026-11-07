import Link from 'next/link'
import { getUpcomingEvents } from '@/lib/queries'
import { EventCard } from '@/components/events/EventCard'
import { Section, Container, Heading } from '@/components/ui'
import type { Metadata } from 'next'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming events at Thrive Vineyard Church.',
}

type Props = { searchParams: Promise<{ month?: string; view?: string }> }

export default async function EventsPage({ searchParams }: Props) {
  const [{ oneTime, occurrences }, params] = await Promise.all([getUpcomingEvents(), searchParams])
  const allEvents = [
    ...oneTime.filter(e => e.start_datetime).map(e => ({
      slug: e.slug, name: e.name, date: e.start_datetime as string, summary: e.short_summary,
      imageUrl: e.featured_image_url, category: e.category, location: e.location,
    })),
    ...occurrences.map(o => ({
      slug: o.recurring_event.slug, name: o.recurring_event.name, date: o.start_datetime,
      summary: o.recurring_event.short_summary, imageUrl: o.recurring_event.featured_image_url,
      category: o.recurring_event.category, location: o.location ?? o.recurring_event.location,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const availableMonths = [...new Set(allEvents.map(event => event.date.slice(0, 7)))].sort()
  const selectedMonth = availableMonths.includes(params.month || '') ? params.month : ''
  const events = selectedMonth ? allEvents.filter(event => event.date.slice(0, 7) === selectedMonth) : allEvents
  const listView = params.view === 'list'

  return <Section background="light"><Container>
    <Heading level="h1" className="mb-6">Upcoming Events</Heading>
    <p className="mb-6"><a href="/events/calendar" className="text-sm font-medium text-brand-800 underline">Download calendar file</a></p>
    <form method="get" className="mb-8 flex flex-wrap items-end gap-3">
      <label className="text-sm font-medium">Month
        <select name="month" defaultValue={selectedMonth} className="mt-1 block rounded border bg-white px-3 py-2">
          <option value="">All upcoming months</option>
          {availableMonths.map(month => <option key={month} value={month}>{new Date(`${month}-01T12:00:00-06:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Chicago' })}</option>)}
        </select>
      </label>
      {listView && <input type="hidden" name="view" value="list" />}
      <button className="rounded bg-brand-800 px-4 py-2 text-white" type="submit">Filter</button>
      {selectedMonth && <Link href={listView ? '/events?view=list' : '/events'} className="px-2 py-2 text-sm underline">Clear filter</Link>}
      <div className="ml-auto flex gap-3 text-sm">
        <Link href={selectedMonth ? `/events?month=${selectedMonth}` : '/events'} aria-current={!listView ? 'page' : undefined} className={!listView ? 'font-semibold underline' : 'underline'}>Grid</Link>
        <Link href={selectedMonth ? `/events?month=${selectedMonth}&view=list` : '/events?view=list'} aria-current={listView ? 'page' : undefined} className={listView ? 'font-semibold underline' : 'underline'}>List</Link>
      </div>
    </form>
    {events.length === 0 ? <p className="text-neutral-600">No upcoming events in this month.</p> :
      <div className={listView ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'}>
        {events.map((event, i) => <EventCard key={`${event.slug}-${i}`} {...event} />)}
      </div>}
  </Container></Section>
}
