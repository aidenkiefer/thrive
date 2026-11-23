/**
 * Calendar date math for the shared DatePicker (admin forms and public
 * filters). Pure (no React, Next, or Supabase imports), so components and tests
 * share one implementation.
 *
 * Dates are "YYYY-MM-DD" strings and times "HH:MM" strings, both as Chicago
 * wall-clock values. ISO date strings compare correctly as plain strings, which
 * the range helpers rely on. Timed values serialize to exactly what the admin
 * validators in admin-validation.ts accept, so those stay the source of truth.
 */

import { chicagoOffset, chicagoWallTime } from './church-time'

export type WallDateTime = { date: string; time: string }

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const pad = (n: number) => String(n).padStart(2, '0')

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Splits "YYYY-MM-DD" into numbers; month is 1-based. */
export function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  if (!DATE_ONLY.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const check = new Date(Date.UTC(year, month - 1, day))
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
  return { year, month, day }
}

/** Shifts a date by whole days (calendar math, no time zone involved). */
export function addDays(value: string, days: number): string {
  const parts = parseIsoDate(value)
  if (!parts) return value
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
  return isoDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}

/** Shifts a date by whole months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(value: string, months: number): string {
  const parts = parseIsoDate(value)
  if (!parts) return value
  const first = new Date(Date.UTC(parts.year, parts.month - 1 + months, 1))
  const year = first.getUTCFullYear()
  const month = first.getUTCMonth() + 1
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return isoDate(year, month, Math.min(parts.day, last))
}

/** Sunday-first weeks covering the month; days outside it are null. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (string | null)[] = Array(leading).fill(null)
  for (let day = 1; day <= days; day++) cells.push(isoDate(year, month, day))
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Today's date in Chicago, so "Today" matches the church calendar, not the editor's laptop. */
export function chicagoToday(now = new Date()): string {
  return chicagoWallTime(now).slice(0, 10)
}

/** A stored instant (any offset, usually UTC from Postgres) as Chicago date and time. */
export function instantToWall(value: string | null | undefined): WallDateTime {
  const instant = value ? new Date(value) : null
  if (!instant || Number.isNaN(instant.getTime())) return { date: '', time: '' }
  const wall = chicagoWallTime(instant)
  return { date: wall.slice(0, 10), time: wall.slice(11, 16) }
}

/**
 * The offset parseInstant expects for a Chicago wall time: the zone's offset a
 * few hours later, which lands on the right side of either DST change.
 */
export function wallOffset(date: string, time: string): string {
  return chicagoOffset(new Date(Date.parse(`${date}T${time}:00Z`) + 6 * 3600_000))
}

/** True when the wall time doesn't exist (skipped by the spring-forward change). */
export function isSkippedWallTime(date: string, time: string): boolean {
  const instant = new Date(`${date}T${time}:00${wallOffset(date, time)}`)
  return chicagoWallTime(instant) !== `${date}T${time}`
}

/**
 * The form value for a date and time. Both set gives "YYYY-MM-DDTHH:MM:00-06:00";
 * neither gives "". A half-filled value is passed through as typed so the server
 * rejects it with a message instead of silently saving nothing.
 */
export function serializeWall({ date, time }: WallDateTime): string {
  if (!date && !time) return ''
  if (!date || !time) return date || time
  return `${date}T${time}:00${wallOffset(date, time)}`
}

const CHICAGO_LITERAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?-0[56]:00$/
const TIME_ONLY = /^\d{2}:\d{2}$/

/**
 * The inverse of `serializeValue`: a form or URL value back to date and time.
 * Values already in Chicago offset are read literally (so a just-picked time
 * shows as picked); anything else, such as a UTC instant from Postgres, is
 * converted to Chicago wall time. Half-filled values survive the round trip.
 */
export function parseFormValue(value: string | null | undefined, withTime: boolean): WallDateTime {
  const raw = (value || '').trim()
  if (!raw) return { date: '', time: '' }
  if (DATE_ONLY.test(raw)) return { date: parseIsoDate(raw) ? raw : '', time: '' }
  if (withTime && TIME_ONLY.test(raw)) return { date: '', time: raw }
  const literal = withTime ? CHICAGO_LITERAL.exec(raw) : null
  if (literal) return { date: literal[1], time: literal[2] }
  const wall = instantToWall(raw)
  return withTime ? wall : { date: wall.date, time: '' }
}

/** The value a DatePicker posts or reports: "YYYY-MM-DD", or the timed form from serializeWall. */
export function serializeValue(wall: WallDateTime, withTime: boolean): string {
  return withTime ? serializeWall(wall) : wall.date
}

/** True when a date falls inside the optional inclusive bounds. */
export function isInRange(value: string, min?: string, max?: string): boolean {
  return !(min && value < min) && !(max && value > max)
}

/** Pulls a date inside the optional inclusive bounds. */
export function clampDate(value: string, min?: string, max?: string): string {
  if (min && value < min) return min
  if (max && value > max) return max
  return value
}

/** Last day of the month before / first day of the month after a date. */
export function monthEdges(value: string): { previousEnd: string; nextStart: string } {
  const parts = parseIsoDate(value)
  if (!parts) return { previousEnd: value, nextStart: value }
  return {
    previousEnd: addDays(isoDate(parts.year, parts.month, 1), -1),
    nextStart: addDays(isoDate(parts.year, parts.month, 1), new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate()),
  }
}

/** "-06:00" → "CST", "-05:00" → "CDT", for the zone hint beside the time. */
export function chicagoZoneAbbreviation(offset: string): string {
  return offset === '-05:00' ? 'CDT' : offset === '-06:00' ? 'CST' : `UTC${offset}`
}

/** "Sat, Dec 5, 2026" for a date string, in the church's locale. */
export function formatDateLabel(value: string): string {
  const parts = parseIsoDate(value)
  if (!parts) return value
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)))
}

/** "December 2026" for the calendar heading. */
export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
}
