#!/usr/bin/env node
// The committed workflow is a template only. This CLI cannot reach production
// unless the operator explicitly chooses `live` and supplies private settings.
import { copyFile } from 'node:fs/promises'
import {
  checkFreshness, createSnapshot, keyFromBase64, LocalStorage, supabaseDump, R2Storage,
} from './backup-core.mjs'

const [command, ...args] = process.argv.slice(2)
const key = () => keyFromBase64(process.env.THRIVE_BACKUP_KEY)
const r2 = () => new R2Storage({ endpoint: process.env.R2_ENDPOINT, bucket: process.env.R2_BACKUP_BUCKET })

async function main() {
  if (command === 'fixture') {
    if (args.length !== 2) throw new Error('Usage: backup.mjs fixture <local-dump-fixture> <fake-storage-dir>')
    const result = await createSnapshot({
      source: path => copyFile(args[0], path), storage: new LocalStorage(args[1]), key: key(),
    })
    console.log(`Fixture snapshot verified: ${result.id}; retained ${result.retained}`)
  } else if (command === 'live') {
    if (args.length || process.env.THRIVE_BACKUP_ALLOW_LIVE !== 'YES') throw new Error('Live backup requires explicit operator enablement')
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) throw new Error('R2 credentials are incomplete')
    const result = await createSnapshot({ source: supabaseDump, storage: r2(), key: key() })
    console.log(`R2 snapshot verified: ${result.id}; retained ${result.retained}; encrypted bytes ${result.encryptedBytes}`)
  } else if (command === 'check-local') {
    if (args.length !== 1) throw new Error('Usage: backup.mjs check-local <fake-storage-dir>')
    const result = await checkFreshness(new LocalStorage(args[0]))
    console.log(`Verified local snapshot age: ${result.ageHours.toFixed(1)} hours`)
  } else if (command === 'check-r2') {
    if (args.length) throw new Error('Usage: backup.mjs check-r2')
    const result = await checkFreshness(r2())
    console.log(`Verified R2 snapshot age: ${result.ageHours.toFixed(1)} hours`)
  } else {
    throw new Error('Usage: backup.mjs <fixture|live|check-local|check-r2>')
  }
}

main().catch(() => {
  // Errors from database clients and storage commands may contain private data.
  console.error('Backup command failed; inspect private runner diagnostics')
  process.exitCode = 1
})
