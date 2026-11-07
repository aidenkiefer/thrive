import { describe, expect, it } from 'vitest'
import {
  AdminInputError, announcementPublishProblems, assertEndAfterStart, assertPublishable,
  chicagoOffset, chicagoWallTime, httpsUrl, oneTimeEventPublishProblems,
  parseDateOnly, parseInstant, recurringEventPublishProblems, sermonPublishProblems,
  siteOrHttpsUrl,
} from '../src/lib/admin-validation'

describe('Chicago instants across daylight saving changes', () => {
  it.each([
    ['2026-03-08T01:30:00-06:00', '2026-03-08T07:30:00.000Z'],
    ['2026-03-08T03:30:00-05:00', '2026-03-08T08:30:00.000Z'],
    ['2026-11-01T01:30:00-05:00', '2026-11-01T06:30:00.000Z'],
    ['2026-11-01T01:30:00-06:00', '2026-11-01T07:30:00.000Z'],
    ['2026-11-15T14:30:00Z', '2026-11-15T14:30:00.000Z'],
  ])('accepts %s as a distinct real instant', (input, expected) => {
    expect(parseInstant(input, 'Start')).toBe(expected)
  })

  it.each([
    '2026-03-08T02:30:00-06:00', '2026-03-08T02:30:00-05:00',
    '2026-11-15T08:30:00-05:00', '2026-07-01T08:30:00-06:00',
    '2026-02-29T08:30:00-06:00', '2026-11-15T08:30:00',
  ])('rejects a nonexistent time, incorrect offset, or invalid date: %s', input => {
    expect(() => parseInstant(input, 'Start')).toThrow(AdminInputError)
  })

  it.each([
    ['2026-03-08T07:59:00Z', '2026-03-08T01:59', '-06:00'],
    ['2026-03-08T08:00:00Z', '2026-03-08T03:00', '-05:00'],
    ['2026-11-01T06:59:00Z', '2026-11-01T01:59', '-05:00'],
    ['2026-11-01T07:00:00Z', '2026-11-01T01:00', '-06:00'],
  ])('labels %s in church-local time', (input, wall, offset) => {
    expect(chicagoWallTime(new Date(input))).toBe(wall)
    expect(chicagoOffset(new Date(input))).toBe(offset)
  })
})

describe('calendar and range validation', () => {
  it('accepts a leap day and rejects rolled-over calendar dates', () => {
    expect(parseDateOnly('2028-02-29', 'Date')).toBe('2028-02-29')
    expect(() => parseDateOnly('2026-02-29', 'Date')).toThrow(AdminInputError)
    expect(() => parseDateOnly('2026-04-31', 'Date')).toThrow(AdminInputError)
  })
  it('allows absent optional dates for incomplete drafts', () => {
    expect(parseDateOnly('', 'Date')).toBeNull()
    expect(parseInstant(' ', 'Start')).toBeNull()
    expect(() => assertEndAfterStart(null, null, false)).not.toThrow()
  })
  it('rejects reversed ranges and handles equal endpoints explicitly', () => {
    expect(() => assertEndAfterStart('2026-11-08', '2026-11-07', true)).toThrow(AdminInputError)
    expect(() => assertEndAfterStart('2026-11-08', '2026-11-08', false)).toThrow(AdminInputError)
    expect(() => assertEndAfterStart('2026-11-08', '2026-11-08', true)).not.toThrow()
  })
})

describe('publish requirements', () => {
  it('requires announcement copy, paired CTA fields, and a future expiry', () => {
    expect(announcementPublishProblems({ body: '', cta_text: 'Read', cta_url: null, expires_at: '2026-11-06T12:00:00Z' }, new Date('2026-11-07T12:00:00Z'))).toHaveLength(3)
    expect(announcementPublishProblems({ body: 'Approved copy', cta_text: null, cta_url: null, expires_at: null }, new Date('2026-11-07T12:00:00Z'))).toEqual([])
  })
  it('requires a sermon speaker and at least one playable media URL', () => {
    expect(sermonPublishProblems({ speaker_id: null, youtube_url: null, video_url: null, audio_url: null })).toHaveLength(2)
    expect(sermonPublishProblems({ speaker_id: 'test-speaker', youtube_url: null, video_url: null, audio_url: 'https://example.org/audio.mp3' })).toEqual([])
  })
  it('accepts either a description or summary for one-time events', () => {
    expect(oneTimeEventPublishProblems({ description: '', short_summary: null })).toHaveLength(1)
    expect(oneTimeEventPublishProblems({ description: null, short_summary: 'Approved summary' })).toEqual([])
  })
  it('requires recurring-event copy and schedule before publishing', () => {
    expect(recurringEventPublishProblems({ description: null, short_summary: null, recurrence_description: null, typical_time: null })).toHaveLength(3)
    expect(recurringEventPublishProblems({ description: 'Approved copy', short_summary: null, recurrence_description: 'Sundays', typical_time: '8:30 AM' })).toEqual([])
  })
  it('returns actionable draft guidance when publishing is incomplete', () => {
    expect(() => assertPublishable('sermon', ['choose a speaker'])).toThrow('Uncheck Published')
    expect(() => assertPublishable('sermon', [])).not.toThrow()
  })
})

describe('link validation', () => {
  it('allows local CTA routes and HTTPS destinations', () => {
    expect(siteOrHttpsUrl('/plan-a-visit', 'CTA')).toBe('/plan-a-visit')
    expect(httpsUrl('https://example.org/form', 'Form')).toBe('https://example.org/form')
  })
  it.each(['//example.org/form', 'http://example.org/form', 'javascript:alert(1)'])('rejects unsafe external destination %s', input => {
    expect(() => siteOrHttpsUrl(input, 'CTA')).toThrow(AdminInputError)
  })
})
