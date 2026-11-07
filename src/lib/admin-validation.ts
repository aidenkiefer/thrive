/**
 * Server-side validation for admin writes. Pure functions (no Next or Supabase
 * imports) so they can be unit-tested.
 *
 * Two kinds of rule:
 * - Format rules (always): a value that is present must be valid: real dates,
 *   end after start, HTTPS links, Chicago offsets that match the calendar.
 * - Publish rules (only when publishing): required fields a visitor-facing page
 *   needs. Drafts may be saved incomplete, within the database's NOT NULL columns.
 */

import { isApprovedFormUrl } from './form-urls'

export const CHURCH_TIME_ZONE = 'America/Chicago'

/** A validation failure the admin can fix. Shown in the form, not the error page. */
export class AdminInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminInputError'
  }
}

export function isAdminInputError(error: unknown): error is AdminInputError {
  return error instanceof AdminInputError || (error instanceof Error && error.name === 'AdminInputError')
}

export function fail(message: string): never {
  throw new AdminInputError(message)
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/i
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function validCalendarDate(year: number, month: number, day: number): boolean {
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
}

export function requireText(value: string, label: string): string {
  if (!value.trim()) fail(`${label} is required`)
  return value.trim()
}

export function requireSlug(value: string): string {
  const slug = value.trim().toLowerCase()
  if (!SLUG.test(slug)) fail('URL slug is required and may use only lowercase letters, numbers, and single hyphens')
  return slug
}

/** Wall-clock "YYYY-MM-DDTHH:MM" for an instant in the church's time zone. */
export function chicagoWallTime(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHURCH_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant)
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Chicago's UTC offset ("-05:00" or "-06:00") at an instant. */
export function chicagoOffset(instant: Date): string {
  const wall = chicagoWallTime(instant)
  const asUtc = Date.parse(`${wall}:00Z`)
  const minutes = Math.round((asUtc - Math.floor(instant.getTime() / 60000) * 60000) / 60000)
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

/**
 * Parses an ISO date-time with an explicit offset and returns it as UTC ISO.
 * Empty input returns null. A non-UTC offset must be the correct Chicago offset
 * for that date (catches -05:00 typed for a winter date, or -06:00 in summer).
 */
export function parseInstant(raw: string, label: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const match = INSTANT.exec(value)
  if (!match) fail(`${label} must look like 2026-12-05T09:00:00-06:00 (date, time, and timezone offset)`)
  const [, y, mo, d, h, mi, s, offset] = match
  if (!validCalendarDate(Number(y), Number(mo), Number(d)) || Number(h) > 23 || Number(mi) > 59 || Number(s ?? 0) > 59) {
    fail(`${label} is not a real date and time`)
  }
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) fail(`${label} is not a real date and time`)
  const isUtc = /^(z|[+-]00:00)$/i.test(offset)
  if (!isUtc && chicagoWallTime(instant) !== value.slice(0, 16)) {
    const expected = chicagoOffset(new Date(Date.parse(`${value.slice(0, 16)}:00Z`) + 6 * 3600_000))
    fail(`${label}: on ${value.slice(0, 10)} Chicago time is UTC${expected}, but the offset entered is ${offset}`)
  }
  return instant.toISOString()
}

export function requireInstant(raw: string, label: string): string {
  return parseInstant(raw, label) ?? fail(`${label} is required`)
}

/** Parses a calendar date (YYYY-MM-DD). Empty input returns null. */
export function parseDateOnly(raw: string, label: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const match = DATE_ONLY.exec(value)
  if (!match || !validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
    fail(`${label} must be a real date (YYYY-MM-DD)`)
  }
  return value
}

export function httpsUrl(raw: string, label: string): string | null {
  const value = raw.trim()
  if (!value) return null
  let url: URL
  try { url = new URL(value) } catch { fail(`${label} is not a valid URL`) }
  if (url.protocol !== 'https:') fail(`${label} must use HTTPS`)
  return value
}

/** An HTTPS URL or a site path such as /plan-a-visit. */
export function siteOrHttpsUrl(raw: string, label: string): string | null {
  const value = raw.trim()
  if (!value) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return httpsUrl(value, label)
}

export function assertEndAfterStart(start: string | null, end: string | null, allowEqual: boolean): void {
  if (!start || !end) return
  if (allowEqual ? end < start : end <= start) fail('End must be after start')
}

/** Throws one message listing everything that blocks publishing. */
export function assertPublishable(kind: string, problems: string[]): void {
  if (problems.length) fail(`Can't publish this ${kind} yet: ${problems.join('; ')}. Uncheck Published to save it as a draft.`)
}

const blank = (value: string | null | undefined) => !value || !value.trim()

export function announcementPublishProblems(
  row: { body: string | null; cta_text: string | null; cta_url: string | null; expires_at: string | null },
  now: Date,
): string[] {
  const problems: string[] = []
  if (blank(row.body)) problems.push('add body text')
  if (blank(row.cta_text) !== blank(row.cta_url)) problems.push('a button needs both text and a URL')
  if (row.expires_at && new Date(row.expires_at) <= now) problems.push('the expiry date has already passed')
  return problems
}

export function sermonPublishProblems(row: {
  speaker_id: string | null
  youtube_url: string | null; video_url: string | null; audio_url: string | null
}): string[] {
  const problems: string[] = []
  if (!row.speaker_id) problems.push('choose a speaker')
  if (blank(row.youtube_url) && blank(row.video_url) && blank(row.audio_url)) problems.push('add a YouTube, video, or audio URL')
  return problems
}

export function oneTimeEventPublishProblems(row: { description: string | null; short_summary: string | null }): string[] {
  return blank(row.description) && blank(row.short_summary) ? ['add a description or short summary'] : []
}

export function recurringEventPublishProblems(row: {
  description: string | null; short_summary: string | null
  recurrence_description: string | null; typical_time: string | null
}): string[] {
  const problems: string[] = []
  if (blank(row.description) && blank(row.short_summary)) problems.push('add a description or short summary')
  if (blank(row.recurrence_description)) problems.push('add a schedule description (for example "Sundays")')
  if (blank(row.typical_time)) problems.push('add a typical time (for example "8:30 AM")')
  return problems
}

/**
 * Publish rule for any signup-form field (`churchsuite_form_url`): only
 * ChurchSuite or Google Forms links can go live. Drafts may hold any HTTPS link.
 */
export function formUrlPublishProblems(url: string | null | undefined, label = 'Signup form URL'): string[] {
  return !blank(url) && !isApprovedFormUrl(url)
    ? [`${label} must be a ChurchSuite (churchsuite.com) or Google Forms (docs.google.com/forms or forms.gle) link`]
    : []
}
