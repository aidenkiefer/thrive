import { Button } from '@/components/ui'

interface EventDetailProps {
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  location: string | null
  venue: string | null
  churchsuiteFormUrl: string | null
  // For one_time events:
  startDatetime: string | null
  endDatetime: string | null
  // For recurring events:
  recurrenceDescription: string | null
  typicalTime: string | null
  nextOccurrenceStart: string | null
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function EventDetail({
  name, description, category, imageUrl, location, venue,
  churchsuiteFormUrl, startDatetime, endDatetime,
  recurrenceDescription, typicalTime, nextOccurrenceStart,
}: EventDetailProps) {
  const displayDate = startDatetime
    ? `${formatFullDate(startDatetime)} at ${formatTime(startDatetime)}`
    : nextOccurrenceStart
      ? `Next: ${formatFullDate(nextOccurrenceStart)} at ${formatTime(nextOccurrenceStart)}`
      : recurrenceDescription
        ? recurrenceDescription
        : null

  return (
    <article>
      {imageUrl && (
        <div className="aspect-video max-w-3xl rounded-lg overflow-hidden mb-6">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}

      {category && (
        <span className="inline-block text-xs font-medium text-brand-600 uppercase tracking-wide mb-2">
          {category}
        </span>
      )}

      {displayDate && (
        <p className="text-brand-800 font-medium mb-2">{displayDate}</p>
      )}

      {(location || venue) && (
        <p className="text-sm text-neutral-600 mb-4">
          {[venue, location].filter(Boolean).join(' · ')}
        </p>
      )}

      {recurrenceDescription && !startDatetime && (
        <p className="text-sm text-neutral-600 mb-4">
          Recurs: {recurrenceDescription}
          {typicalTime && ` at ${typicalTime}`}
        </p>
      )}

      {description && (
        <div className="max-w-prose mt-6">
          <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      )}

      {churchsuiteFormUrl && (
        <div className="mt-8">
          <Button href={churchsuiteFormUrl} variant="primary">
            Sign Up / Register
          </Button>
        </div>
      )}
    </article>
  )
}
