import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { RateLimitStore, SubjectLimiter } from './index'
import { API_ROUTES, type RouteProtection } from './routes'

const root = process.cwd()
const apiDir = path.join(root, 'src/app/api')

/** Route keys (`api/...`) for every route.ts under src/app/api. */
function routeFiles(): string[] {
  return (readdirSync(apiDir, { recursive: true }) as string[])
    .filter(f => path.basename(f) === 'route.ts')
    .map(f => path.posix.join('api', path.dirname(f).split(path.sep).join('/')))
    .sort()
}

const stripExt = (p: string) => p.replace(/\.(ts|tsx)$/, '').replace(/\/index$/, '')

/** Repo-relative module paths a file imports (relative and `@/` specifiers only). */
function importsOf(file: string, source: string): string[] {
  return [...source.matchAll(/from\s+'([^']+)'/g)].map(m => m[1])
    .filter(s => s.startsWith('.') || s.startsWith('@/'))
    .map(s => stripExt(s.startsWith('@/') ? path.posix.join('src', s.slice(2)) : path.posix.join(path.posix.dirname(file), s)))
}

/** Everything wrong with the manifest against the given route files; empty means covered. */
function coverageProblems(routes: string[], manifest: Record<string, RouteProtection>, read: (file: string) => string): string[] {
  const problems: string[] = []
  for (const r of routes) if (!manifest[r]) problems.push(`${r}: route has no entry in src/lib/rate-limit/routes.ts`)
  for (const r of Object.keys(manifest)) if (!routes.includes(r)) problems.push(`${r}: entry has no route file`)
  for (const [r, p] of Object.entries(manifest)) {
    if (p.class === 'exempt') {
      if (!p.reason.trim()) problems.push(`${r}: exempt needs a reason`)
      continue
    }
    if (p.chain[0] !== `src/app/${r}/route.ts`) problems.push(`${r}: chain must start at the route file`)
    p.chain.forEach((file, i) => {
      const source = read(file)
      if (source.includes('new Map(')) problems.push(`${r}: ${file} looks like an in-memory limiter (new Map)`)
      const next = p.chain[i + 1]
      if (next && !importsOf(file, source).includes(stripExt(next))) problems.push(`${r}: ${file} does not import ${next}`)
      if (!next) {
        if (!importsOf(file, source).includes('src/lib/rate-limit')) problems.push(`${r}: ${file} does not import the shared limiter`)
        if (!source.includes('createSubjectLimiter(')) problems.push(`${r}: ${file} does not call createSubjectLimiter()`)
        for (const purpose of p.purposes) if (!source.includes(`purpose: '${purpose}'`)) problems.push(`${r}: ${file} has no rule for ${purpose}`)
      }
    })
  }
  return problems
}

const readRepo = (file: string) => readFileSync(path.join(root, file), 'utf8')

describe('API route manifest', () => {
  it('classifies every route, and every limited route reaches the shared limiter', () => {
    expect(coverageProblems(routeFiles(), API_ROUTES, readRepo)).toEqual([])
  })
  it('fails for a new route that is not in the manifest', () => {
    expect(coverageProblems([...routeFiles(), 'api/new-thing'], API_ROUTES, readRepo))
      .toEqual(['api/new-thing: route has no entry in src/lib/rate-limit/routes.ts'])
  })
  it('fails when a limited route stops reaching the limiter or drops a purpose', () => {
    const forms = API_ROUTES['api/forms/[formId]']
    const read = (file: string) => file.endsWith('forms/[formId]/route.ts')
      ? readRepo(file).replace(/createSubjectLimiter\(\)/g, 'makeLocalLimiter()')
      : readRepo(file)
    expect(coverageProblems(routeFiles(), API_ROUTES, read)).toEqual(['api/forms/[formId]: src/app/api/forms/[formId]/route.ts does not call createSubjectLimiter()'])
    const dropped = { ...API_ROUTES, 'api/forms/[formId]': { ...forms, purposes: ['form.submit', 'form.other'] } as RouteProtection }
    expect(coverageProblems(routeFiles(), dropped, readRepo)).toEqual(['api/forms/[formId]: src/app/api/forms/[formId]/route.ts has no rule for form.other'])
  })
  it('gives every purpose to exactly one route (one limit and window per purpose)', () => {
    const purposes = Object.values(API_ROUTES).flatMap(p => (p.class === 'limited' ? p.purposes : []))
    expect(new Set(purposes).size).toBe(purposes.length)
  })
})

// Fail closed through the real route handlers: every shared-limiter call hits a broken store.
const state = vi.hoisted(() => ({
  limiter: null as unknown as SubjectLimiter,
  submit: vi.fn(),
}))

vi.mock('./index', async importOriginal => ({
  ...(await importOriginal<typeof import('./index')>()),
  createSubjectLimiter: () => ((rule, subject) => state.limiter(rule, subject)) as SubjectLimiter,
}))
vi.mock('../forms/submit', () => ({ submitWebsiteForm: state.submit }))

const broken: RateLimitStore = { take: async () => { throw new Error('boom') } }
const json = (url: string, body: unknown) => new NextRequest(url, {
  method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
})

describe('limiter store failure closes every limited route', () => {
  beforeEach(async () => {
    const { createSubjectLimiter } = await vi.importActual<typeof import('./index')>('./index')
    state.limiter = createSubjectLimiter({ secret: 's'.repeat(32), store: broken, log: () => {} })
    state.submit.mockReset()
  })

  it('public POST /api/forms/[formId]: 503, nothing sent', async () => {
    const { POST } = await import('../../app/api/forms/[formId]/route')
    const res = await POST(json('http://localhost/api/forms/feedback', { category: 'bug', name: 'Zed Quimby', message: 'hello there' }),
      { params: Promise.resolve({ formId: 'feedback' }) })
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'unavailable' })
    expect(state.submit).not.toHaveBeenCalled()
  })

  it('login POST /api/admin-login/request-code: 503, never "accepted"', async () => {
    const { POST } = await import('../../app/api/admin-login/request-code/route')
    const res = await POST(json('http://localhost/api/admin-login/request-code', { email: 'someone@example.com' }))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'unavailable' })
  })
})
