/**
 * Compares the seed plan with what the database holds, per table: rows the
 * seed would insert, rows it would update (and which columns differ), and rows
 * only the database has (the seed never deletes them). Values are compared
 * after normalizing instants, so `+00:00` and `-06:00` spellings match.
 */
import { createHash } from 'node:crypto'
import { occurrenceKey, SEED_TABLES, type Row, type SeedPlan, type SeedTable } from './plan'

/** Columns selected from the database for each table; foreign keys come back as joined slugs. */
export const LIVE_SELECT: Record<SeedTable, string> = {
  speakers: 'slug,name',
  sermon_series: 'slug,title,published_at',
  sermons: 'slug,title,description,scripture_references,topics,service_type,audio_url,youtube_url,video_url,thumbnail_url,preached_at,location,seo_description,published_at,speaker:speakers(slug),series:sermon_series(slug)',
  recurring_events: 'slug,name,description,short_summary,category,recurrence_description,typical_time,location,venue,featured_image_url,churchsuite_form_url,external_url,seo_description,published_at',
  one_time_events: 'slug,name,description,short_summary,category,start_datetime,end_datetime,location,venue,featured_image_url,churchsuite_form_url,external_url,seo_description,published_at',
  event_occurrences: 'start_datetime,end_datetime,location,recurring:recurring_events(slug)',
}

const joinedSlug = (value: unknown) =>
  value && typeof value === 'object' && 'slug' in value ? (value as Row).slug ?? null : null

/** Reshapes a database row (from LIVE_SELECT) into the plan's shape. */
export function fromLive(table: SeedTable, row: Row): Row {
  if (table === 'sermons') {
    const { speaker, series, ...rest } = row
    return { ...rest, speaker_slug: joinedSlug(speaker), series_slug: joinedSlug(series) }
  }
  if (table === 'event_occurrences') {
    const { recurring, ...rest } = row
    return { ...rest, recurring_slug: joinedSlug(recurring) }
  }
  return row
}

export function rowKey(table: SeedTable, row: Row): string {
  return table === 'event_occurrences' ? occurrenceKey(row.recurring_slug, row.start_datetime) : String(row.slug)
}

const INSTANT = /(_at|_datetime)$/

function same(column: string, planned: unknown, live: unknown): boolean {
  const a = planned ?? null
  const b = live ?? null
  if (a === null || b === null) return a === b
  if (INSTANT.test(column)) return Date.parse(String(a)) === Date.parse(String(b))
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b)
  return a === b
}

export interface TableDiff {
  planned: number
  live: number
  insert: string[]
  /** `before` holds the database's current values of the differing columns. */
  update: { key: string; columns: string[]; before: Row }[]
  unchanged: number
  liveOnly: string[]
}

export type SeedDiff = Record<SeedTable, TableDiff>

export function diffTable(table: SeedTable, planned: Row[], liveRows: Row[]): TableDiff {
  const live = new Map(liveRows.map(r => [rowKey(table, r), r]))
  const plannedKeys = new Set<string>()
  const result: TableDiff = { planned: planned.length, live: liveRows.length, insert: [], update: [], unchanged: 0, liveOnly: [] }
  for (const row of planned) {
    const key = rowKey(table, row)
    plannedKeys.add(key)
    const current = live.get(key)
    if (!current) { result.insert.push(key); continue }
    const columns = Object.keys(row).filter(c => !same(c, row[c], current[c]))
    if (columns.length) result.update.push({ key, columns, before: Object.fromEntries(columns.map(c => [c, current[c] ?? null])) })
    else result.unchanged++
  }
  for (const key of live.keys()) if (!plannedKeys.has(key)) result.liveOnly.push(key)
  return result
}

export function diffPlan(plan: SeedPlan, live: Record<SeedTable, Row[]>): SeedDiff {
  return Object.fromEntries(SEED_TABLES.map(t => [t, diffTable(t, plan[t], live[t])])) as SeedDiff
}

/**
 * Slugs that would exist in both event tables after the seed. The public event
 * page reads one_time_events first, so a stale one-time row would hide the
 * planned recurring event (and the reverse). Unpublished live rows are ignored:
 * the public page never shows them. The writer refuses while any remain.
 */
export function crossTableCollisions(plan: SeedPlan, live: Record<SeedTable, Row[]>): string[] {
  const published = (rows: Row[]) => new Set(rows.filter(r => r.published_at != null).map(r => r.slug))
  const liveOneTime = published(live.one_time_events)
  const liveRecurring = published(live.recurring_events)
  return [
    ...plan.recurring_events.filter(r => liveOneTime.has(r.slug)).map(r => `${r.slug} (live one-time, planned recurring)`),
    ...plan.one_time_events.filter(r => liveRecurring.has(r.slug)).map(r => `${r.slug} (live recurring, planned one-time)`),
  ]
}

/**
 * Fingerprint of what the write would change: every key to insert, and every
 * key to update with its columns and their current database values. The owner
 * approves a dry run's fingerprint; the writer recomputes it just before
 * writing and refuses on any difference, so a value someone changed since the
 * approved dry run (a staff edit included) is never silently overwritten.
 */
export function diffFingerprint(diff: SeedDiff): string {
  const material = SEED_TABLES.map(t => [
    t,
    [...diff[t].insert].sort(),
    [...diff[t].update].sort((a, b) => a.key.localeCompare(b.key)).map(u => [u.key, u.columns, u.columns.map(c => u.before[c])]),
  ])
  return createHash('sha256').update(JSON.stringify(material)).digest('hex').slice(0, 16)
}

/** True when every planned row exists with the planned values (live-only rows are allowed). */
export function isApplied(diff: SeedDiff): boolean {
  return SEED_TABLES.every(t => diff[t].insert.length === 0 && diff[t].update.length === 0)
}

/** Plain-text summary: counts per table, then which columns would change and how often. */
export function formatDiff(diff: SeedDiff): string {
  const lines = ['table               planned  live  insert  update  unchanged  live-only']
  for (const t of SEED_TABLES) {
    const d = diff[t]
    lines.push([t.padEnd(18), String(d.planned).padStart(8), String(d.live).padStart(5), String(d.insert.length).padStart(7),
      String(d.update.length).padStart(7), String(d.unchanged).padStart(10), String(d.liveOnly.length).padStart(10)].join(' '))
  }
  for (const t of SEED_TABLES) {
    const counts = new Map<string, number>()
    for (const u of diff[t].update) for (const c of u.columns) counts.set(c, (counts.get(c) ?? 0) + 1)
    if (counts.size) lines.push(`${t} columns to update: ${[...counts].map(([c, n]) => `${c} (${n})`).join(', ')}`)
    if (diff[t].liveOnly.length) lines.push(`${t} live-only: ${diff[t].liveOnly.join(', ')}`)
  }
  return lines.join('\n')
}
