import Link from 'next/link'
import Image from 'next/image'
import { Band } from '@/components/content/Band'
import { SectionIntro } from '@/components/content/SectionIntro'
import { ArrowRightIcon, CalendarIcon } from '@/components/content/icons'
import { Button } from '@/components/ui'
import type { EventOccurrence, OneTimeEvent } from '@/lib/queries/events'

// Palatine, IL local time so server (UTC) rendering shows the right day and hour.
const TZ = 'America/Chicago'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  })
}

/**
 * Upcoming events. Data props unchanged: every event shown is a canonical record from
 * getUpcomingEvents(); nothing is hardcoded. Empty state links to /events only.
 */
export function UpcomingEventsSection({
  oneTime,
  occurrences,
}: {
  oneTime: OneTimeEvent[]
  occurrences: EventOccurrence[]
}) {
  const allEvents = [
    ...oneTime
      .filter((e): e is OneTimeEvent & { start_datetime: string } => e.start_datetime !== null)
      .map((e) => ({
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
    <Band tone="white" prose={false}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionIntro eyebrow="What's happening" title="Upcoming events" />
        {allEvents.length > 0 ? (
          <Link
            href="/events"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            View all events
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {allEvents.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-brand-600/40 bg-neutral-100 p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-neutral-950">No upcoming events are posted right now</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                Check the events page to see what&rsquo;s coming up at Thrive Vineyard.
              </p>
            </div>
          </div>
          <Button href="/events" variant="primary" className="min-h-11 px-6">
            Go to events
          </Button>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {allEvents.map((event, i) => (
            <li key={`${event.slug}-${i}`}>
              <Link
                href={`/events/${event.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
              >
                {event.image ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-100">
                    <Image
                      src={event.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-brand-100 text-brand-600">
                    <CalendarIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                    {formatDate(event.date)} · {formatTime(event.date)}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-neutral-950">{event.name}</h3>
                  {event.summary ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{event.summary}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Band>
  )
}
