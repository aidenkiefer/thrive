import { describe, expect, it } from 'vitest'
import { GOOGLE_ADS_CONVERSION_ID, GTM_CONTAINER_ID } from './ids'
import { isTrackingEnabled } from './tracking'

describe('isTrackingEnabled', () => {
  it('is true only for production', () => {
    expect(isTrackingEnabled('production')).toBe(true)
  })

  it.each(['preview', 'development', 'test', '', undefined])('is false for %s', (env) => {
    expect(isTrackingEnabled(env)).toBe(false)
  })
})

describe('tracking ids', () => {
  it('match the audited live-site IDs', () => {
    expect(GTM_CONTAINER_ID).toBe('GTM-NQV3Z3N7')
    expect(GOOGLE_ADS_CONVERSION_ID).toBe('AW-16575196430')
  })
})
