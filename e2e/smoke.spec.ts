import { randomUUID } from 'node:crypto'
import { expect, test as base } from '@playwright/test'

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: async ({ context, page, baseURL }, use) => {
    const errors: string[] = []
    const origin = new URL(baseURL!).origin

    await context.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      if (!['GET', 'HEAD'].includes(request.method())) {
        errors.push(`Unexpected ${request.method()} request to ${url.pathname}`)
        return route.abort('blockedbyclient')
      }
      // Keep requests local, including image URLs the Next optimizer would fetch upstream.
      if (url.origin !== origin || url.pathname === '/_next/image') {
        return route.abort('blockedbyclient')
      }
      return route.continue()
    })

    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' && !message.text().includes('net::ERR_BLOCKED_BY_CLIENT')) {
        errors.push(message.text())
      }
    })

    await use(errors)
  },
})

const publicPaths = [
  '/',
  '/plan-a-visit',
  '/about',
  '/give',
  '/kids-youth',
  '/get-connected',
  '/sermons',
  '/events',
  '/groups',
]

for (const path of publicPaths) {
  test(`${path} serves an HTML page without browser errors`, async ({ page, browserErrors }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    expect(browserErrors).toEqual([])
  })
}

test('/robots.txt serves crawler rules', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^text\/plain\b/i)

  const body = await response.text()
  expect(body).toMatch(/^User-Agent: \*$/im)
  expect(body).toMatch(/^Allow: \/$/im)
  expect(body).toMatch(/^Disallow: \/admin\/$/im)
  expect(body).toMatch(/^Disallow: \/api\/$/im)
  expect(body).toMatch(/^Sitemap: https:\/\/thrivevineyard\.com\/sitemap\.xml$/im)
})

test('/sitemap.xml serves a sitemap with public URLs', async ({ page, request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^(application|text)\/xml\b/i)

  const sitemap = await page.evaluate(xml => {
    const document = new DOMParser().parseFromString(xml, 'application/xml')
    return {
      root: document.documentElement.localName,
      namespace: document.documentElement.namespaceURI,
      urls: Array.from(document.querySelectorAll('url > loc'), entry => entry.textContent),
    }
  }, await response.text())
  expect(sitemap.root).toBe('urlset')
  expect(sitemap.namespace).toBe('http://www.sitemaps.org/schemas/sitemap/0.9')
  expect(sitemap.urls).toEqual(expect.arrayContaining(
    publicPaths.map(path => 'https://thrivevineyard.com' + (path === '/' ? '' : path)),
  ))
})

for (const prefix of ['', '/sermons', '/sermons/series', '/events', '/groups', '/ministries', '/outreach']) {
  test(`${prefix || '/'} returns HTTP 404 and the not-found UI for an unknown path`, async ({ page }) => {
    const response = await page.goto(`${prefix}/smoke-missing-${randomUUID()}`)
    expect.soft(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })
}

// Next.js emits 308 for permanent redirects and 307 for temporary redirects.
const redirects = [
  { source: '/im-new', location: '/plan-a-visit', status: 308 },
  { source: '/teaching', location: '/sermons', status: 308 },
  { source: '/upcoming-events/smoke-slug', location: '/events/smoke-slug', status: 308 },
  { source: '/kids', location: '/kids-youth', status: 308 },
  { source: '/series/smoke-slug', location: '/sermons/series/smoke-slug', status: 308 },
  { source: '/topics/smoke-slug', location: '/sermons', status: 307 },
  { source: '/book/smoke-slug', location: '/sermons', status: 307 },
  { source: '/service-type/smoke-slug', location: '/sermons', status: 307 },
]

for (const { source, location, status } of redirects) {
  test(`${source} redirects to ${location} with HTTP ${status}`, async ({ request }) => {
    const response = await request.get(source, { maxRedirects: 0 })
    expect(response.status()).toBe(status)
    expect(response.headers().location).toBe(location)
  })
}

test('/im-new/ reaches /plan-a-visit and reports each redirect hop', async ({ page, browserErrors }) => {
  const response = await page.goto('/im-new/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveURL('/plan-a-visit')

  const redirects: string[] = []
  for (let request = response!.request().redirectedFrom(); request; request = request.redirectedFrom()) {
    redirects.unshift(new URL(request.url()).pathname)
  }
  const chain = [...redirects, new URL(response!.url()).pathname].join(' -> ')
  test.info().annotations.push({ type: 'redirect hops', description: `${redirects.length}: ${chain}` })
  await test.info().attach('redirect chain', {
    body: `${redirects.length} hop(s): ${chain}`,
    contentType: 'text/plain',
  })
  expect(redirects.length, chain).toBeGreaterThan(0)
  expect(browserErrors).toEqual([])
})

test('/feedback renders the labelled form', async ({ page, browserErrors }) => {
  const response = await page.goto('/feedback')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('group', { name: 'What are you reporting?' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Bug or problem' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Feature idea' })).toBeVisible()
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Reply email (optional)')).toBeVisible()
  await expect(page.getByLabel('Page path (optional)')).toBeVisible()
  const submit = page.getByRole('button', { name: 'Send feedback' })
  await expect(submit).toBeVisible()
  await expect(submit).toHaveAttribute('type', 'submit')
  expect(browserErrors).toEqual([])
})

for (const path of ['/admin', '/admin/events']) {
  test(`${path} redirects an unauthenticated request to login`, async ({ request, baseURL }) => {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(307)

    const location = response.headers().location
    expect(location).toBeTruthy()
    const redirect = new URL(location, baseURL)
    expect(redirect.pathname).toBe('/admin/login')
    expect(['127.0.0.1', 'localhost']).toContain(redirect.hostname)
    expect(redirect.port).toBe(new URL(baseURL!).port)
  })
}

test('the local homepage HTML omits Google Tag Manager', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)
  expect(await response.text()).not.toContain('googletagmanager.com')
})
