import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { copyFile, mkdir, mkdtemp, open, readFile, readdir, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import { finished } from 'node:stream/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const MAGIC = Buffer.from('THRIVEBK1')
const PREFIX = 'snapshots/'
const MARKER = /^snapshots\/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z-[a-f0-9]{8})\.verified\.json$/

export function keyFromBase64(value) {
  const key = Buffer.from(value || '', 'base64')
  if (key.length !== 32 || key.toString('base64') !== value) {
    throw new Error('Backup encryption key must be canonical base64 for 32 bytes')
  }
  return key
}

async function writeChunk(stream, chunk) {
  await new Promise((resolve, reject) => stream.write(chunk, error => error ? reject(error) : resolve()))
}

export async function encryptFile(input, output, key) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  const out = createWriteStream(output, { mode: 0o600 })
  out.on('error', () => {})
  try {
    await writeChunk(out, MAGIC)
    await writeChunk(out, nonce)
    for await (const chunk of createReadStream(input)) await writeChunk(out, cipher.update(chunk))
    await writeChunk(out, cipher.final())
    await writeChunk(out, cipher.getAuthTag())
    out.end()
    await finished(out)
  } catch {
    out.destroy()
    await finished(out).catch(() => {})
    await rm(output, { force: true })
    throw new Error('Backup encryption failed')
  }
}

export async function decryptFile(input, output, key) {
  const size = (await stat(input)).size
  if (size < MAGIC.length + 12 + 16) throw new Error('Encrypted snapshot is truncated')
  const fd = await open(input, 'r')
  const header = Buffer.alloc(MAGIC.length + 12)
  const tag = Buffer.alloc(16)
  try {
    await fd.read(header, 0, header.length, 0)
    await fd.read(tag, 0, tag.length, size - tag.length)
  } finally {
    await fd.close()
  }
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Encrypted snapshot format is invalid')
  const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(MAGIC.length))
  decipher.setAuthTag(tag)
  const out = createWriteStream(output, { mode: 0o600 })
  out.on('error', () => {})
  try {
    for await (const chunk of createReadStream(input, { start: header.length, end: size - 17 })) {
      await writeChunk(out, decipher.update(chunk))
    }
    await writeChunk(out, decipher.final())
    out.end()
    await finished(out)
  } catch {
    out.destroy()
    await finished(out).catch(() => {})
    await rm(output, { force: true })
    throw new Error('Snapshot authentication failed')
  }
}

export async function sha256(path) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

function snapshotId(now) {
  return now.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z') + '-' + randomBytes(4).toString('hex')
}

