import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))
const wordpressReference = /thrivevineyard\.com\/wp-content(?:\/uploads)?|wp-content\/uploads/gi

// Exact existing lines, each permitted once. New references in these files still fail.
// Remove an entry when its source is re-hosted; stale entries are reported below.
const allowlist = [
  {
    path: 'src/components/content/photos.ts',
    line: "const BASE = 'https://thrivevineyard.com/wp-content/uploads'",
  },
  {
    path: 'src/components/events/CardImage.tsx',
    line: "if (url.hostname === 'thrivevineyard.com') return url.pathname.startsWith('/wp-content/uploads/')",
  },
  {
    path: 'next.config.ts',
    line: "pathname: '/wp-content/uploads/**',",
  },
] as const

type SourceFile = { path: string; content: string }
type Exception = { path: string; line: string }

function audit(files: SourceFile[], exceptions: readonly Exception[]) {
  const used = new Set<number>()
  const unexpected: string[] = []
  for (const file of files) {
    file.content.split(/\r?\n/).forEach((line, index) => {
      // The longer alternative consumes the overlapping host/path pattern once.
      const matches = [...line.matchAll(wordpressReference)]
      if (matches.length === 0) return
      const exception = exceptions.findIndex((entry, entryIndex) =>
        !used.has(entryIndex) && entry.path === file.path && entry.line === line.trim(),
      )
      if (exception >= 0 && matches.length === 1) used.add(exception)
      else unexpected.push(`${file.path}:${index + 1}`)
    })
  }
  return {
    unexpected,
    stale: exceptions.filter((_, index) => !used.has(index)).map(entry => entry.path),
  }
}

function sources(): SourceFile[] {
  const result: SourceFile[] = []
  function visit(relative: string) {
    for (const entry of readdirSync(resolve(root, relative), { withFileTypes: true })) {
      const path = `${relative}/${entry.name}`
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) read(path)
    }
  }
  function read(path: string) {
    const bytes = readFileSync(resolve(root, path))
    if (bytes.includes(0)) return
    try {
      result.push({ path, content: new TextDecoder('utf-8', { fatal: true }).decode(bytes) })
    } catch (error) {
      // A decoding error identifies binary assets; other failures must surface.
      if (!(error instanceof TypeError)) throw error
    }
  }
  for (const directory of ['src', 'content']) visit(directory)
  // Git does not retain an empty public directory. Scan it as soon as assets exist.
  if (existsSync(resolve(root, 'public'))) visit('public')
  read('next.config.ts')
  return result
}

describe('WordPress media retirement guard', () => {
  it('rejects references beyond the explicit existing source lines', () => {
    const result = audit(sources(), allowlist)
    if (result.stale.length > 0) {
      console.warn(`WordPress media allowlist can shrink: ${result.stale.join(', ')}`)
    }
    expect(result.unexpected, 'Re-host new media; do not widen the WordPress allowlist.').toEqual([])
  })

  it('rejects a new component reference and growth inside an allowed file', () => {
    const existing = { path: allowlist[0].path, content: allowlist[0].line }
    const newComponent = { path: 'src/components/new-media.tsx', content: "const image = '/wp-content/uploads/new.jpg'" }
    expect(audit([newComponent], allowlist).unexpected).toEqual(['src/components/new-media.tsx:1'])
    expect(audit([{ ...existing, content: `${existing.content}\n${newComponent.content}` }], allowlist).unexpected)
      .toEqual([`${existing.path}:2`])
    expect(audit([{ ...existing, content: `${existing.content}\n${existing.content}` }], allowlist).unexpected)
      .toEqual([`${existing.path}:2`])
  })

  it('allows removal while identifying the stale exception', () => {
    const result = audit([{ path: allowlist[0].path, content: "const BASE = '/images'" }], [allowlist[0]])
    expect(result.unexpected).toEqual([])
    expect(result.stale).toEqual([allowlist[0].path])
  })

  it('detects either legacy pattern without double-counting their overlap', () => {
    const path = 'public/legacy.css'
    const result = audit([{ path, content: "url(https://thrivevineyard.com/wp-content/cache/a.png)\nurl(/wp-content/uploads/a.png)" }], [])
    expect(result.unexpected).toEqual([`${path}:1`, `${path}:2`])
    expect(audit([{ path: allowlist[0].path, content: allowlist[0].line }], [allowlist[0]]).unexpected).toEqual([])
  })
})
