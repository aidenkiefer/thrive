import { CalendarIcon, PinIcon } from '@/components/content/icons'
import { CardImage } from './CardImage'
import { SignupPanel } from '@/components/signup/SignupPanel'

interface EventDetailProps {
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  location: string | null
  venue: string | null
  churchsuiteFormUrl: string | null
  externalUrl: string | null
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
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago'
  })
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' })
}

export function EventDetail({
  name, imageUrl, location, venue,
  churchsuiteFormUrl, externalUrl, startDatetime,
  recurrenceDescription, typicalTime, nextOccurrenceStart, description,
}: EventDetailProps) {
  const displayDate = startDatetime
    ? `${formatFullDate(startDatetime)} at ${formatTime(startDatetime)}`
    : nextOccurrenceStart
      ? `Next: ${formatFullDate(nextOccurrenceStart)} at ${formatTime(nextOccurrenceStart)}`
      : recurrenceDescription
        ? recurrenceDescription
        : null
  const place = [venue, location].filter(Boolean).join(' · ')
  const recurs = recurrenceDescription && !startDatetime
    ? `Recurs: ${recurrenceDescription}${typicalTime ? ` at ${typicalTime}` : ''}`
    : null
  const moreUrl = externalUrl && externalUrl !== churchsuiteFormUrl ? externalUrl : null
  const hasFacts = Boolean(displayDate || place || recurs)
  // A form URL was intended when the field is non-empty, even if it's not yet a
  // valid responder link (the panel then shows a pending state).
  const hasIntendedForm = typeof churchsuiteFormUrl === 'string' && churchsuiteFormUrl.trim().length > 0
  const showSignup = hasIntendedForm || Boolean(moreUrl)

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:items-start">
      <div className="min-w-0">
        {imageUrl && (
          <div className="relative mb-8 aspect-[3/2] max-w-3xl overflow-hidden rounded-2xl bg-brand-100 ring-1 ring-black/5">
            <CardImage src={imageUrl} sizes="(min-width: 1024px) 60vw, 100vw" />
          </div>
        )}
        {description ? (
          <div className="max-w-prose">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">About this event</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">{description}</p>
          </div>
        ) : (
          <p className="max-w-prose leading-relaxed text-neutral-600">More details about this event are coming soon.</p>
        )}
      </div>

      {(hasFacts || showSignup) && (
        <aside className="rounded-2xl bg-neutral-100 p-6 ring-1 ring-black/5 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-neutral-950">Event details</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {displayDate && (
              <div className="flex gap-3">
                <dt className="sr-only">When</dt>
                <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <dd className="font-medium text-brand-800">{displayDate}</dd>
              </div>
            )}
            {place && (
              <div className="flex gap-3">
                <dt className="sr-only">Where</dt>
                <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <dd className="text-neutral-700">{place}</dd>
              </div>
            )}
            {recurs && <div><dt className="sr-only">Recurrence</dt><dd className="text-neutral-600">{recurs}</dd></div>}
          </dl>
          {showSignup && (
            <SignupPanel
              kind="event"
              entityName={name}
              formUrl={churchsuiteFormUrl}
              moreUrl={moreUrl}
              expectSignup={hasIntendedForm}
            />
          )}
        </aside>
      )}
    </article>
  )
}
