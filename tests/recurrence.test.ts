import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

type Expansion = { starts: string[]; issues: { type: string; slug: string }[] }
const cases = JSON.parse(execFileSync('python3', ['-B', fileURLToPath(new URL('./recurrence_cases.py', import.meta.url))], {
  encoding: 'utf8',
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
})) as {
  spring: Expansion; fall: Expansion; invalid: Expansion; fortnightly: Expansion
  owner: Expansion & { typical_time: string; venue: string; source: string }
  labels: string[]
}

describe('real export recurrence helpers', () => {
  it('keeps Sunday wall time through the spring DST transition', () => {
    expect(cases.spring).toEqual({ starts: ['2026-03-01T08:30:00-06:00', '2026-03-08T08:30:00-05:00', '2026-03-15T08:30:00-05:00'], issues: [] })
  })
  it('keeps Sunday wall time through the fall DST transition', () => {
    expect(cases.fall).toEqual({ starts: ['2026-10-25T08:30:00-05:00', '2026-11-01T08:30:00-06:00', '2026-11-08T08:30:00-06:00'], issues: [] })
  })
  it('uses the owner-confirmed Express(o) Sunday 8:30 cafe schedule', () => {
    expect(cases.owner.starts).toEqual(['2026-11-01T08:30:00-06:00', '2026-11-08T08:30:00-06:00', '2026-11-15T08:30:00-06:00'])
    expect(cases.owner.issues).toEqual([])
    expect(cases.owner.typical_time).toBe('8:30 AM')
    expect(cases.owner.venue).toBe('Cafe')
    expect(cases.owner.source).toContain('Owner, 2026-11-07')
  })
  it('reports an invalid interval instead of generating forever', () => {
    expect(cases.invalid).toEqual({ starts: [], issues: [{ type: 'invalid_recurrence_interval', slug: 'test-weekly' }] })
  })
  it('keeps a fortnightly cadence across the offset change', () => {
    expect(cases.fortnightly).toEqual({ starts: ['2026-03-01T08:30:00-06:00', '2026-03-15T08:30:00-05:00', '2026-03-29T08:30:00-05:00'], issues: [] })
  })
  it('labels weekly and fortnightly rules from their real weekday', () => {
    expect(cases.labels).toEqual(['Sundays', 'Every other Sunday'])
  })
})
