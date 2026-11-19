import { SITE } from '../content/site-info'
import { SITE_URL } from './church'

/** The subset of a one-time/recurring event record the builder reads. */
export interface EventJsonLdInput {
  name: string | null | undefined
  /** ISO 8601 start; for recurring events the next upcoming occurrence. */
  startDatetime: string | null | undefined
  endDatetime?: string | null
  shortSummary?: string | null
  description?: string | null
  featuredImageUrl?: string | null
  venue?: string | null
  location?: string | null
}

function isValidDate(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value))
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * schema.org Event, or null when the record lacks a name or a valid start (the page
 * then renders nothing). `location` comes only from the record's own venue/location:
 * events can be held off-site, so the church address is never assumed.
 */
export function buildEventJsonLd(
  event: EventJsonLdInput,
  canonicalUrl: string,
): Record<string, unknown> | null {
  const name = clean(event.name)
  if (!name || !isValidDate(event.startDatetime)) return null

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    startDate: event.startDatetime,
  }

  // An end before the start is as unusable as an unparseable one.
  if (isValidDate(event.endDatetime) && Date.parse(event.endDatetime) >= Date.parse(event.startDatetime)) {
    data.endDate = event.endDatetime
  }

  const description = clean(event.shortSummary) ?? clean(event.description)
  if (description) data.description = description

  data.url = canonicalUrl

  const image = clean(event.featuredImageUrl)
  if (image && isHttpUrl(image)) data.image = image

  data.eventStatus = 'https://schema.org/EventScheduled'
  // eventAttendanceMode is intentionally omitted: no record field says whether an event is in person or online.

  const placeName = [clean(event.venue), clean(event.location)].filter(Boolean).join(', ')
  if (placeName) data.location = { '@type': 'Place', name: placeName }

  data.organizer = { '@type': 'Organization', name: SITE.name, url: SITE_URL }

  return data
}
