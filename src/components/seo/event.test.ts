import { describe, expect, it } from 'vitest'
import { SITE } from '../content/site-info'
import { buildEventJsonLd, type EventJsonLdInput } from './event'

// Test fixtures only: placeholder values, not ministry data.
const URL_FIXTURE = 'https://example.test/events/fixture-event'
const base: EventJsonLdInput = {
  name: 'Fixture Event',
  startDatetime: '2030-01-05T19:00:00.000Z',
  endDatetime: '2030-01-05T21:00:00.000Z',
  shortSummary: 'Fixture summary',
  description: 'Fixture long description',
  featuredImageUrl: 'https://example.test/fixture.jpg',
  venue: 'Fixture Hall',
  location: 'Fixture City',
}

describe('buildEventJsonLd', () => {
  it('builds the expected Event for a valid record', () => {
    expect(buildEventJsonLd(base, URL_FIXTURE)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Fixture Event',
      startDate: '2030-01-05T19:00:00.000Z',
      endDate: '2030-01-05T21:00:00.000Z',
      description: 'Fixture summary',
      url: URL_FIXTURE,
      image: 'https://example.test/fixture.jpg',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: 'Fixture Hall, Fixture City' },
      organizer: { '@type': 'Organization', name: SITE.name, url: 'https://thrivevineyard.com' },
    })
  })

  it('returns null without a name or with a bad/missing start date', () => {
    expect(buildEventJsonLd({ ...base, name: '  ' }, URL_FIXTURE)).toBeNull()
    expect(buildEventJsonLd({ ...base, name: null }, URL_FIXTURE)).toBeNull()
    expect(buildEventJsonLd({ ...base, startDatetime: 'not-a-date' }, URL_FIXTURE)).toBeNull()
    expect(buildEventJsonLd({ ...base, startDatetime: null }, URL_FIXTURE)).toBeNull()
  })

  it('omits location when the record has no venue or location', () => {
    const data = buildEventJsonLd({ ...base, venue: null, location: '' }, URL_FIXTURE)
    expect(data).not.toBeNull()
    expect(data).not.toHaveProperty('location')
  })

  it('omits endDate when invalid or before the start', () => {
    expect(buildEventJsonLd({ ...base, endDatetime: 'nope' }, URL_FIXTURE)).not.toHaveProperty('endDate')
    expect(buildEventJsonLd({ ...base, endDatetime: '2029-01-01T00:00:00.000Z' }, URL_FIXTURE)).not.toHaveProperty('endDate')
    expect(buildEventJsonLd({ ...base, endDatetime: null }, URL_FIXTURE)).not.toHaveProperty('endDate')
  })

  it('omits optional fields that are absent or unusable', () => {
    const data = buildEventJsonLd(
      { ...base, shortSummary: null, description: null, featuredImageUrl: 'javascript:alert(1)' },
      URL_FIXTURE,
    )
    expect(data).not.toHaveProperty('description')
    expect(data).not.toHaveProperty('image')
  })

  it('falls back to the description when there is no summary', () => {
    expect(buildEventJsonLd({ ...base, shortSummary: null }, URL_FIXTURE)?.description).toBe('Fixture long description')
  })
})
