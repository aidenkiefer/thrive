import { describe, expect, it } from 'vitest'
import { crossTableCollisions, diffFingerprint, diffPlan, diffTable, formatDiff, fromLive, isApplied, rowKey } from './diff'
import { SEED_TABLES, type Row, type SeedPlan, type SeedTable } from './plan'

const empty = () => Object.fromEntries(SEED_TABLES.map(t => [t, [] as Row[]])) as Record<SeedTable, Row[]>

describe('diffTable', () => {
  it('insert, update, unchanged, liveOnly', () => {
    const planned = [
      { slug: 'a', name: 'A' },
      { slug: 'b', name: 'B2', extra: 1 },
      { slug: 'c', name: 'C' },
    ]
    const live = [
      { slug: 'b', name: 'B', extra: 2 },
      { slug: 'c', name: 'C', extra: 'ignored' },
      { slug: 'z', name: 'Z' },
    ]
    const d = diffTable('speakers', planned, live)
    expect(d.insert).toEqual(['a'])
    expect(d.update).toEqual([{ key: 'b', columns: ['name', 'extra'], before: { name: 'B', extra: 2 } }])
    expect(d.unchanged).toBe(1)
    expect(d.liveOnly).toEqual(['z'])
  })

  it('compares instants by value', () => {
    const d = diffTable('sermons',
      [{ slug: 's', published_at: '2026-11-07 00:11:30+00:00' }],
      [{ slug: 's', published_at: '2026-11-06T18:11:30-06:00' }])
    expect(d.unchanged).toBe(1)
  })

  it('compares arrays by content', () => {
    const same = diffTable('sermons', [{ slug: 's', topics: ['a', 'b'] }], [{ slug: 's', topics: ['a', 'b'] }])
    const diff = diffTable('sermons', [{ slug: 's', topics: ['a', 'b'] }], [{ slug: 's', topics: ['b', 'a'] }])
    expect(same.unchanged).toBe(1)
    expect(diff.update[0].columns).toEqual(['topics'])
  })

  it('null equals undefined, empty string differs from null', () => {
    expect(diffTable('speakers', [{ slug: 'a', name: null }], [{ slug: 'a' }]).unchanged).toBe(1)
    expect(diffTable('speakers', [{ slug: 'a', name: '' }], [{ slug: 'a', name: null }]).update).toHaveLength(1)
  })
})

describe('fromLive', () => {
  it('flattens sermon joins', () => {
    const out = fromLive('sermons', { slug: 's', speaker: { slug: 'a' }, series: null })
    expect(out).toEqual({ slug: 's', speaker_slug: 'a', series_slug: null })
    expect(out).not.toHaveProperty('speaker')
    expect(out).not.toHaveProperty('series')
  })

  it('flattens occurrence join', () => {
    const out = fromLive('event_occurrences', { start_datetime: 'x', recurring: { slug: 'x' } })
    expect(out.recurring_slug).toBe('x')
    expect(out).not.toHaveProperty('recurring')
  })
})

describe('rowKey', () => {
  it('occurrence keys match across offset spellings', () => {
    const a = rowKey('event_occurrences', { recurring_slug: 'r', start_datetime: '2026-11-08T08:30:00-06:00' })
    const b = rowKey('event_occurrences', { recurring_slug: 'r', start_datetime: '2026-11-08T14:30:00+00:00' })
    expect(a).toBe(b)
  })
})

describe('diffPlan, isApplied, formatDiff', () => {
  const plan = { ...empty(), speakers: [{ slug: 'a', name: 'A' }] } as SeedPlan

  it('applied when only live-only rows remain', () => {
    const d = diffPlan(plan, { ...empty(), speakers: [{ slug: 'a', name: 'A' }, { slug: 'z', name: 'Z' }] })
    expect(isApplied(d)).toBe(true)
  })

  it('not applied with an insert', () => {
    expect(isApplied(diffPlan(plan, empty()))).toBe(false)
  })

  it('not applied with an update', () => {
    expect(isApplied(diffPlan(plan, { ...empty(), speakers: [{ slug: 'a', name: 'B' }] }))).toBe(false)
  })

  it('formatDiff lists tables and live-only lines', () => {
    const text = formatDiff(diffPlan(plan, { ...empty(), speakers: [{ slug: 'a', name: 'A' }, { slug: 'z', name: 'Z' }] }))
    for (const t of SEED_TABLES) expect(text).toContain(t)
    expect(text).toContain('speakers live-only: z')
  })
})

describe('crossTableCollisions', () => {
  const empty = { speakers: [], sermon_series: [], sermons: [], recurring_events: [], one_time_events: [], event_occurrences: [] }
  it('reports a planned recurring slug that is live as a one-time event, and the reverse', () => {
    const plan = { ...empty, recurring_events: [{ slug: 'youth' }], one_time_events: [{ slug: 'bash' }] }
    const live = { ...empty, one_time_events: [{ slug: 'youth', published_at: 'x' }], recurring_events: [{ slug: 'bash', published_at: 'x' }] }
    expect(crossTableCollisions(plan, live)).toEqual(['youth (live one-time, planned recurring)', 'bash (live recurring, planned one-time)'])
  })
  it('ignores unpublished live rows', () => {
    const plan = { ...empty, recurring_events: [{ slug: 'youth' }] }
    expect(crossTableCollisions(plan, { ...empty, one_time_events: [{ slug: 'youth', published_at: null }] })).toEqual([])
  })
  it('is empty when slugs stay in their own table', () => {
    const plan = { ...empty, recurring_events: [{ slug: 'youth' }] }
    expect(crossTableCollisions(plan, { ...empty, recurring_events: [{ slug: 'youth' }] })).toEqual([])
  })
})

describe('diffFingerprint', () => {
  const plan = [{ slug: 'a', title: 'New' }, { slug: 'b', title: 'B' }]
  const fp = (live: Row[]) => diffFingerprint(diffPlan(
    { speakers: [], sermon_series: plan, sermons: [], recurring_events: [], one_time_events: [], event_occurrences: [] },
    { speakers: [], sermon_series: live, sermons: [], recurring_events: [], one_time_events: [], event_occurrences: [] },
  ))
  it('is stable for the same live state and ignores row order', () => {
    expect(fp([{ slug: 'a', title: 'Old' }])).toBe(fp([{ slug: 'a', title: 'Old' }]))
    expect(fp([{ slug: 'a', title: 'Old' }, { slug: 'b', title: 'x' }])).toBe(fp([{ slug: 'b', title: 'x' }, { slug: 'a', title: 'Old' }]))
  })
  it('changes when a value the seed would overwrite changed since the dry run (a staff edit)', () => {
    expect(fp([{ slug: 'a', title: 'Old' }])).not.toBe(fp([{ slug: 'a', title: 'Edited by staff' }]))
  })
  it('changes when a row that matched now differs, or a row to insert appeared', () => {
    const base = fp([{ slug: 'a', title: 'Old' }, { slug: 'b', title: 'B' }])
    expect(fp([{ slug: 'a', title: 'Old' }, { slug: 'b', title: 'Edited' }])).not.toBe(base)
    expect(fp([{ slug: 'a', title: 'Old' }])).not.toBe(base)
  })
})
