import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui'

interface EventCardProps {
  slug: string
  name: string
  date: string          // ISO datetime string
  summary: string | null
  imageUrl: string | null
  category: string | null
  location: string | null
}

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}
function formatEventTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

export function EventCard({ slug, name, date, summary, imageUrl, category, location }: EventCardProps) {
  return (
    <Link href={`/events/${slug}`} className="group block overflow-hidden rounded-lg bg-neutral-0 shadow-sm transition-shadow hover:shadow-md">
      {imageUrl ? (
        <div className="relative aspect-video">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-brand-100">
          <span className="text-sm font-medium text-brand-600">Event details</span>
        </div>
      )}
      <div className="p-5">
        {category && (
          <Badge>{category}</Badge>
        )}
        <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800">
          {name}
        </h3>
        <p className="mt-2 text-sm font-medium text-brand-800">
          {formatEventDate(date)} · {formatEventTime(date)}
        </p>
        {location && <p className="mt-1 text-xs text-neutral-600">{location}</p>}
        {summary && <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{summary}</p>}
      </div>
    </Link>
  )
}
