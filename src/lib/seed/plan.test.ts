import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildSeedPlan, checkExpresso, chicagoWeekdayTime, EXPECTED_COUNTS, SEED_TABLES,
  type Row, type SeedExports,
} from './plan'

const load = (name: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'migration-files/parsed', `${name}.json`), 'utf8'))

const real: SeedExports = {
  report: load('migration-report'),
  speakers: load('speakers'),
  series: load('sermon_series'),
  sermons: load('sermons'),
  recurring: load('recurring_events'),
  oneTime: load('one_time_events'),
  occurrences: load('event_occurrences'),
}

const copy = () => structuredClone(real)

describe('buildSeedPlan', () => {
  it('matches EXPECTED_COUNTS for every table', () => {
    const plan = buildSeedPlan(copy())
    for (const t of SEED_TABLES) expect(plan[t]).toHaveLength(EXPECTED_COUNTS[t])
  })

  it('sermons carry slugs, not ids', () => {
    const { sermons } = buildSeedPlan(copy())
    for (const s of sermons) {
      expect(s).toHaveProperty('speaker_slug')
      expect(s).toHaveProperty('series_slug')
      expect(s).not.toHaveProperty('speaker_id')
      expect(s).not.toHaveProperty('series_id')
    }
  })

  it('series published_at is the earliest sermon published_at', () => {
    const plan = buildSeedPlan(copy())
    const withDates = real.sermons.filter(s => s.series_slug && typeof s.published_at === 'string')
    const slug = withDates[0].series_slug
    const times = withDates.filter(s => s.series_slug === slug).map(s => Date.parse(s.published_at as string))
    const series = plan.sermon_series.find(s => s.slug === slug)
    expect(Date.parse(series?.published_at as string)).toBe(Math.min(...times))
  })

  it('cleanUrl turns &amp; into &', () => {
    const x = copy()
    x.sermons[0].audio_url = 'https://example.com/a?x=1&amp;y=2'
    expect(buildSeedPlan(x).sermons[0].audio_url).toBe('https://example.com/a?x=1&y=2')
  })
})

describe('buildSeedPlan rejections', () => {
  it('wrong report', () => {
    const x = copy()
    ;(x.report.events as Row).source = 79
    expect(() => buildSeedPlan(x)).toThrow('not the reviewed November export')
  })

  it('duplicate sermon slug', () => {
    const x = copy()
    x.sermons[1].slug = x.sermons[0].slug
    expect(() => buildSeedPlan(x)).toThrow('duplicate slugs')
  })

  it('slug in both event tables', () => {
    const x = copy()
    x.oneTime[0].slug = x.recurring[0].slug
    expect(() => buildSeedPlan(x)).toThrow('both event tables')
  })

  it('occurrence with unknown recurring_slug', () => {
    const x = copy()
    x.occurrences[0].recurring_slug = 'nope'
    expect(() => buildSeedPlan(x)).toThrow('unknown recurring event')
  })

  it('sermon with unknown speaker_slug', () => {
    const x = copy()
    x.sermons[0].speaker_slug = 'nobody'
    expect(() => buildSeedPlan(x)).toThrow('Missing speaker')
  })

  it('dropped sermon', () => {
    const x = copy()
    x.sermons.pop()
    expect(() => buildSeedPlan(x)).toThrow('claims 120, export has 119')
  })

  it.each([
    ['sermons', 'speakers', 'speakers'], ['sermons', 'series', 'sermon_series'], ['events', 'recurring', 'recurring_events'],
    ['events', 'one_time', 'one_time_events'], ['occurrences', 'generated', 'event_occurrences'],
  ])('report count %s.%s that disagrees with the parsed rows', (section, field, table) => {
    const x = copy()
    ;(x.report[section] as Row)[field] = 999
    expect(() => buildSeedPlan(x)).toThrow(`${table}: migration-report.json claims 999`)
  })

  it('report and rows that agree with each other but not with the approved counts', () => {
    const x = copy()
    x.occurrences.pop()
    ;(x.report.occurrences as Row).generated = 55
    expect(() => buildSeedPlan(x)).toThrow('event_occurrences: export has 55 rows, expected 56')
  })
})

describe('Express(o)', () => {
  const plan = () => buildSeedPlan(copy())

  it('passes on the real plan', () => {
    const p = plan()
    expect(() => checkExpresso(p.recurring_events, p.event_occurrences)).not.toThrow()
  })

  it('throws on a wrong typical_time', () => {
    const p = plan()
    const row = p.recurring_events.find(r => r.slug === 'expresso-service') as Row
    row.typical_time = '9:30 AM'
    expect(() => checkExpresso(p.recurring_events, p.event_occurrences)).toThrow('Express(o)')
  })

  it('throws when an occurrence is on a Saturday', () => {
    const p = plan()
    const occ = p.event_occurrences.find(o => o.recurring_slug === 'expresso-service') as Row
    occ.start_datetime = '2026-11-07T08:30:00-06:00'
    expect(() => checkExpresso(p.recurring_events, p.event_occurrences)).toThrow('1 occurrence')
  })

  it('throws when an occurrence is at 09:30 Chicago', () => {
    const p = plan()
    const occ = p.event_occurrences.find(o => o.recurring_slug === 'expresso-service') as Row
    occ.start_datetime = '2026-11-08T09:30:00-06:00'
    expect(() => checkExpresso(p.recurring_events, p.event_occurrences)).toThrow('not on Sunday')
  })

  it('chicagoWeekdayTime handles CST and CDT instants', () => {
    expect(chicagoWeekdayTime('2026-11-08T08:30:00-06:00')).toEqual(['Sun', '08:30'])
    expect(chicagoWeekdayTime('2026-03-08T08:30:00-05:00')).toEqual(['Sun', '08:30'])
  })
})
