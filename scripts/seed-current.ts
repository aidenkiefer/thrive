/**
 * Import the reviewed November export data. Never inserts editorial placeholder
 * rows and never deletes. Guide: docs/ops/seeding-preview.md.
 *
 *   npm run seed -- --dry-run   read-only diff with the publishable key (no service-role key)
 *   npm run seed                write; needs the service-role key,
 *                               SEED_CONFIRM_SUPABASE_HOST=<host of NEXT_PUBLIC_SUPABASE_URL> and
 *                               SEED_EXPECT_FINGERPRINT=<fingerprint the approved dry run printed>
 *
 * Every run ends with a verification against migration-report.json and the
 * Express(o) schedule. The write refuses while a planned event slug is live in
 * the other event table, and when the live rows no longer match the approved
 * dry run (fingerprint), so nothing changed since approval is overwritten. Exit 0 = applied (or dry run finished), 1 = verification
 * mismatch or write error, 2 = refused (configuration).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { buildSeedPlan, checkExpresso, SEED_TABLES, type Row, type SeedTable } from '../src/lib/seed/plan'
import { crossTableCollisions, diffFingerprint, diffPlan, formatDiff, fromLive, isApplied, LIVE_SELECT, writeRefusal } from '../src/lib/seed/diff'

const root = process.cwd()
const envFile = path.join(root, '.env.local')
// The confirmations must be typed on the command line for each run, never read from a file.
const CONFIRMATIONS = new Set(['SEED_CONFIRM_SUPABASE_HOST', 'SEED_EXPECT_FINGERPRINT'])
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !CONFIRMATIONS.has(match[1]) && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

const dryRun = process.argv.includes('--dry-run')

function refuse(message: string): never {
  console.error(`Refused: ${message}`)
  process.exit(2)
}

function connect(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) refuse('NEXT_PUBLIC_SUPABASE_URL is required')
  const host = new URL(url).host
  if (dryRun) {
    // Never the service-role key: the public read policies show every published row.
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) refuse('--dry-run needs NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    console.log(`Dry run against ${host} (read-only, publishable key)`)
    return createClient(url, key, { auth: { persistSession: false } })
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) refuse('writing needs SUPABASE_SERVICE_ROLE_KEY; use --dry-run to preview')
  if (process.env.SEED_CONFIRM_SUPABASE_HOST !== host) {
    refuse(`set SEED_CONFIRM_SUPABASE_HOST=${host} to confirm the target database`)
  }
  if (!process.env.SEED_EXPECT_FINGERPRINT) refuse('set SEED_EXPECT_FINGERPRINT to the fingerprint of the approved dry run')
  console.log(`Writing to ${host}`)
  return createClient(url, key, { auth: { persistSession: false } })
}

const parsed = path.join(root, 'migration-files', 'parsed')
function read<T>(name: string): T { return JSON.parse(fs.readFileSync(path.join(parsed, name), 'utf8')) as T }

async function fetchLive(db: SupabaseClient): Promise<Record<SeedTable, Row[]>> {
  const live = {} as Record<SeedTable, Row[]>
  for (const table of SEED_TABLES) {
    const { data, error } = await db.from(table).select(LIVE_SELECT[table]).range(0, 9999)
    if (error) throw new Error(`read ${table}: ${error.message}`)
    live[table] = (data as unknown as Row[]).map(r => fromLive(table, r))
  }
  return live
}

async function write(db: SupabaseClient, plan: ReturnType<typeof buildSeedPlan>) {
  async function upsert(table: string, row: Row, onConflict = 'slug'): Promise<string> {
    const { data, error } = await db.from(table).upsert(row, { onConflict }).select('id').single()
    if (error) throw new Error(`${table} ${row.slug ?? row.start_datetime}: ${error.message}`)
    return (data as Row).id as string
  }
  const ids = { speakers: new Map<unknown, string>(), series: new Map<unknown, string>(), recurring: new Map<unknown, string>() }
  for (const s of plan.speakers) ids.speakers.set(s.slug, await upsert('speakers', s))
  for (const s of plan.sermon_series) ids.series.set(s.slug, await upsert('sermon_series', s))
  for (const { speaker_slug, series_slug, ...s } of plan.sermons) {
    await upsert('sermons', {
      ...s,
      speaker_id: speaker_slug ? ids.speakers.get(speaker_slug) : null,
      series_id: series_slug ? ids.series.get(series_slug) : null,
    })
  }
  for (const e of plan.recurring_events) ids.recurring.set(e.slug, await upsert('recurring_events', e))
  for (const e of plan.one_time_events) await upsert('one_time_events', e)
  for (const { recurring_slug, ...o } of plan.event_occurrences) {
    const { error } = await db.from('event_occurrences')
      .upsert({ ...o, recurring_event_id: ids.recurring.get(recurring_slug) }, { onConflict: 'recurring_event_id,start_datetime' })
    if (error) throw new Error(`Occurrence ${recurring_slug} ${o.start_datetime}: ${error.message}`)
  }
}

async function main() {
  const plan = buildSeedPlan({
    report: read('migration-report.json'),
    speakers: read('speakers.json'), series: read('sermon_series.json'), sermons: read('sermons.json'),
    recurring: read('recurring_events.json'), oneTime: read('one_time_events.json'), occurrences: read('event_occurrences.json'),
  })
  const db = connect()
  const current = await fetchLive(db)
  const before = diffPlan(plan, current)
  console.log(formatDiff(before))
  const collisions = crossTableCollisions(plan, current)
  if (collisions.length) console.log(`Slug in both event tables after seeding: ${collisions.join(', ')}`)
  const fingerprint = diffFingerprint(before, plan)
  console.log(`Fingerprint: ${fingerprint}`)
  if (dryRun) {
    for (const t of SEED_TABLES) {
      if (before[t].insert.length) console.log(`${t} to insert: ${before[t].insert.join(', ')}`)
      for (const u of before[t].update) console.log(`${t} to update: ${u.key} [${u.columns.join(', ')}]`)
    }
    try { checkExpresso(current.recurring_events, current.event_occurrences); console.log('Express(o) live: Sundays 8:30 AM') }
    catch (error) { console.log(`Express(o) live today: ${error instanceof Error ? error.message : error}`) }
    console.log(isApplied(before) ? 'Dry run: already applied, nothing to write.' : 'Dry run: nothing written.')
    return
  }

  const refusal = writeRefusal(collisions, fingerprint, process.env.SEED_EXPECT_FINGERPRINT)
  if (refusal) refuse(refusal)
  await write(db, plan)
  const live = await fetchLive(db)
  const after = diffPlan(plan, live)
  console.log('\nVerification after write:')
  console.log(formatDiff(after))
  if (!isApplied(after)) {
    console.error('Verification FAILED: planned rows are missing or differ (see above).')
    process.exitCode = 1
    return
  }
  checkExpresso(live.recurring_events, live.event_occurrences)
  console.log('Verification passed: every planned row matches migration-report.json counts; Express(o) is Sundays 8:30 AM.')
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
