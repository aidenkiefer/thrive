import Link from 'next/link'
import { Badge } from '@/components/ui'
import { CalendarIcon } from '@/components/content/icons'
import { CardImage } from './CardImage'

interface EventCardProps {
  slug: string
  name: string
  date: string          // ISO datetime string
  summary: string | null
  imageUrl: string | null
  category: string | null
  location: string | null
  /** 'list' lays the card out horizontally from the sm breakpoint. Default 'grid'. */
  layout?: 'grid' | 'list'
}

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago'
  })
}
function formatEventTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago'
  })
}

export function EventCard({ slug, name, date, summary, imageUrl, category, location, layout = 'grid' }: EventCardProps) {
  const list = layout === 'list'
  return (
    <Link
      href={`/events/${slug}`}
      className={`group flex overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 motion-lift hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
        list ? 'flex-col sm:flex-row' : 'h-full flex-col'
      }`}
    >
      <div className={`relative aspect-[3/2] overflow-hidden bg-brand-100 ${list ? 'sm:w-64 sm:shrink-0 sm:aspect-auto sm:min-h-40' : ''}`}>
        {imageUrl ? (
          <CardImage
            src={imageUrl}
            sizes={list ? '(min-width: 640px) 256px, 100vw' : undefined}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-accent-50 text-brand-600">
            <CalendarIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        {category && (
          <div><Badge>{category}</Badge></div>
        )}
        <h3 className={`line-clamp-2 font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800 ${category ? 'mt-3' : ''}`}>
          {name}
        </h3>
        <p className="mt-2 text-sm font-medium text-brand-800">
          {formatEventDate(date)} · {formatEventTime(date)}
        </p>
        {location && <p className="mt-1 text-sm text-neutral-600">{location}</p>}
        {summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">{summary}</p>}
      </div>
    </Link>
  )
}
