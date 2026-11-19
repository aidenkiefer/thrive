import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSeedPlan } from './plan'
import { renderSeedSql, SEED_SQL, SEED_SQL_HEADER, upsertSql } from './sql'

const load = (name: string) => JSON.parse(readFileSync(path.join(process.cwd(), 'migration-files/parsed', `${name}.json`), 'utf8'))

describe('upsertSql', () => {
  it('writes slugs as foreign-key lookups and never updates the conflict key', () => {
    const sql = upsertSql('sermons', [{ slug: 's', title: 'T', speaker_slug: 'a', series_slug: null }])
    expect(sql).toContain('insert into sermons (slug, title, speaker_id, series_id)')
    expect(sql).toContain("(select id from speakers where slug = e->>'speaker_slug')")
    expect(sql).toContain('on conflict (slug) do update set title = excluded.title, speaker_id = excluded.speaker_id, series_id = excluded.series_id;')
    expect(sql).not.toMatch(/slug = excluded\.slug/)
  })
  it('keys occurrences on recurring event and start', () => {
    const sql = upsertSql('event_occurrences', [{ recurring_slug: 'r', start_datetime: 'x', end_datetime: 'y' }])
    expect(sql).toContain('on conflict (recurring_event_id, start_datetime) do update set end_datetime = excluded.end_datetime;')
  })
  it('writes invisible characters as escapes that parse back to the same text', () => {
    const name = `a${String.fromCharCode(0xa0)}b${String.fromCharCode(0x200b)}c`
    const sql = upsertSql('speakers', [{ slug: 'x', name }])
    expect(sql).toContain('a\\u00a0b\\u200bc')
    expect(sql).not.toMatch(/[ ​]/)
    const json = sql.slice(sql.indexOf('$seed$') + 6, sql.lastIndexOf('$seed$'))
    expect(JSON.parse(json)[0].name).toBe(name)
  })
  it('refuses data that would close the quote, and odd column names', () => {
    expect(() => upsertSql('speakers', [{ slug: 'x', name: '$seed$; drop table speakers; --' }])).toThrow(/quote tag/)
    expect(() => upsertSql('speakers', [{ slug: 'x', 'name; --': 'y' }])).toThrow(/column name/)
  })
})

describe(SEED_SQL, () => {
  it('is current with the reviewed exports (regenerate with npx tsx scripts/seed-sql.ts)', () => {
    const plan = buildSeedPlan({
      report: load('migration-report'), speakers: load('speakers'), series: load('sermon_series'), sermons: load('sermons'),
      recurring: load('recurring_events'), oneTime: load('one_time_events'), occurrences: load('event_occurrences'),
    })
    expect(readFileSync(path.join(process.cwd(), SEED_SQL), 'utf8') === renderSeedSql(plan, SEED_SQL_HEADER)).toBe(true)
  })
})
