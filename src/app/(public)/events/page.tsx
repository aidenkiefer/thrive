import Link from 'next/link'
import type { Metadata } from 'next'
import { getUpcomingEvents } from '@/lib/queries'
import { EventCard } from '@/components/events/EventCard'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, PendingNote, SITE, safely } from '@/components/content'
import { pageMetadata } from '@/components/seo/metadata'

export const revalidate = 60
export const metadata: Metadata = pageMetadata({
  title: 'Events',
  description: 'Upcoming events at Thrive Vineyard Church.',
  path: '/events',
})

type Props = { searchParams: Promise<{ month?: string; view?: string }> }

const control =
  'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

export default async function EventsPage({ searchParams }: Props) {
  const [{ oneTime, occurrences }, params] = await Promise.all([
    safely('events:upcoming', () => getUpcomingEvents(), { oneTime: [], occurrences: [] }),
    searchParams,
  ])
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
  const hasEvents = allEvents.length > 0

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Upcoming Events"
        lead="Upcoming gatherings at Thrive."
        actions={hasEvents ? <LinkButton href="/events/calendar" variant="onDark" plain>Download calendar file</LinkButton> : undefined}
      />
      <Band tone="light" prose={false}>
        <h2 className="sr-only">Upcoming events</h2>
        {!hasEvents ? (
          <PendingNote title="No upcoming events are published yet" className="max-w-2xl">
            <p>Check back soon, or find out how to connect with us in the meantime.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <LinkButton href="/get-connected">Get connected</LinkButton>
              <LinkButton href={SITE.social.facebook} variant="secondary">Follow us on Facebook</LinkButton>
            </div>
          </PendingNote>
        ) : (
          <>
            <form method="get" className="mb-10 flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium text-neutral-950">
                Month
                <select
                  name="month"
                  defaultValue={selectedMonth}
                  className="mt-1 block min-h-11 min-w-[12rem] max-w-full rounded-md border border-neutral-200 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <option value="">All upcoming months</option>
                  {availableMonths.map(month => <option key={month} value={month}>{new Date(`${month}-01T12:00:00-06:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Chicago' })}</option>)}
                </select>
              </label>
              {listView && <input type="hidden" name="view" value="list" />}
              <button className={`${control} bg-brand-800 text-white hover:bg-brand-600`} type="submit">Filter</button>
              {selectedMonth && <Link href={listView ? '/events?view=list' : '/events'} className={`${control} text-brand-800 underline underline-offset-4 hover:bg-brand-100`}>Clear filter</Link>}
              <div className="ml-auto flex gap-1 rounded-lg bg-white p-1 ring-1 ring-black/5" role="group" aria-label="Layout">
                <Link href={selectedMonth ? `/events?month=${selectedMonth}` : '/events'} aria-current={!listView ? 'page' : undefined} className={`${control} ${!listView ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-brand-100'}`}>Grid</Link>
                <Link href={selectedMonth ? `/events?month=${selectedMonth}&view=list` : '/events?view=list'} aria-current={listView ? 'page' : undefined} className={`${control} ${listView ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-brand-100'}`}>List</Link>
              </div>
            </form>
            {events.length === 0 ? (
              <PendingNote title="No upcoming events in this month" className="max-w-2xl">
                <p>Try another month, or view everything that is coming up.</p>
                <div className="mt-4">
                  <LinkButton href={listView ? '/events?view=list' : '/events'}>View all upcoming events</LinkButton>
                </div>
              </PendingNote>
            ) : (
              <div className={listView ? 'grid grid-cols-1 gap-5' : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'}>
                {events.map((event, i) => <EventCard key={`${event.slug}-${i}`} {...event} layout={listView ? 'list' : 'grid'} />)}
              </div>
            )}
          </>
        )}
      </Band>
    </>
  )
}
