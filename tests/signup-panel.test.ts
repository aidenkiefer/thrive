import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SignupPanel } from '../src/components/signup/SignupPanel'
import {
  formProvider,
  resolveResponderUrl,
  isDemoFormUrl,
} from '../src/components/signup/signup-form'
import { signupFormUrls as u } from './fixtures/signup-panel'

function render(props: Parameters<typeof SignupPanel>[0]) {
  return renderToStaticMarkup(createElement(SignupPanel, props))
}

describe('signup-form helpers', () => {
  it('detects the hosting provider for approved URLs', () => {
    expect(formProvider(u.churchsuiteLive)).toBe('churchsuite')
    expect(formProvider(u.googleLive)).toBe('google')
    expect(formProvider(u.rejected)).toBeNull()
  })

  it('resolves responder URLs but refuses editor and response links', () => {
    expect(resolveResponderUrl(u.googleLive)).toBe(u.googleLive)
    expect(resolveResponderUrl(u.churchsuiteLive)).toBe(u.churchsuiteLive)
    expect(resolveResponderUrl(u.googleEditor)).toBeNull()
    expect(resolveResponderUrl(u.googleResponses)).toBeNull()
    expect(resolveResponderUrl(u.rejected)).toBeNull()
    expect(resolveResponderUrl(u.notAUrl)).toBeNull()
  })

  it('flags development fixtures but not live forms', () => {
    expect(isDemoFormUrl(u.googleDemo)).toBe(true)
    expect(isDemoFormUrl(u.churchsuiteDemo)).toBe(true)
    expect(isDemoFormUrl(u.googleLive)).toBe(false)
    expect(isDemoFormUrl(u.churchsuiteLive)).toBe(false)
  })
})

describe('SignupPanel', () => {
  it('hands off to a live Google form in a new tab with a provider label', () => {
    const html = render({ kind: 'event', entityName: 'Synthetic Event', formUrl: u.googleLive, expectSignup: true })
    expect(html).toContain(`href="${u.googleLive}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Google Forms')
    expect(html).not.toContain('Demo preview')
    expect(html).not.toContain('iframe')
  })

  it('clearly marks a development fixture as a demo, not a live signup', () => {
    const html = render({ kind: 'event', entityName: 'Synthetic Event', formUrl: u.googleDemo })
    expect(html).toContain('Demo preview')
    expect(html).toContain('development preview')
    expect(html).toContain('Open demo form')
  })

  it('never exposes an editor link as a public CTA', () => {
    const html = render({ kind: 'event', entityName: 'Synthetic Event', formUrl: u.googleEditor, expectSignup: true })
    expect(html).not.toContain(u.googleEditor)
    expect(html).not.toContain('/edit')
    expect(html).toContain('open yet')
  })

  it('renders a ChurchSuite group CTA with a contact fallback', () => {
    const html = render({ kind: 'group', entityName: 'Synthetic Group', formUrl: u.churchsuiteLive, contactEmail: 'synthetic@example.org', expectSignup: true })
    expect(html).toContain(`href="${u.churchsuiteLive}"`)
    expect(html).toContain('ChurchSuite')
    expect(html).toContain('Join this group')
    expect(html).toContain('mailto:synthetic@example.org')
  })

  it('shows a useful pending state for an open group with no form link', () => {
    const html = render({ kind: 'group', entityName: 'Synthetic Group', formUrl: null, contactEmail: 'synthetic@example.org', expectSignup: true })
    expect(html).toContain('open yet')
    expect(html).toContain('mailto:synthetic@example.org')
  })

  it('renders nothing when no signup is expected and none is configured', () => {
    const html = render({ kind: 'event', entityName: 'Synthetic Event', formUrl: null, expectSignup: false })
    expect(html).toBe('')
  })

  it('never embeds or links a rejected destination', () => {
    const html = render({ kind: 'group', entityName: 'Synthetic Group', formUrl: u.rejected, expectSignup: true })
    expect(html).not.toContain(u.rejected)
  })
})
