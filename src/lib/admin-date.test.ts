import { describe, expect, it } from 'vitest'
import {
  addDays, addMonths, chicagoToday, chicagoZoneAbbreviation, formatDateLabel, instantToWall,
  isSkippedWallTime, monthGrid, parseIsoDate, serializeWall, wallOffset,
} from './admin-date'
import { parseInstant } from './admin-validation'

describe('serializeWall', () => {
  it('uses the winter offset in December and the summer offset in July', () => {
    expect(serializeWall({ date: '2026-12-05', time: '09:00' })).toBe('2026-12-05T09:00:00-06:00')
    expect(serializeWall({ date: '2026-07-04', time: '18:30' })).toBe('2026-07-04T18:30:00-05:00')
  })

  it('produces values parseInstant accepts on both sides of each DST change', () => {
    // 2026: spring forward Mar 8, fall back Nov 1.
    for (const [date, time] of [
      ['2026-03-07', '23:00'], ['2026-03-08', '01:59'], ['2026-03-08', '03:00'],
      ['2026-10-31', '23:00'], ['2026-11-01', '01:30'], ['2026-11-01', '03:00'],
    ]) {
      const value = serializeWall({ date, time })
      expect(() => parseInstant(value, 'Start')).not.toThrow()
      expect(instantToWall(parseInstant(value, 'Start'))).toEqual({ date, time })
    }
  })

  it('flags the hour skipped by spring forward', () => {
    expect(isSkippedWallTime('2026-03-08', '02:30')).toBe(true)
    expect(isSkippedWallTime('2026-03-08', '03:30')).toBe(false)
    expect(() => parseInstant(serializeWall({ date: '2026-03-08', time: '02:30' }), 'Start')).toThrow()
  })

  it('is empty when blank and passes a half-filled value through for the server to reject', () => {
    expect(serializeWall({ date: '', time: '' })).toBe('')
    expect(serializeWall({ date: '2026-12-05', time: '' })).toBe('2026-12-05')
    expect(() => parseInstant('2026-12-05', 'End')).toThrow()
  })
})

describe('instantToWall', () => {
  it('reads a stored UTC instant as Chicago wall time', () => {
    expect(instantToWall('2026-12-05T15:00:00+00:00')).toEqual({ date: '2026-12-05', time: '09:00' })
    expect(instantToWall('2026-07-04T23:30:00Z')).toEqual({ date: '2026-07-04', time: '18:30' })
  })

  it('is blank for empty or invalid values', () => {
    expect(instantToWall(null)).toEqual({ date: '', time: '' })
    expect(instantToWall('not a date')).toEqual({ date: '', time: '' })
  })
})

describe('calendar math', () => {
  it('validates real dates only', () => {
    expect(parseIsoDate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 })
    expect(parseIsoDate('2026-02-29')).toBeNull()
    expect(parseIsoDate('2026-12-5')).toBeNull()
  })

  it('moves across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('lays out a Sunday-first month grid', () => {
    const weeks = monthGrid(2026, 11) // Nov 1 2026 is a Sunday
    expect(weeks[0][0]).toBe('2026-11-01')
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
    expect(weeks.every(week => week.length === 7)).toBe(true)
    expect(monthGrid(2026, 12)[0].slice(0, 2)).toEqual([null, null]) // Dec 1 2026 is a Tuesday
  })

  it('uses the Chicago date for today', () => {
    expect(chicagoToday(new Date('2026-11-23T03:00:00Z'))).toBe('2026-11-22')
  })

  it('labels dates and zones', () => {
    expect(formatDateLabel('2026-12-05')).toBe('Sat, Dec 5, 2026')
    expect(chicagoZoneAbbreviation(wallOffset('2026-12-05', '09:00'))).toBe('CST')
    expect(chicagoZoneAbbreviation(wallOffset('2026-07-04', '09:00'))).toBe('CDT')
  })
})