export async function verifiedIds(storage) {
  const keys = (await storage.list(PREFIX)).filter(name => MARKER.test(name))
  const dir = await mkdtemp(join(tmpdir(), 'thrive-backup-markers-'))
  try {
    const ids = []
    for (let index = 0; index < keys.length; index++) {
      const file = join(dir, `${index}.json`)
      await storage.get(keys[index], file)
      const marker = JSON.parse(await readFile(file, 'utf8'))
      const id = MARKER.exec(keys[index])[1]
      if (marker.version !== 1 || marker.id !== id ||
          !/^[a-f0-9]{64}$/.test(marker.encryptedSha256) ||
          !/^[a-f0-9]{64}$/.test(marker.plainSha256) ||
          !Number.isSafeInteger(marker.encryptedBytes) || marker.encryptedBytes < 1 ||
          !Number.isFinite(Date.parse(marker.createdAt))) {
        throw new Error('Invalid verification marker')
      }
      ids.push(id)
    }
    return ids.sort().reverse()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function pruneVerified(storage, keep = 10) {
  const ids = await verifiedIds(storage)
  for (const id of ids.slice(keep)) {
    // Remove the marker first: a failed deletion may leave an encrypted orphan,
    // but never advertises a missing dump as a verified recovery point.
    await storage.delete(PREFIX + id + '.verified.json')
    await storage.delete(PREFIX + id + '.tar.enc')
  }
  return ids.slice(0, keep)
}

export async function createSnapshot({ source, storage, key, now = new Date() }) {
  const dir = await mkdtemp(join(tmpdir(), 'thrive-backup-'))
  const plain = join(dir, 'snapshot.tar')
  const encrypted = join(dir, 'snapshot.tar.enc')
  const downloaded = join(dir, 'downloaded.enc')
  const restored = join(dir, 'restored.tar')
  const markerFile = join(dir, 'marker.json')
  const markerReadback = join(dir, 'marker-readback.json')
  const id = snapshotId(now)
  const dumpKey = PREFIX + id + '.tar.enc'
  const markerKey = PREFIX + id + '.verified.json'
  try {
    await source(plain)
    if ((await stat(plain)).size === 0) throw new Error('Empty database export')
    const plainHash = await sha256(plain)
    await encryptFile(plain, encrypted, key)
    const encryptedHash = await sha256(encrypted)
    await storage.put(dumpKey, encrypted)
    await storage.get(dumpKey, downloaded)
    if (await sha256(downloaded) !== encryptedHash) throw new Error('Uploaded snapshot checksum mismatch')
    await decryptFile(downloaded, restored, key)
    if (await sha256(restored) !== plainHash) throw new Error('Restored snapshot checksum mismatch')
    const marker = {
      version: 1, id, createdAt: now.toISOString(),
      encryptedSha256: encryptedHash, plainSha256: plainHash,
      encryptedBytes: (await stat(encrypted)).size,
    }
    await writeFile(markerFile, JSON.stringify(marker) + '\n', { mode: 0o600 })
    let markerStored = false
    try {
      await storage.put(markerKey, markerFile)
      markerStored = true
      await storage.get(markerKey, markerReadback)
      if (!(await readFile(markerReadback)).equals(await readFile(markerFile))) throw new Error('Verification marker mismatch')
    } catch {
      if (markerStored) await storage.delete(markerKey).catch(() => {})
      throw new Error('Verification marker upload/readback failed')
    }
    const retained = await pruneVerified(storage)
    return { id, retained: retained.length, encryptedBytes: marker.encryptedBytes }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function checkFreshness(storage, now = new Date(), maxAgeHours = 8 * 24) {
  const id = (await verifiedIds(storage))[0]
  if (!id) throw new Error('No verified snapshot exists')
  const dir = await mkdtemp(join(tmpdir(), 'thrive-backup-check-'))
  try {
    const file = join(dir, 'marker.json')
    await storage.get(PREFIX + id + '.verified.json', file)
    const marker = JSON.parse(await readFile(file, 'utf8'))
    const ageHours = (now.getTime() - Date.parse(marker.createdAt)) / 3600_000
    if (marker.version !== 1 || marker.id !== id || !Number.isFinite(ageHours) || ageHours < 0 || ageHours > maxAgeHours) {
      throw new Error('Verified backup is stale or invalid')
    }
    return { id, ageHours }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function recoverSnapshot({ storage, id, key, output }) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z-[a-f0-9]{8}$/.test(id)) throw new Error('Invalid snapshot ID')
  const dir = await mkdtemp(join(tmpdir(), 'thrive-backup-restore-'))
  try {
    const markerPath = join(dir, 'marker.json')
    const encryptedPath = join(dir, 'snapshot.enc')
    await storage.get(PREFIX + id + '.verified.json', markerPath)
    const marker = JSON.parse(await readFile(markerPath, 'utf8'))
    if (marker.version !== 1 || marker.id !== id) throw new Error('Snapshot marker is invalid')
    await storage.get(PREFIX + id + '.tar.enc', encryptedPath)
    if (await sha256(encryptedPath) !== marker.encryptedSha256) throw new Error('Encrypted snapshot checksum mismatch')
    await decryptFile(encryptedPath, output, key)
    if (await sha256(output) !== marker.plainSha256) throw new Error('Restored snapshot checksum mismatch')
    return marker
  } catch {
    await rm(output, { force: true })
    throw new Error('Verified snapshot recovery failed')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function safeKey(key) {
  if (!/^snapshots\/[a-zA-Z0-9.-]+$/.test(key)) throw new Error('Invalid snapshot key')
  return key
}

export class LocalStorage {
  constructor(root) { this.root = root }
  path(key) { return join(this.root, safeKey(key)) }
  async put(key, source) { await mkdir(join(this.root, 'snapshots'), { recursive: true }); await copyFile(source, this.path(key)) }
  async get(key, target) { await copyFile(this.path(key), target) }
  async list(prefix) { return (await readdir(join(this.root, 'snapshots')).catch(() => [])).map(name => PREFIX + name).filter(key => key.startsWith(prefix)) }
  async delete(key) { await unlink(this.path(key)) }
}

async function run(command, args, env = process.env) {
  const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk; if (output.length > 5_000_000) child.kill() })
  // Never relay tool stderr: it may contain connection details or credentials.
  child.stderr.resume()
  const [code] = await once(child, 'close')
  if (code !== 0) throw new Error(command + ' command failed; inspect private runner diagnostics')
  return output
}

export class R2Storage {
  constructor({ endpoint, bucket }) {
    if (!/^https:\/\/[a-z0-9-]+\.r2\.cloudflarestorage\.com$/.test(endpoint) || !/^[a-z0-9-]+$/.test(bucket)) {
      throw new Error('R2 endpoint or bucket is invalid')
    }
    this.endpoint = endpoint; this.bucket = bucket
  }
  args(...rest) { return ['--no-cli-pager', 's3api', ...rest, '--endpoint-url', this.endpoint] }
  async put(key, source) { await run('aws', this.args('put-object', '--bucket', this.bucket, '--key', safeKey(key), '--body', source)) }
  async get(key, target) { await run('aws', this.args('get-object', '--bucket', this.bucket, '--key', safeKey(key), target)) }
  async delete(key) { await run('aws', this.args('delete-object', '--bucket', this.bucket, '--key', safeKey(key))) }
  async list(prefix) {
    const data = JSON.parse(await run('aws', this.args('list-objects-v2', '--bucket', this.bucket, '--prefix', prefix, '--output', 'json')))
    return (data.Contents || []).map(item => item.Key)
  }
}

export async function supabaseDump(path) {
  const dbUrl = process.env.SUPABASE_BACKUP_DB_URL
  if (!dbUrl) throw new Error('Supabase backup URL is missing')
  const parsed = new URL(dbUrl)
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('Supabase backup URL must be PostgreSQL')
  const dir = await mkdtemp(join(tmpdir(), 'thrive-supabase-export-'))
  const cli = join(process.cwd(), 'node_modules', '.bin', 'supabase')
  const dump = async (file, ...flags) => run(cli, ['db', 'dump', '--remote=' + dbUrl, '-f', join(dir, file), ...flags])
  try {
    await dump('roles.sql', '--role-only')
    await dump('schema.sql')
    await dump('data.sql', '--use-copy', '--data-only', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes')
    await dump('history_schema.sql', '--schema', 'supabase_migrations')
    await dump('history_data.sql', '--use-copy', '--data-only', '--schema', 'supabase_migrations')
    await run('tar', ['-cf', path, '-C', dir, 'roles.sql', 'schema.sql', 'data.sql', 'history_schema.sql', 'history_data.sql'])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
