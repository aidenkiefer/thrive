import { describe, expect, it } from 'vitest'
import { isApprovedFormUrl } from '../src/lib/form-urls'
import { ministryDisplayCases } from './fixtures/ministry-display'

describe('E4 ministry signup fixture contract', () => {
  it('allows a configured schedule and approved hosted form', () => {
    const { schedule_description, churchsuite_form_url } = ministryDisplayCases.configured
    expect(schedule_description).toBeTruthy()
    expect(isApprovedFormUrl(churchsuite_form_url)).toBe(true)
  })

  it('keeps absent optional fields absent', () => {
    const { schedule_description, churchsuite_form_url } = ministryDisplayCases.absent
    expect(schedule_description).toBeNull()
    expect(isApprovedFormUrl(churchsuite_form_url)).toBe(false)
  })

  it('rejects a lookalike host even when the schedule is populated', () => {
    const { schedule_description, churchsuite_form_url } = ministryDisplayCases.rejected
    expect(schedule_description).toBeTruthy()
    expect(isApprovedFormUrl(churchsuite_form_url)).toBe(false)
  })

  it.each([
    'http://thrivevineyard.churchsuite.com/forms/example',
    'https://churchsuite.com.evil.example/forms/example',
    'https://docs.google.com/document/d/example',
    'https://forms.gle.evil.example/example',
    'https://thrivevineyard.churchsuite.com:8443/forms/example',
  ])('rejects unsafe hosted form destination %s', url => {
    expect(isApprovedFormUrl(url)).toBe(false)
  })

  it.each([
    'https://docs.google.com/forms/d/example/viewform',
    'https://forms.gle/example',
  ])('accepts approved Google form destination %s', url => {
    expect(isApprovedFormUrl(url)).toBe(true)
  })
})
