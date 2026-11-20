import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'
import { redirectManifest, type ManifestEntry } from './redirect-manifest'

type MapRow = { liveUrls: string[]; destination: string; status: string; excluded: boolean }
type Rule = { source: string; destination: string; permanent?: boolean; statusCode?: number }
const root = fileURLToPath(new URL('../../', import.meta.url))
const normalize = (path: string) => path.replace(/\[([^\]]+)\]/g, ':$1').replace(/\/$/, '') || '/'
const rowKey = (urls: readonly string[]) => [...urls].sort().join(', ')

function parseMap(markdown: string): MapRow[] {
  let inFence = false
  let table: string | undefined
  const rows: MapRow[] = []
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    if (!line.trim().startsWith('|')) { table = undefined; continue }
    const cells = line.trim().split('|').slice(1, -1).map(cell => cell.trim())
    if (/^(Live URL|Live pattern|Live slug|URL pattern)$/.test(cells[0])) { table = cells[0]; continue }
    if (!table || /^:?-+:?$/.test(cells[0])) continue
    const coded = [...cells[0].matchAll(/`([^`]+)`/g)].map(match => match[1])
    const liveUrls = coded.length ? coded : cells[0].split(',').map(url => url.trim())
    rows.push({ liveUrls, destination: cells[1], status: cells[2] ?? '', excluded: table === 'URL pattern' })
  }
  return rows
}

function assertCoverage(rows: MapRow[], manifest: readonly ManifestEntry[]) {
  const documented = rows.map(row => rowKey(row.liveUrls)).sort()
  const recorded = manifest.map(entry => rowKey(entry.liveUrls)).sort()
  expect(recorded, 'Each migration-map row needs exactly one disposition').toEqual(documented)
  const urls = manifest.flatMap(entry => [...entry.liveUrls])
  expect(new Set(urls).size, 'Duplicate URL in redirect manifest').toBe(urls.length)
}

// Match the named and catch-all path parameters used by this configuration.
// Reject future unsupported patterns instead of silently skipping their safety check.
function matchRule(source: string, path: string): Record<string, string> | undefined {
  const names: string[] = []
  const pattern = normalize(source).split('/').map(segment => {
    if (segment.startsWith(':')) {
      const parameter = /^:([A-Za-z]\w*)([+*?]?)$/.exec(segment)
      if (!parameter) throw new Error(`Unsupported redirect source pattern: ${source}`)
      names.push(parameter[1])
      return parameter[2] === '*' ? '(.*)' : parameter[2] === '+' ? '(.+)' : '([^/]+)'
    }
    if (/[()*+?]/.test(segment)) throw new Error(`Unsupported redirect source pattern: ${source}`)
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }).join('/')
  const match = new RegExp(`^${pattern}/?$`).exec(normalize(path))
  return match ? Object.fromEntries(names.map((name, index) => [name, match[index + 1]])) : undefined
}

function assertNoLoops(rules: Rule[]) {
  // Seed named paths with both a neutral slug and literal segments appearing in
  // other sources, so a dynamic redirect into a static rule is checked too.
  const samples = new Set(['sample', ...rules.flatMap(rule => rule.source.split('/').filter(part => part && !part.startsWith(':')))])
  for (const rule of rules) {
    for (const sample of samples) {
      let path = normalize(rule.source.replace(/:[A-Za-z]\w*[+*?]?/g, sample))
      const visited = new Set<string>()
      for (let hop = 0; hop <= 32; hop++) {
        if (visited.has(path)) throw new Error(`Redirect loop at ${path}`)
        visited.add(path)
        const next = rules.map(candidate => ({ candidate, params: matchRule(candidate.source, path) }))
          .find(result => result.params !== undefined)
        if (!next) break
        if (hop === 32) throw new Error(`Redirect loop or chain exceeds 32 hops from ${rule.source}`)
        path = normalize(next.candidate.destination.replace(/:([A-Za-z]\w*)[+*?]?/g, (_, name: string) => next.params![name] ?? `:${name}`))
      }
    }
  }
}

function routePaths(directory: string, segments: string[] = []): string[][] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const found = entries.some(entry => entry.isFile() && /^page\.(tsx?|jsx?|mdx)$/.test(entry.name)) ? [segments] : []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    const transparent = /^\([^)]*\)$/.test(entry.name) || entry.name.startsWith('@')
    found.push(...routePaths(join(directory, entry.name), transparent ? segments : [...segments, entry.name]))
  }
  return found
}

function hasDestinationRoute(destination: string, routes: string[][]) {
  const first = normalize(destination.split(/[?#]/, 1)[0]).split('/')[1]
  // A literal destination must have a named route branch: the root [slug]
  // content route cannot establish that an arbitrary typo is published.
  return routes.some(route => first ? route[0] === first || (first.startsWith(':') && /^\[.+\]$/.test(route[0] ?? '')) : route.length === 0)
}

const rows = parseMap(readFileSync(join(root, 'docs/04-seo-url-migration-map.md'), 'utf8'))
const rules: Rule[] = await nextConfig.redirects!()
const routes = routePaths(join(root, 'src/app'))

describe('SEO migration map contract', () => {
  it('records exactly one disposition per documented row, including every grouped URL', () => {
    expect(rows.length).toBeGreaterThan(0)
    assertCoverage(rows, redirectManifest)
  })

  it.each(rows)('respects the documented disposition for $liveUrls', row => {
    const entry = redirectManifest.find(candidate => rowKey(candidate.liveUrls) === rowKey(row.liveUrls))
    expect(entry).toBeDefined()
    if (!entry) return
    if (row.excluded) expect(entry.disposition).toBe('do-not-migrate')
    else if (row.status.startsWith('implemented')) {
      expect(entry.disposition).toBe('redirect')
      if (entry.disposition !== 'redirect') return
      expect(entry.source).toBe(normalize(row.liveUrls[0]))
      const destination = /`([^`]+)`/.exec(row.destination)?.[1]
      expect(destination, 'Implemented row must record its destination').toBeDefined()
      expect(entry.destination).toBe(normalize(destination!))
      expect(entry.permanent).toBe(!row.status.includes('temporary'))
      expect(rules.filter(rule => rule.source === entry.source)).toEqual([{
        source: entry.source, destination: entry.destination, ...(entry.statusCode ? { statusCode: entry.statusCode } : { permanent: entry.permanent }),
      }])
    } else if (row.status === 'same-path') {
      expect(entry.disposition).toBe('same-path')
      expect(normalize(row.liveUrls[0])).toBe(normalize(/`([^`]+)`/.exec(row.destination)![1]))
    } else {
      expect(entry.disposition).toBe('pending-owner')
      if (entry.disposition === 'pending-owner') expect(entry.reason).toMatch(/https:\/\/github\.com\/aidenkiefer\/thrive\/issues\/\d+/)
    }
  })

  it('does not implement excluded or still-pending sources', () => {
    for (const entry of redirectManifest) {
      if (entry.disposition === 'pending-owner' || entry.disposition === 'do-not-migrate') {
        for (const source of entry.liveUrls) expect(rules.some(rule => rule.source === normalize(source))).toBe(false)
      }
    }
  })

  it('has no self redirects or loops anywhere in the exported config', () => {
    assertNoLoops(rules)
  })

  it.each(redirectManifest.filter(entry => entry.disposition === 'redirect'))('has an App Router destination branch for $liveUrls', entry => {
    if (entry.disposition === 'redirect') expect(hasDestinationRoute(entry.destination, routes), entry.destination).toBe(true)
  })
})

describe('regression fixtures for the migration checks', () => {
  it('rejects a missing manifest row', () => {
    expect(() => assertCoverage(rows, redirectManifest.slice(1))).toThrow()
  })
  it('includes grouped URLs, raw URL cells and excludes fenced examples', () => {
    const fixture = '| Live slug | Suggested handling | Status |\n|---|---|---|\n| `/a/`, `/b/` | Pending | pending |\n| /c/ | Pending | pending |\n\n```md\n| Live URL | New URL | Status |\n| `/ignored/` | `/x` | implemented |\n```'
    expect(parseMap(fixture).map(row => row.liveUrls)).toEqual([['/a/', '/b/'], ['/c/']])
  })
  it('detects static, dynamic and mixed self/loop regressions', () => {
    expect(() => assertNoLoops([{ source: '/same', destination: '/same' }])).toThrow(/loop/)
    expect(() => assertNoLoops([{ source: '/a/:slug', destination: '/b/:slug' }, { source: '/b/:id', destination: '/a/:id' }])).toThrow(/loop/)
    expect(() => assertNoLoops([{ source: '/a/:slug', destination: '/b/:slug' }, { source: '/b/fixed', destination: '/a/fixed' }])).toThrow(/loop/)
    expect(() => assertNoLoops([{ source: '/a/:slug', destination: '/b/:slug' }, { source: '/b/:id', destination: '/final' }])).not.toThrow()
  })
  it('does not accept an arbitrary destination just because a root slug route exists', () => {
    expect(hasDestinationRoute('/typo', [['[slug]'], ['sermons']])).toBe(false)
    expect(hasDestinationRoute('/sermons/:slug', [['sermons', '[slug]']])).toBe(true)
    expect(hasDestinationRoute('/plan-a-visit#services', [['plan-a-visit']])).toBe(true)
  })
})

afterAll(() => {
  const pending = redirectManifest.filter(entry => entry.disposition === 'pending-owner')
  console.info(`SEO pending-owner (${pending.length} rows): ${pending.map(entry => `${entry.liveUrls.join(', ')} — ${entry.disposition === 'pending-owner' ? entry.reason : ''}`).join('; ')}`)
})
