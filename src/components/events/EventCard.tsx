import Link from 'next/link'

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
    <Link href={`/events/${slug}`} className="group block rounded-lg bg-neutral-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl ? (
        <div className="aspect-video">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-brand-100 flex items-center justify-center">
          <span className="text-brand-600 text-2xl">📅</span>
        </div>
      )}
      <div className="p-4">
        {category && (
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">{category}</span>
        )}
        <h3 className="font-display text-lg font-semibold text-neutral-950 mt-1 group-hover:text-brand-800 transition-colors line-clamp-2">
          {name}
        </h3>
        <p className="mt-1 text-sm text-brand-800 font-medium">
          {formatEventDate(date)} · {formatEventTime(date)}
        </p>
        {location && <p className="mt-0.5 text-xs text-neutral-600">{location}</p>}
        {summary && <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{summary}</p>}
      </div>
    </Link>
  )
}
