import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MinistryScheduleSignup } from '../src/components/ministries/MinistryScheduleSignup'
import { ministryDisplayCases } from './fixtures/ministry-display'

function render(caseName: keyof typeof ministryDisplayCases) {
  return renderToStaticMarkup(createElement(MinistryScheduleSignup, {
    name: 'Example ministry',
    ...ministryDisplayCases[caseName],
  }))
}

describe('public ministry schedule and signup', () => {
  it('renders a configured schedule and approved form with an accessible title', () => {
    const html = render('configured')
    expect(html).toContain(ministryDisplayCases.configured.schedule_description)
    expect(html).toContain(`<iframe src="${ministryDisplayCases.configured.churchsuite_form_url}"`)
    expect(html).toContain('title="Example ministry signup form"')
    expect(html).not.toContain('Signup details are coming soon.')
  })

  it('shows an intentional empty state without a schedule or form', () => {
    const html = render('absent')
    expect(html).toContain('Signup details are coming soon.')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('Sundays at 8:30 AM')
  })

  it('renders the schedule but never embeds a rejected destination', () => {
    const html = render('rejected')
    expect(html).toContain(ministryDisplayCases.rejected.schedule_description)
    expect(html).toContain('Signup details are coming soon.')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain(ministryDisplayCases.rejected.churchsuite_form_url)
  })
})
