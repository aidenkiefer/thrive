import { describe, expect, it } from 'vitest'

import { decodeHtmlEntities } from './decode-entities'

describe('decodeHtmlEntities', () => {
  it('returns null for null', () => {
    expect(decodeHtmlEntities(null)).toBeNull()
  })

  it('leaves already-clean text unchanged', () => {
    expect(decodeHtmlEntities('Test Title One')).toBe('Test Title One')
    expect(decodeHtmlEntities('')).toBe('')
    expect(decodeHtmlEntities('Rock & Roll')).toBe('Rock & Roll')
  })

  it('decodes basic named entities', () => {
    expect(decodeHtmlEntities('A &amp; B')).toBe('A & B')
    expect(decodeHtmlEntities('&lt;b&gt;')).toBe('<b>')
    expect(decodeHtmlEntities('&quot;Q&quot; &apos;S&apos;')).toBe('"Q" \'S\'')
    expect(decodeHtmlEntities('a&nbsp;b')).toBe('a b')
  })

  it('decodes typographic named entities', () => {
    expect(decodeHtmlEntities('&lsquo;x&rsquo;')).toBe('‘x’')
    expect(decodeHtmlEntities('&ldquo;x&rdquo;')).toBe('“x”')
    expect(decodeHtmlEntities('1&ndash;2 &mdash; and&hellip;')).toBe('1–2 — and…')
  })

  it('decodes decimal numeric references', () => {
    expect(decodeHtmlEntities('Test&#039;s Title')).toBe("Test's Title")
    expect(decodeHtmlEntities('Test&#39;s')).toBe("Test's")
    expect(decodeHtmlEntities('Test&#8217;s')).toBe('Test’s')
  })

  it('decodes hex numeric references in either case', () => {
    expect(decodeHtmlEntities('Test&#x27;s')).toBe("Test's")
    expect(decodeHtmlEntities('Test&#X2019;s')).toBe('Test’s')
    expect(decodeHtmlEntities('&#x1F600;')).toBe('\u{1F600}')
  })

  it('decodes exactly once', () => {
    expect(decodeHtmlEntities('A &amp;amp; B')).toBe('A &amp; B')
    expect(decodeHtmlEntities('&amp;#039;')).toBe('&#039;')
    expect(decodeHtmlEntities('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;')
  })

  it('leaves unknown or malformed entities untouched', () => {
    expect(decodeHtmlEntities('&notarealentity; x')).toBe('&notarealentity; x')
    expect(decodeHtmlEntities('&amp no semicolon')).toBe('&amp no semicolon')
    expect(decodeHtmlEntities('&AMP;')).toBe('&AMP;')
    expect(decodeHtmlEntities('&#0;')).toBe('&#0;')
    expect(decodeHtmlEntities('&#xD800;')).toBe('&#xD800;')
    expect(decodeHtmlEntities('&#x110000;')).toBe('&#x110000;')
    expect(decodeHtmlEntities('&constructor;')).toBe('&constructor;')
  })

  it('handles several entity classes in one string', () => {
    expect(decodeHtmlEntities('Test &amp; Title&#039;s &ldquo;Q&#x201D;')).toBe(
      'Test & Title\'s “Q”',
    )
  })
})
