/**
 * Writes supabase/ops/2026-11-19-seed.sql from the reviewed exports: the same
 * rows as `npm run seed`, as one SQL transaction for the Supabase MCP (#101).
 *
 *   npx tsx scripts/seed-sql.ts           write the file
 *   npx tsx scripts/seed-sql.ts --check   exit 1 if the committed file is stale
 */
import fs from 'node:fs'
import path from 'node:path'
import { buildSeedPlan } from '../src/lib/seed/plan'
import { renderSeedSql, SEED_SQL, SEED_SQL_HEADER } from '../src/lib/seed/sql'

const root = process.cwd()
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(root, 'migration-files', 'parsed', name), 'utf8'))
const plan = buildSeedPlan({
  report: read('migration-report.json'),
  speakers: read('speakers.json'), series: read('sermon_series.json'), sermons: read('sermons.json'),
  recurring: read('recurring_events.json'), oneTime: read('one_time_events.json'), occurrences: read('event_occurrences.json'),
})
const sql = renderSeedSql(plan, SEED_SQL_HEADER)
const target = path.join(root, SEED_SQL)

if (process.argv.includes('--check')) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
  if (current !== sql) { console.error(`${SEED_SQL} is stale: run npx tsx scripts/seed-sql.ts`); process.exit(1) }
  console.log(`${SEED_SQL} is current`)
} else {
  fs.writeFileSync(target, sql)
  console.log(`Wrote ${SEED_SQL} (${(sql.length / 1024).toFixed(0)} KB)`)
}
