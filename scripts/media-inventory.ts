/**
 * Read-only WordPress media inventory (#49).
 *
 *   npx tsx scripts/media-inventory.ts --sql        write supabase/ops/media/wordpress-media-audit.sql
 *   npx tsx scripts/media-inventory.ts --checklist  write supabase/ops/media/wordpress-media-checklist.md
 *   npx tsx scripts/media-inventory.ts --code       print code-held references (src/, content/, next.config.ts)
 *   npx tsx scripts/media-inventory.ts --json       print the seed-held inventory as JSON
 *   --bucket <name>  bucket shown in the checklist (default site-media)
 *
 * Reads local files only. No network, Storage or database access.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_BUCKET,
  auditSql,
  checklistMarkdown,
  codeReferences,
  inventory,
  loadSeedSources,
} from '../src/lib/media/wordpress-inventory'

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'supabase/ops/media')

function walk(relative: string, files: string[]) {
  const absolute = path.join(root, relative)
  if (!existsSync(absolute)) return
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const next = `${relative}/${entry.name}`
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) walk(next, files)
    else if (/\.(tsx?|jsx?|mjs|mdx?|json|css)$/.test(entry.name)) files.push(next)
  }
}

function main(argv: string[]) {
  const bucketAt = argv.indexOf('--bucket')
  const bucket = bucketAt >= 0 ? argv[bucketAt + 1] : DEFAULT_BUCKET
  if (!bucket || !/^[a-z0-9][a-z0-9._-]*$/.test(bucket)) throw new Error('--bucket needs a lowercase bucket name')
  const { items, unparsed } = inventory(loadSeedSources(root))

  if (argv.includes('--sql')) {
    writeFileSync(path.join(outDir, 'wordpress-media-audit.sql'), auditSql())
    console.log('wrote supabase/ops/media/wordpress-media-audit.sql')
  }
  if (argv.includes('--checklist')) {
    writeFileSync(path.join(outDir, 'wordpress-media-checklist.md'), checklistMarkdown(items, unparsed, bucket))
    console.log(`wrote supabase/ops/media/wordpress-media-checklist.md (${items.length} uploads)`)
  }
  if (argv.includes('--json')) console.log(JSON.stringify({ items, unparsed }, null, 2))
  if (argv.includes('--code')) {
    const files: string[] = []
    walk('src', files)
    walk('content', files)
    files.push('next.config.ts')
    const found = files.flatMap(file => codeReferences(file, readFileSync(path.join(root, file), 'utf8')))
    for (const ref of found) console.log(`${ref.file}:${ref.line}\t${ref.path ?? '(pattern only)'}`)
    console.log(`${found.length} code-held WordPress upload references`)
  }
  if (!['--sql', '--checklist', '--json', '--code'].some(flag => argv.includes(flag))) {
    const counts = new Map<string, number>()
    for (const item of items) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1)
    console.log(`seed-held WordPress uploads: ${items.length} (${[...counts].map(([k, n]) => `${n} ${k}`).join(', ')}); unparsed ${unparsed.length}`)
    console.log('flags: --sql --checklist --code --json [--bucket <name>]')
  }
}

if (require.main === module) main(process.argv.slice(2))
