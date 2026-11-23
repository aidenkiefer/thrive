/**
 * The church's clock. Pure (no React, Next, or Supabase imports), so server
 * validation, public pages, and client components share one definition.
 */

export const CHURCH_TIME_ZONE = 'America/Chicago'

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
