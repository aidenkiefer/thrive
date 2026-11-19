/**
 * The seed plan: exactly the rows `npm run seed` writes, built from the
 * reviewed November exports in `migration-files/parsed/`. Pure (no I/O), so the
 * dry run, the write and the post-write verification all use the same rows.
 *
 * Foreign keys stay as slugs here (`speaker_slug`, `series_slug`,
 * `recurring_slug`); the writer resolves them to ids, and the diff compares
 * them against the live row's joined slug.
 */

export type Row = Record<string, unknown>

export interface SeedExports {
  report: Row
  speakers: Row[]
  series: Row[]
  sermons: Row[]
  recurring: Row[]
  oneTime: Row[]
  occurrences: Row[]
}

export const SEED_TABLES = [
  'speakers',
  'sermon_series',
  'sermons',
  'recurring_events',
  'one_time_events',
  'event_occurrences',
] as const
export type SeedTable = (typeof SEED_TABLES)[number]

export type SeedPlan = Record<SeedTable, Row[]>

/** Counts the reviewed export must produce (the owner-approved numbers in #54 and #101). */
export const EXPECTED_COUNTS: Record<SeedTable, number> = {
  speakers: 12,
  sermon_series: 22,
  sermons: 120,
  recurring_events: 25,
  one_time_events: 55,
  event_occurrences: 56,
}

/** Express(o): every Sunday at 8:30 AM America/Chicago (owner, #54). */
export const EXPRESSO = { slug: 'expresso-service', recurrence: 'Sundays', time: '8:30 AM' } as const

const cleanUrl = (value: unknown) => (typeof value === 'string' ? value.replace(/&amp;/g, '&') : null)
const str = (value: unknown) => (typeof value === 'string' ? value : null)

function unique(rows: Row[], label: string) {
  const slugs = rows.map(r => r.slug)
  if (slugs.some(s => !s) || new Set(slugs).size !== slugs.length) throw new Error(`${label} has blank or duplicate slugs`)
}

/** Occurrence key used by the upsert's conflict target, normalized to the instant. */
export function occurrenceKey(recurringSlug: unknown, start: unknown): string {
  return `${recurringSlug}@${new Date(String(start)).toISOString()}`
}

