import { createClient } from '@/lib/supabase/server'

const escapeText = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n')

const icalDate = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

function eventLines(item: { slug: string; uid?: string; name: string; description?: string | null; location?: string | null; start: string; end?: string | null }) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${item.uid || `${item.slug}@thrivevineyard.com`}`,
    `DTSTAMP:${icalDate(new Date().toISOString())}`,
    `DTSTART:${icalDate(item.start)}`,
  ]
  if (item.end) lines.push(`DTEND:${icalDate(item.end)}`)
  lines.push(`SUMMARY:${escapeText(item.name)}`)
  if (item.description) lines.push(`DESCRIPTION:${escapeText(item.description)}`)
  if (item.location) lines.push(`LOCATION:${escapeText(item.location)}`)
  lines.push(`URL:https://thrivevineyard.com/events/${item.slug}`, 'END:VEVENT')
  return lines.join('\r\n')
}

export async function GET() {
  const db = await createClient()
  const now = new Date().toISOString()
  const [oneTime, occurrences] = await Promise.all([
    db.from('one_time_events').select('slug,name,description,location,start_datetime,end_datetime').not('published_at', 'is', null).gt('start_datetime', now).order('start_datetime'),
    db.from('event_occurrences').select('start_datetime,end_datetime,location,recurring_event:recurring_events(slug,name,description,location,published_at)').eq('cancelled', false).gt('start_datetime', now).order('start_datetime'),
  ])
  if (oneTime.error || occurrences.error) return new Response('Unable to load calendar events', { status: 500 })
  type OneTime = { slug: string; name: string; description: string | null; location: string | null; start_datetime: string; end_datetime: string | null }
  type Joined = { start_datetime: string; end_datetime: string | null; location: string | null; recurring_event: { slug: string; name: string; description: string | null; location: string | null; published_at: string | null } | null }
  const oneTimeRows = (oneTime.data || []) as unknown as OneTime[]
  const occurrenceRows = (occurrences.data || []) as unknown as Joined[]
  const blocks = [
    ...oneTimeRows.map(e => eventLines({ ...e, start: e.start_datetime, end: e.end_datetime })),
    ...occurrenceRows.filter(o => o.recurring_event?.published_at).map(o => eventLines({
      slug: o.recurring_event!.slug, name: o.recurring_event!.name, description: o.recurring_event!.description,
      uid: `${o.recurring_event!.slug}-${icalDate(o.start_datetime)}@thrivevineyard.com`,
      location: o.location || o.recurring_event!.location, start: o.start_datetime, end: o.end_datetime,
    })),
  ]
  const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Thrive Vineyard//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...blocks, 'END:VCALENDAR'].join('\r\n') + '\r\n'
  return new Response(calendar, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="thrive-vineyard-events.ics"',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
