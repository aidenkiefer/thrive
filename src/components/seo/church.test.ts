import { describe, expect, it } from 'vitest'
import { SITE } from '../content/site-info'
import { buildChurchJsonLd } from './church'

describe('buildChurchJsonLd', () => {
  const data = buildChurchJsonLd()

  it('is a schema.org Church built from SITE', () => {
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Church')
    expect(data.name).toBe(SITE.name)
    expect(data.description).toBe(SITE.tagline)
    expect(data.telephone).toBe(SITE.phone)
    expect(data.email).toBe(SITE.email)
    expect(data.hasMap).toBe(SITE.mapsUrl)
  })

  it('maps the SITE address onto a PostalAddress', () => {
    expect(data.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
    })
  })

  it('lists the SITE social URLs in sameAs', () => {
    expect(data.sameAs).toEqual(expect.arrayContaining(Object.values(SITE.social)))
  })

  it('survives a JSON round trip', () => {
    expect(JSON.parse(JSON.stringify(data))).toEqual(data)
  })
})