/** Validates the exports and returns the rows to write. Throws on anything unexpected. */
export function buildSeedPlan(x: SeedExports): SeedPlan {
  const { report } = x
  const events = report.events as Row | undefined
  const sermonsReport = report.sermons as Row | undefined
  const sources = report.source_files as unknown[] | undefined
  if (events?.source !== 80 || sermonsReport?.total !== 120 ||
      !sources?.includes('mec-events-20261107UTC0059.json') ||
      !sources?.includes('thrivevineyardchurch.wordpress.2026-11-07.xml')) {
    throw new Error('Parsed data is not the reviewed November export; rerun parse-current-exports.py')
  }

  unique(x.speakers, 'speakers'); unique(x.series, 'series'); unique(x.sermons, 'sermons')
  unique(x.recurring, 'recurring events'); unique(x.oneTime, 'one-time events')
  if (x.recurring.some(r => x.oneTime.some(o => o.slug === r.slug))) throw new Error('Event slug exists in both event tables')
  if (x.oneTime.some(e => !e.start_datetime) || x.sermons.some(s => !s.preached_at)) throw new Error('Required event/sermon date missing')
  if (x.occurrences.some(o => !x.recurring.some(r => r.slug === o.recurring_slug))) throw new Error('Occurrence references unknown recurring event')
  const keys = x.occurrences.map(o => occurrenceKey(o.recurring_slug, o.start_datetime))
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate generated occurrence')

  const speakerSlugs = new Set(x.speakers.map(s => s.slug))
  const seriesSlugs = new Set(x.series.map(s => s.slug))
  for (const s of x.sermons) {
    if (s.speaker_slug && !speakerSlugs.has(s.speaker_slug)) throw new Error(`Missing speaker for ${s.slug}`)
    if (s.series_slug && !seriesSlugs.has(s.series_slug)) throw new Error(`Missing series for ${s.slug}`)
  }

  // A series is published as of its earliest published sermon. Deterministic, so
  // re-running the seed doesn't move the timestamp (it used to be "now").
  const seriesPublishedAt = new Map<unknown, string>()
  for (const s of x.sermons) {
    if (!s.series_slug || typeof s.published_at !== 'string') continue
    const current = seriesPublishedAt.get(s.series_slug)
    if (!current || Date.parse(s.published_at) < Date.parse(current)) seriesPublishedAt.set(s.series_slug, s.published_at)
  }

  const plan: SeedPlan = {
    speakers: x.speakers.map(s => ({ slug: s.slug, name: s.name })),
    sermon_series: x.series.map(s => ({ slug: s.slug, title: s.title, published_at: seriesPublishedAt.get(s.slug) ?? null })),
    sermons: x.sermons.map(s => ({
      slug: s.slug, title: s.title, description: s.description,
      speaker_slug: s.speaker_slug ?? null, series_slug: s.series_slug ?? null,
      scripture_references: s.scripture_references ?? [], topics: s.topics ?? [],
      service_type: s.service_type, audio_url: cleanUrl(s.audio_url),
      youtube_url: cleanUrl(s.youtube_url), video_url: cleanUrl(s.video_url),
      thumbnail_url: cleanUrl(s.thumbnail_url), preached_at: s.preached_at,
      location: s.location, seo_description: s.seo_description,
      published_at: s.published_at,
    })),
    recurring_events: x.recurring.map(e => ({
      slug: e.slug, name: e.name, description: e.description, short_summary: e.short_summary,
      category: e.category, recurrence_description: e.recurrence_description,
      typical_time: e.typical_time, location: e.location, venue: e.venue,
      featured_image_url: cleanUrl(e.featured_image_url),
      churchsuite_form_url: cleanUrl(e.churchsuite_form_url), external_url: cleanUrl(e.external_url),
      seo_description: e.seo_description, published_at: e.published_at,
    })),
    one_time_events: x.oneTime.map(e => ({
      slug: e.slug, name: e.name, description: e.description, short_summary: e.short_summary,
      category: e.category, start_datetime: e.start_datetime, end_datetime: e.end_datetime,
      location: e.location, venue: e.venue, featured_image_url: cleanUrl(e.featured_image_url),
      churchsuite_form_url: cleanUrl(e.churchsuite_form_url), external_url: cleanUrl(e.external_url),
      seo_description: e.seo_description, published_at: e.published_at,
    })),
    event_occurrences: x.occurrences.map(o => ({
      recurring_slug: o.recurring_slug, start_datetime: o.start_datetime,
      end_datetime: o.end_datetime, location: str(o.location),
    })),
  }

  for (const table of SEED_TABLES) {
    if (plan[table].length !== EXPECTED_COUNTS[table]) {
      throw new Error(`${table}: export has ${plan[table].length} rows, expected ${EXPECTED_COUNTS[table]}`)
    }
  }
  checkExpresso(plan.recurring_events, plan.event_occurrences)
  return plan
}

/** Weekday and wall-clock time of an instant in America/Chicago, e.g. ["Sun", "08:30"]. */
export function chicagoWeekdayTime(instant: unknown): [string, string] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(String(instant)))
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return [get('weekday'), `${get('hour')}:${get('minute')}`]
}

/**
 * Throws unless Express(o) is a published recurring event described as Sundays
 * at 8:30 AM and every one of its occurrences starts on a Sunday at 08:30
 * Chicago time. Used on the export before writing and on the live rows after.
 */
export function checkExpresso(recurring: Row[], occurrences: Row[]) {
  const row = recurring.find(r => r.slug === EXPRESSO.slug)
  if (!row) throw new Error(`Express(o): no recurring event ${EXPRESSO.slug}`)
  if (row.recurrence_description !== EXPRESSO.recurrence || row.typical_time !== EXPRESSO.time || !row.published_at) {
    throw new Error(`Express(o): expected published, "${EXPRESSO.recurrence}" at "${EXPRESSO.time}"`)
  }
  const own = occurrences.filter(o => o.recurring_slug === EXPRESSO.slug)
  if (own.length === 0) throw new Error('Express(o): no occurrences')
  const off = own.filter(o => chicagoWeekdayTime(o.start_datetime).join(' ') !== 'Sun 08:30')
  if (off.length) throw new Error(`Express(o): ${off.length} occurrence(s) not on Sunday at 08:30 America/Chicago`)
}
