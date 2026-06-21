/**
 * seed-from-parsed.ts
 *
 * Idempotent seed script — imports parsed WordPress JSON into Supabase, then
 * inserts hand-written homepage seed rows (announcements, groups, outreach).
 *
 * Run:   npm run seed
 * Needs: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Safe:  re-running is a no-op (upsert on slug conflict for all slug tables)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Supabase admin client (service-role key bypasses RLS)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '❌  Missing env vars. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML entities that appear in some ChurchSuite URLs */
const cleanUrl = (url: string | null | undefined): string | null =>
  url?.replace(/&amp;/g, '&') ?? null

/** Read a parsed JSON file from migration-files/parsed/ */
function readParsed<T>(filename: string): T {
  const filePath = path.join(process.cwd(), 'migration-files', 'parsed', filename)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

/**
 * Return the next Sunday (00:00 local) relative to `from`.
 * If today is Sunday, still returns the following Sunday.
 */
function nextSunday(from: Date): Date {
  const d = new Date(from)
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + diff)
  d.setHours(9, 30, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Type stubs matching the parsed JSON shapes
// ---------------------------------------------------------------------------

interface SpeakerRow {
  slug: string
  name: string
}

interface SeriesRow {
  slug: string
  title: string
}

interface SermonRow {
  wp_id: string
  slug: string
  title: string
  description: string | null
  speaker_slug: string | null
  series_slug: string | null
  scripture_references: string[]
  topics: string[]
  service_type: string | null
  audio_url: string | null
  youtube_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  preached_at: string | null
  location: string | null
  legacy_permalink: string | null
  published_at: string | null
  seo_description: string | null
}

interface RecurringEventRow {
  wp_id: string
  slug: string
  name: string
  description: string | null
  short_summary: string | null
  category: string | null
  location: string | null
  featured_image_url: string | null
  churchsuite_form_url: string | null
  published_at: string | null
  is_past: boolean
  seo_description: string | null
  recurrence_description: string | null
  typical_time: string | null
}

interface OneTimeEventRow {
  wp_id: string
  slug: string
  name: string
  description: string | null
  short_summary: string | null
  category: string | null
  location: string | null
  featured_image_url: string | null
  churchsuite_form_url: string | null
  published_at: string | null
  is_past: boolean
  start_datetime: string | null
  end_datetime: string | null
}

// ---------------------------------------------------------------------------
// Step 1: Speakers
// ---------------------------------------------------------------------------

async function seedSpeakers(): Promise<Map<string, number>> {
  console.log('\n[1/9] Seeding speakers…')
  const speakers = readParsed<SpeakerRow[]>('speakers.json')
  console.log(`      ${speakers.length} speakers found`)

  const { data, error } = await supabase
    .from('speakers')
    .upsert(speakers.map((s) => ({ slug: s.slug, name: s.name })), {
      onConflict: 'slug',
    })
    .select('id, slug')

  if (error) {
    console.error('      ❌  speakers upsert failed:', error.message)
    return new Map()
  }

  const map = new Map<string, number>((data ?? []).map((r) => [r.slug, r.id]))
  console.log(`      ✓  ${map.size} speakers upserted`)
  return map
}

// ---------------------------------------------------------------------------
// Step 2: Sermon series
// ---------------------------------------------------------------------------

async function seedSeries(): Promise<Map<string, number>> {
  console.log('\n[2/9] Seeding sermon series…')
  const series = readParsed<SeriesRow[]>('sermon_series.json')
  console.log(`      ${series.length} series found`)

  const { data, error } = await supabase
    .from('sermon_series')
    .upsert(
      series.map((s) => ({
        slug: s.slug,
        title: s.title,
        published_at: new Date().toISOString(),
      })),
      { onConflict: 'slug' }
    )
    .select('id, slug')

  if (error) {
    console.error('      ❌  sermon_series upsert failed:', error.message)
    return new Map()
  }

  const map = new Map<string, number>((data ?? []).map((r) => [r.slug, r.id]))
  console.log(`      ✓  ${map.size} series upserted`)
  return map
}

// ---------------------------------------------------------------------------
// Step 3: Sermons (FK-resolved via speaker + series Maps)
// ---------------------------------------------------------------------------

async function seedSermons(
  speakerMap: Map<string, number>,
  seriesMap: Map<string, number>
): Promise<void> {
  console.log('\n[3/9] Seeding sermons…')
  const sermons = readParsed<SermonRow[]>('sermons.json')
  console.log(`      ${sermons.length} sermons found`)

  let upserted = 0
  let skipped = 0

  for (const s of sermons) {
    const speaker_id = s.speaker_slug ? (speakerMap.get(s.speaker_slug) ?? null) : null
    const series_id = s.series_slug ? (seriesMap.get(s.series_slug) ?? null) : null

    if (s.speaker_slug && speaker_id === null) {
      console.warn(`      ⚠  Unknown speaker slug "${s.speaker_slug}" for sermon "${s.slug}"`)
    }
    if (s.series_slug && series_id === null) {
      console.warn(`      ⚠  Unknown series slug "${s.series_slug}" for sermon "${s.slug}"`)
    }

    const { error } = await supabase
      .from('sermons')
      .upsert(
        {
          slug: s.slug,
          title: s.title,
          description: s.description ?? null,
          speaker_id,
          series_id,
          scripture_references: s.scripture_references ?? [],
          topics: s.topics ?? [],
          service_type: s.service_type ?? null,
          audio_url: cleanUrl(s.audio_url),
          youtube_url: cleanUrl(s.youtube_url),
          video_url: cleanUrl(s.video_url),
          thumbnail_url: cleanUrl(s.thumbnail_url),
          preached_at: s.preached_at ?? null,
          location: s.location ?? null,
          seo_description: s.seo_description ?? null,
          published_at: s.published_at ?? new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )

    if (error) {
      console.error(`      ❌  sermon "${s.slug}" failed:`, error.message)
      skipped++
    } else {
      upserted++
    }
  }

  console.log(`      ✓  ${upserted} sermons upserted, ${skipped} failed`)
}

// ---------------------------------------------------------------------------
// Step 4: Recurring events
// ---------------------------------------------------------------------------

async function seedRecurringEvents(): Promise<Map<string, number>> {
  console.log('\n[4/9] Seeding recurring events…')
  const events = readParsed<RecurringEventRow[]>('recurring_events.json')
  console.log(`      ${events.length} recurring events found`)

  const { data, error } = await supabase
    .from('recurring_events')
    .upsert(
      events.map((e) => ({
        slug: e.slug,
        name: e.name,
        description: e.description ?? null,
        short_summary: e.short_summary ?? null,
        category: e.category ?? null,
        recurrence_description: e.recurrence_description ?? null,
        typical_time: e.typical_time ?? null,
        location: e.location ?? null,
        featured_image_url: cleanUrl(e.featured_image_url),
        churchsuite_form_url: cleanUrl(e.churchsuite_form_url),
        seo_description: e.seo_description ?? null,
        published_at: e.published_at ?? new Date().toISOString(),
      })),
      { onConflict: 'slug' }
    )
    .select('id, slug')

  if (error) {
    console.error('      ❌  recurring_events upsert failed:', error.message)
    return new Map()
  }

  const map = new Map<string, number>((data ?? []).map((r) => [r.slug, r.id]))
  console.log(`      ✓  ${map.size} recurring events upserted`)
  return map
}

// ---------------------------------------------------------------------------
// Step 5: event_occurrences for family-worship-service (8 Sundays)
// ---------------------------------------------------------------------------

async function seedFamilyWorshipOccurrences(recurringMap: Map<string, number>): Promise<void> {
  console.log('\n[5/9] Generating family-worship-service occurrences…')

  const recurringEventId = recurringMap.get('family-worship-service')
  if (!recurringEventId) {
    console.warn('      ⚠  family-worship-service not found in recurring events — skipping occurrences')
    return
  }

  const today = new Date()
  const first = nextSunday(today)

  const occurrences = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(first)
    start.setDate(start.getDate() + i * 7)
    // 9:30 AM already set by nextSunday; clone for end at 11:00 AM
    const end = new Date(start)
    end.setHours(11, 0, 0, 0)

    return {
      recurring_event_id: recurringEventId,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      location: 'Thrive Vineyard Church: Sanctuary',
      cancelled: false,
    }
  })

  // Upsert on (recurring_event_id, start_datetime) — assumes that unique constraint exists
  // If the constraint doesn't exist, duplicate rows will be inserted on re-run.
  // Adjust onConflict to match your schema's constraint name if needed.
  const { error } = await supabase
    .from('event_occurrences')
    .upsert(occurrences, { onConflict: 'recurring_event_id,start_datetime' })

  if (error) {
    // Fallback: try plain insert (will duplicate on re-run, but won't crash)
    console.warn(
      `      ⚠  upsert failed (${error.message}); attempting plain insert (may duplicate on re-run)`
    )
    const { error: insertError } = await supabase.from('event_occurrences').insert(occurrences)
    if (insertError) {
      console.error('      ❌  event_occurrences insert failed:', insertError.message)
      return
    }
  }

  console.log(`      ✓  ${occurrences.length} Sunday occurrences seeded`)
  console.log(`         First: ${occurrences[0].start_datetime}`)
  console.log(`         Last:  ${occurrences[7].start_datetime}`)
}

// ---------------------------------------------------------------------------
// Step 6: One-time events
// ---------------------------------------------------------------------------

async function seedOneTimeEvents(): Promise<void> {
  console.log('\n[6/9] Seeding one-time events…')
  const events = readParsed<OneTimeEventRow[]>('one_time_events.json')
  console.log(`      ${events.length} one-time events found`)

  const { error } = await supabase
    .from('one_time_events')
    .upsert(
      events.map((e) => ({
        slug: e.slug,
        name: e.name,
        description: e.description ?? null,
        short_summary: e.short_summary ?? null,
        category: e.category ?? null,
        start_datetime: e.start_datetime ?? null,
        end_datetime: e.end_datetime ?? null,
        location: e.location ?? null,
        featured_image_url: cleanUrl(e.featured_image_url),
        churchsuite_form_url: cleanUrl(e.churchsuite_form_url),
        seo_description: null,
        published_at: e.published_at ?? new Date().toISOString(),
      })),
      { onConflict: 'slug' }
    )

  if (error) {
    console.error('      ❌  one_time_events upsert failed:', error.message)
    return
  }

  console.log(`      ✓  ${events.length} one-time events upserted`)
}

// ---------------------------------------------------------------------------
// Step 7: Announcements (hand-written from live site audit)
// ---------------------------------------------------------------------------

async function seedAnnouncements(): Promise<void> {
  console.log('\n[7/9] Seeding announcements…')

  const announcements = [
    {
      title: 'Express(o) Service Renovation Pause',
      body: "Our Express(o) service is temporarily paused while we complete building renovations. Join us for Family Worship at 9:30 AM in the Sanctuary — we can't wait to see you!",
      cta_text: 'Learn More',
      cta_url: '/plan-a-visit',
      is_homepage_feature: true,
      published_at: new Date().toISOString(),
    },
  ]

  // announcements table has no slug — use title as a soft-dedup guard via upsert
  // If your schema has a unique constraint on title, use onConflict: 'title'
  // Otherwise this inserts fresh rows; re-running will add duplicates.
  // Check schema for a unique constraint and adjust accordingly.
  const { error } = await supabase.from('announcements').upsert(announcements, {
    onConflict: 'title',
    ignoreDuplicates: true,
  })

  if (error) {
    // Fallback: plain insert (idempotent if run once; duplicates if run again)
    console.warn(`      ⚠  announcements upsert failed (${error.message}); trying insert`)
    const { error: insertError } = await supabase.from('announcements').insert(announcements)
    if (insertError) {
      console.error('      ❌  announcements insert failed:', insertError.message)
      return
    }
  }

  console.log(`      ✓  ${announcements.length} announcement(s) seeded`)
}

// ---------------------------------------------------------------------------
// Step 8: Groups (hand-written from live site audit)
// ---------------------------------------------------------------------------

async function seedGroups(): Promise<void> {
  console.log('\n[8/9] Seeding groups…')

  const groups = [
    {
      slug: 'contend-prayer-group',
      name: 'Contend Prayer Group',
      description: null,
      short_summary:
        'A weekly prayer gathering focused on contending for breakthrough in our community and church.',
      category: 'prayer',
      is_open: true,
      published_at: new Date().toISOString(),
    },
    {
      slug: 'alpha',
      name: 'Alpha',
      description: null,
      short_summary:
        'Explore the Christian faith in a relaxed, open environment. No question is off limits.',
      category: 'connect-group',
      is_open: true,
      published_at: new Date().toISOString(),
    },
    {
      slug: 'marrieds-small-group',
      name: "Married's Small Group",
      description: null,
      short_summary: 'A small group for married couples to grow in faith and community together.',
      category: 'small-group',
      is_open: true,
      published_at: new Date().toISOString(),
    },
  ]

  const { error } = await supabase
    .from('groups')
    .upsert(groups, { onConflict: 'slug' })

  if (error) {
    console.error('      ❌  groups upsert failed:', error.message)
    return
  }

  console.log(`      ✓  ${groups.length} groups upserted`)
}

// ---------------------------------------------------------------------------
// Step 9: Outreach (hand-written from live site audit)
// ---------------------------------------------------------------------------

async function seedOutreach(): Promise<void> {
  console.log('\n[9/9] Seeding outreach…')

  const outreachItems = [
    {
      slug: 'joy-drop',
      name: 'Joy Drop Collective',
      description: null,
      short_summary:
        'Provides food and basic necessities for families facing food insecurity in Palatine, IL.',
      is_ongoing: true,
      published_at: new Date().toISOString(),
    },
    {
      slug: 'pack-the-pantry',
      name: 'Pack the Pantry',
      description: null,
      short_summary: 'Community food drive to support local families in need.',
      is_ongoing: false,
      published_at: new Date().toISOString(),
    },
  ]

  const { error } = await supabase
    .from('outreach')
    .upsert(outreachItems, { onConflict: 'slug' })

  if (error) {
    console.error('      ❌  outreach upsert failed:', error.message)
    return
  }

  console.log(`      ✓  ${outreachItems.length} outreach items upserted`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60))
  console.log('Thrive Vineyard — Supabase seed script')
  console.log('='.repeat(60))
  console.log(`Target: ${supabaseUrl}`)
  console.log(`Date:   ${new Date().toISOString()}`)

  // Phase A: reference data (no FKs)
  const speakerMap = await seedSpeakers()
  const seriesMap = await seedSeries()

  // Phase B: FK-dependent data
  await seedSermons(speakerMap, seriesMap)

  // Phase C: events
  const recurringMap = await seedRecurringEvents()
  await seedFamilyWorshipOccurrences(recurringMap)
  await seedOneTimeEvents()

  // Phase D: homepage seed data
  await seedAnnouncements()
  await seedGroups()
  await seedOutreach()

  console.log('\n' + '='.repeat(60))
  console.log('Seed complete.')
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('\n❌  Unhandled error:', err)
  process.exit(1)
})
