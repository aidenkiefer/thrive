/** Import the reviewed November export data. Never inserts editorial placeholder rows. */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const envFile = path.join(root, '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Supabase URL and service role key are required in .env.local')
const db = createClient(url, key)
const parsed = path.join(root, 'migration-files', 'parsed')
function read<T>(name: string): T { return JSON.parse(fs.readFileSync(path.join(parsed, name), 'utf8')) as T }
type Row = Record<string, any>
const cleanUrl = (value: unknown) => typeof value === 'string' ? value.replace(/&amp;/g, '&') : null
const report = read<Row>('migration-report.json')
if (report.events?.source !== 80 || report.sermons?.total !== 120 ||
    !report.source_files?.includes('mec-events-20261107UTC0059.json') ||
    !report.source_files?.includes('thrivevineyardchurch.wordpress.2026-11-07.xml')) {
  throw new Error('Parsed data is not the reviewed November export; rerun parse-current-exports.py')
}
const speakers = read<Row[]>('speakers.json')
const series = read<Row[]>('sermon_series.json')
const sermons = read<Row[]>('sermons.json')
const recurring = read<Row[]>('recurring_events.json')
const oneTime = read<Row[]>('one_time_events.json')
const occurrences = read<Row[]>('event_occurrences.json')

function unique(rows: Row[], label: string) {
  const slugs = rows.map(r => r.slug)
  if (slugs.some(s => !s) || new Set(slugs).size !== slugs.length) throw new Error(`${label} has blank or duplicate slugs`)
}
unique(speakers, 'speakers'); unique(series, 'series'); unique(sermons, 'sermons')
unique(recurring, 'recurring events'); unique(oneTime, 'one-time events')
if (recurring.some(r => oneTime.some(o => o.slug === r.slug))) throw new Error('Event slug exists in both event tables')
if (oneTime.some(e => !e.start_datetime) || sermons.some(s => !s.preached_at)) throw new Error('Required event/sermon date missing')
if (occurrences.some(o => !recurring.some(r => r.slug === o.recurring_slug))) throw new Error('Occurrence references unknown recurring event')
const occurrenceKeys = occurrences.map(o => `${o.recurring_slug}:${o.start_datetime}`)
if (new Set(occurrenceKeys).size !== occurrenceKeys.length) throw new Error('Duplicate generated occurrence')

async function upsert(table: string, row: Row, onConflict = 'slug'): Promise<Row> {
  const { data, error } = await db.from(table).upsert(row, { onConflict }).select('id,slug').single()
  if (error) throw new Error(`${table} ${row.slug ?? row.start_datetime}: ${error.message}`)
  return data as Row
}

async function main() {
  console.log(`Importing ${sermons.length} sermons, ${recurring.length + oneTime.length} events, ${occurrences.length} occurrences`)
  const speakerIds = new Map<string, string>()
  for (const s of speakers) speakerIds.set(s.slug, (await upsert('speakers', { slug: s.slug, name: s.name })).id)
  // A series is published as of its earliest published sermon. Deterministic, so
  // re-running the seed doesn't move the timestamp (it used to be "now").
  const seriesPublishedAt = new Map<string, string>()
  for (const s of sermons) {
    if (!s.series_slug || !s.published_at) continue
    const current = seriesPublishedAt.get(s.series_slug)
    if (!current || Date.parse(s.published_at) < Date.parse(current)) seriesPublishedAt.set(s.series_slug, s.published_at)
  }
  const seriesIds = new Map<string, string>()
  for (const s of series) seriesIds.set(s.slug, (await upsert('sermon_series', {
    slug: s.slug, title: s.title, published_at: seriesPublishedAt.get(s.slug) ?? null,
  })).id)
  for (const s of sermons) {
    if (s.speaker_slug && !speakerIds.has(s.speaker_slug)) throw new Error(`Missing speaker for ${s.slug}`)
    if (s.series_slug && !seriesIds.has(s.series_slug)) throw new Error(`Missing series for ${s.slug}`)
    await upsert('sermons', {
      slug: s.slug, title: s.title, description: s.description,
      speaker_id: s.speaker_slug ? speakerIds.get(s.speaker_slug) : null,
      series_id: s.series_slug ? seriesIds.get(s.series_slug) : null,
      scripture_references: s.scripture_references ?? [], topics: s.topics ?? [],
      service_type: s.service_type, audio_url: cleanUrl(s.audio_url),
      youtube_url: cleanUrl(s.youtube_url), video_url: cleanUrl(s.video_url),
      thumbnail_url: cleanUrl(s.thumbnail_url), preached_at: s.preached_at,
      location: s.location, seo_description: s.seo_description,
      published_at: s.published_at,
    })
  }
  const recurringIds = new Map<string, string>()
  for (const e of recurring) recurringIds.set(e.slug, (await upsert('recurring_events', {
    slug: e.slug, name: e.name, description: e.description, short_summary: e.short_summary,
    category: e.category, recurrence_description: e.recurrence_description,
    typical_time: e.typical_time, location: e.location, venue: e.venue,
    featured_image_url: cleanUrl(e.featured_image_url),
    churchsuite_form_url: cleanUrl(e.churchsuite_form_url), external_url: cleanUrl(e.external_url),
    seo_description: e.seo_description, published_at: e.published_at,
  })).id)
  for (const e of oneTime) await upsert('one_time_events', {
    slug: e.slug, name: e.name, description: e.description, short_summary: e.short_summary,
    category: e.category, start_datetime: e.start_datetime, end_datetime: e.end_datetime,
    location: e.location, venue: e.venue, featured_image_url: cleanUrl(e.featured_image_url),
    churchsuite_form_url: cleanUrl(e.churchsuite_form_url), external_url: cleanUrl(e.external_url),
    seo_description: e.seo_description, published_at: e.published_at,
  })
  for (const o of occurrences) {
    const { error } = await db.from('event_occurrences').upsert({
      recurring_event_id: recurringIds.get(o.recurring_slug), start_datetime: o.start_datetime,
      end_datetime: o.end_datetime, location: o.location,
    }, { onConflict: 'recurring_event_id,start_datetime' })
    if (error) throw new Error(`Occurrence ${o.recurring_slug} ${o.start_datetime}: ${error.message}`)
  }
  console.log('Import completed without fallback inserts.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
