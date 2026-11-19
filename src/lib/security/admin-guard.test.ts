import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config } from '../../middleware'

/**
 * #45: every admin page render and server action re-checks the staff session
 * before it touches data, so the middleware is never the only layer.
 * `adminDb()` counts as a guard because it calls requireAdmin() first (checked below).
 */
const root = process.cwd()
const adminDir = path.join(root, 'src/app/admin')
const LOGIN = 'login/page.tsx'
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')
const GUARD = /\b(requireAdmin|adminDb)\(/
const DATA = /\.from\(|\.rpc\(|\bcreateClient\(|\bfetch\(/

const adminFiles = (readdirSync(adminDir, { recursive: true }) as string[])
  .filter(f => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f))
  .map(f => f.split(path.sep).join('/'))
  .sort()

/** Body of each server action: from its 'use server' to the end of its top-level function. */
function actionBodies(source: string): string[] {
  return source.split(/['"]use server['"]/).slice(1).map(rest => rest.split(/\n}\n/)[0])
}

/** Body of the default-exported page component. */
function pageBody(source: string): string | null {
  const start = source.search(/export default (async )?function/)
  return start < 0 ? null : source.slice(start)
}

/** Null when a guard runs before any data access, else what goes wrong. */
function guardProblem(body: string): string | null {
  const guard = body.search(GUARD)
  const data = body.search(DATA)
  if (guard < 0) return data < 0 ? null : 'reads data without requireAdmin() or adminDb()'
  return data >= 0 && data < guard ? 'reads data before requireAdmin() or adminDb()' : null
}

/** Every guard problem in one admin file. */
function fileProblems(file: string, source: string): string[] {
  const problems: string[] = []
  actionBodies(source).forEach((body, i) => {
    const p = guardProblem(body)
    if (p) problems.push(`${file} server action ${i + 1}: ${p}`)
    else if (!GUARD.test(body)) problems.push(`${file} server action ${i + 1}: never calls requireAdmin() or adminDb()`)
  })
  if (file.endsWith('page.tsx') && file !== LOGIN) {
    const body = pageBody(source)
    if (!body || !GUARD.test(body)) problems.push(`${file}: page never calls requireAdmin() or adminDb()`)
    else { const p = guardProblem(body); if (p) problems.push(`${file}: page ${p}`) }
  }
  if (/@supabase\/supabase-js|@\/lib\/supabase\/|SUPABASE_SERVICE_ROLE_KEY/.test(source)) {
    problems.push(`${file}: builds its own Supabase client (use adminDb())`)
  }
  return problems
}

describe('admin guard coverage', () => {
  it('finds the admin pages and server actions', () => {
    const pages = adminFiles.filter(f => f.endsWith('page.tsx'))
    expect(pages.length).toBeGreaterThanOrEqual(10)
    expect(pages).toContain(LOGIN)
    expect(adminFiles.flatMap(f => actionBodies(read(`src/app/admin/${f}`))).length).toBeGreaterThanOrEqual(9)
  })

  it('every page render and server action calls requireAdmin() or adminDb() before reading data', () => {
    expect(adminFiles.flatMap(f => fileProblems(f, read(`src/app/admin/${f}`)))).toEqual([])
  })

  it('fails for an action that reads before its guard, and for a page with no guard', () => {
    const action = `async function save() {\n  'use server'\n  const { data } = await db.from('groups').select('id')\n  await requireAdmin()\n}\n`
    expect(fileProblems('x/page.tsx', `${action}export default async function P() { return null }`)).toEqual([
      'x/page.tsx server action 1: reads data before requireAdmin() or adminDb()',
      'x/page.tsx: page never calls requireAdmin() or adminDb()',
    ])
  })

  it('the login page reads no admin data', () => {
    expect(read('src/app/admin/login/page.tsx')).not.toMatch(GUARD)
  })

  it('adminDb() checks the session before it creates the service-role client', () => {
    const source = read('src/lib/admin-db.ts')
    const body = source.slice(source.indexOf('export async function adminDb'))
    expect(body.indexOf('await requireAdmin()')).toBeGreaterThan(-1)
    expect(body.indexOf('await requireAdmin()')).toBeLessThan(body.indexOf('createClient('))
  })
})

describe('middleware', () => {
  it('matches /admin and everything under it', () => {
    expect(config.matcher).toEqual(['/admin/:path*'])
  })
  it('exempts only /admin/login', () => {
    const source = read('src/middleware.ts')
    expect(source).toContain(`const isLoginPage = pathname === '/admin/login'`)
    expect(source.match(/pathname\s*(===|!==|\.startsWith|\.endsWith|\.includes|\.match)/g)).toEqual(['pathname ==='])
  })
})
