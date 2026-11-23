#!/usr/bin/env node
// Restores only to a deliberately named disposable database on loopback.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { keyFromBase64, LocalStorage, recoverSnapshot } from './backup-core.mjs'

async function run(command, args) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'ignore', 'ignore'],
    env: { ...process.env, PGHOSTADDR: '', PGSERVICE: '', PGSERVICEFILE: '', PGOPTIONS: '', PGSSLMODE: 'disable' },
  })
  const [code] = await once(child, 'close')
  if (code !== 0) throw new Error('Local restore command failed')
}

async function main() {
  const [mode, id, ...rest] = process.argv.slice(2)
  const [localStoragePath, confirmation] = rest
  if (mode !== 'fixture' || !id || !localStoragePath || confirmation !== '--confirm-disposable') throw new Error('Fixture restore arguments are incomplete')
  if (!['127.0.0.1', 'localhost', '::1'].includes(process.env.PGHOST) ||
      !/^thrive_restore_[a-z0-9_]+$/.test(process.env.PGDATABASE || '') ||
      !/^\d{1,5}$/.test(process.env.PGPORT || '') ||
      Number(process.env.PGPORT) < 1 || Number(process.env.PGPORT) > 65535 ||
      !process.env.PGUSER || process.env.PGHOSTADDR || process.env.PGSERVICE || process.env.PGSERVICEFILE) {
    throw new Error('Restore target must be a named disposable local database')
  }
  const storage = new LocalStorage(localStoragePath)
  const dir = await mkdtemp(join(tmpdir(), 'thrive-restore-local-'))
  try {
    const archive = join(dir, 'verified.tar')
    await recoverSnapshot({ storage, id, key: keyFromBase64(process.env.THRIVE_BACKUP_KEY), output: archive })
    const files = ['roles.sql', 'schema.sql', 'data.sql', 'history_schema.sql', 'history_data.sql']
    await run('tar', ['-xf', archive, '-C', dir, '--no-same-owner', '--no-same-permissions', ...files])
    await run('psql', [
      '--single-transaction', '--set', 'ON_ERROR_STOP=1',
      '--host', process.env.PGHOST, '--port', process.env.PGPORT,
      '--username', process.env.PGUSER, '--dbname', process.env.PGDATABASE,
      '--file', join(dir, 'roles.sql'), '--file', join(dir, 'schema.sql'),
      '--command', 'SET session_replication_role = replica',
      '--file', join(dir, 'data.sql'),
      '--file', join(dir, 'history_schema.sql'), '--file', join(dir, 'history_data.sql'),
    ])
    console.log('Disposable local restore command completed; application checks remain separate')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

main().catch(() => {
  console.error('Disposable restore failed; details suppressed to protect private data')
  process.exitCode = 1
})
