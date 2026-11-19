import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isReservedSlug, RESERVED_SLUGS } from './reserved-slugs'

const appDir = path.join(process.cwd(), 'src/app')
const dirs = (dir: string) => readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
const isGroup = (name: string) => /^\(.*\)$/.test(name)
const isSpecial = (name: string) => /^[[_@]/.test(name) // dynamic, private and parallel-route folders own no fixed slug

/** Every fixed first URL segment the app router serves: top-level folders, with route groups flattened. */
function topLevelSegments(): string[] {
  return dirs(appDir).flatMap(name => (isGroup(name) ? dirs(path.join(appDir, name)) : [name]))
    .filter(name => !isGroup(name) && !isSpecial(name))
    .sort()
}

describe('RESERVED_SLUGS', () => {
  it('covers every top-level route folder, so a landing page can never shadow or be shadowed by one', () => {
    expect(topLevelSegments().filter(s => !RESERVED_SLUGS.includes(s))).toEqual([])
  })
  it('keeps admin and api, and both lists it replaced (docs/05 + the public [slug] page)', () => {
    const docs05 = ['plan-a-visit', 'sermons', 'events', 'groups', 'kids-youth', 'outreach', 'about', 'give', 'ministries', 'admin']
    const publicPage = [...docs05, 'feedback', 'get-connected']
    for (const slug of ['admin', 'api', ...publicPage]) expect(RESERVED_SLUGS, slug).toContain(slug)
  })
  it('has no duplicates and only valid slugs', () => {
    expect(new Set(RESERVED_SLUGS).size).toBe(RESERVED_SLUGS.length)
    for (const slug of RESERVED_SLUGS) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
})

describe('isReservedSlug', () => {
  it('rejects reserved slugs in any case or padding, and accepts others', () => {
    expect(isReservedSlug('feedback')).toBe(true)
    expect(isReservedSlug(' Get-Connected ')).toBe(true)
    expect(isReservedSlug('easter-2027')).toBe(false)
    expect(isReservedSlug('feedbacks')).toBe(false)
  })
})
