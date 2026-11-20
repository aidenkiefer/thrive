import { describe, expect, it } from 'vitest'
import { pageMetadata } from './metadata'
import { SITE } from '../content/site-info'

describe('pageMetadata', () => {
  it('returns title, description, canonical, openGraph and twitter for a record image', () => {
    const result = pageMetadata({
      title: 'Fixture Sermon',
      description: 'Fixture description',
      path: '/sermons/fixture',
      image: 'https://example.test/fixture.jpg',
    })

    expect(result.title).toBe('Fixture Sermon')
    expect(result.description).toBe('Fixture description')
    expect(result.alternates).toEqual({ canonical: '/sermons/fixture' })
    expect(result.openGraph).toMatchObject({
      title: 'Fixture Sermon',
      description: 'Fixture description',
      url: 'https://thrivevineyard.com/sermons/fixture',
      siteName: SITE.shortName,
      type: 'website',
      images: ['https://example.test/fixture.jpg'],
    })
    expect(result.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Fixture Sermon',
      description: 'Fixture description',
      images: ['https://example.test/fixture.jpg'],
    })
  })

  it('falls back to /og when there is no image', () => {
    const result = pageMetadata({ title: 'Fixture Page', path: '/fixture' })
    const [image] = (result.openGraph as { images: string[] }).images
    expect(image).toBe('https://thrivevineyard.com/og?title=Fixture%20Page')
  })

  it('falls back to /og for an unsafe image protocol instead of using it', () => {
    const result = pageMetadata({ title: 'Fixture Page', path: '/fixture', image: 'javascript:alert(1)' })
    const [image] = (result.openGraph as { images: string[] }).images
    expect(image).toBe('https://thrivevineyard.com/og?title=Fixture%20Page')
  })

  it('falls back to the site tagline when there is no description', () => {
    const result = pageMetadata({ title: 'Fixture Page', path: '/fixture' })
    expect(result.description).toBe(SITE.tagline)
  })
})
