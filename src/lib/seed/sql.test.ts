import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSeedPlan } from './plan'
import { publishSql, renderSeedSql, SEED_SQL, SEED_SQL_HEADER, upsertSql } from './sql'

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

describe('publishing as the seed actor (#94)', () => {
  const rows = [{ slug: 'a', title: 'A', published_at: '2024-07-19T19:18:45-05:00' }, { slug: 'b', title: 'B', published_at: null }]

  it('upserts publishable rows as drafts: published_at is never inserted or updated', () => {
    const sql = upsertSql('sermon_series', rows)
    expect(sql).toContain('insert into sermon_series (slug, title)')
    expect(sql).not.toContain('published_at')
  })
  it('publishes only dated rows, as the active seed actor, with their own time', () => {
    const sql = publishSql('sermon_series', rows)!
    expect(sql).toContain("select public.cms_set_published('sermon_series', t.id, true, (select actor_id from admin_staff_accounts where kind = 'system' and name = 'seed' and status = 'active'), (e->>'published_at')::timestamptz)")
    expect(sql).toContain('[{"slug":"a","published_at":"2024-07-19T19:18:45-05:00"}]')
    expect(sql).not.toContain('"b"')
  })
  it('never overrides a publish state someone already changed', () => {
    expect(publishSql('sermons', rows)).toContain("where not exists (select 1 from publication_events p where p.entity_type = 'sermon' and p.entity_id = t.id);")
  })
  it('writes nothing for tables without a publish state or without dated rows', () => {
    expect(publishSql('speakers', [{ slug: 'x', name: 'X' }])).toBeNull()
    expect(publishSql('event_occurrences', [{ recurring_slug: 'r', start_datetime: 'x' }])).toBeNull()
    expect(publishSql('sermons', [{ slug: 'x', published_at: null }])).toBeNull()
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
  it('refuses without an active seed actor and never inserts or updates published_at', () => {
    const sql = readFileSync(path.join(process.cwd(), SEED_SQL), 'utf8')
    expect(sql).toContain("raise exception 'seed refused: no active seed system actor")
    expect(sql).not.toMatch(/insert into \w+ \([^)]*published_at/)
    expect(sql).not.toContain('published_at = excluded.published_at')
    expect((sql.match(/^select public\.cms_set_published\(/gm) ?? []).length).toBe(4)
  })
})
