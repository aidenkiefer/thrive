import { afterEach, describe, expect, it } from 'vitest'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checkFreshness, createSnapshot, decryptFile, encryptFile, keyFromBase64,
  LocalStorage, recoverSnapshot, verifiedIds,
} from './backup-core.mjs'

const dirs = []
const key = Buffer.alloc(32, 7)
async function scratch() { const dir = await mkdtemp(join(tmpdir(), 'thrive-backup-test-')); dirs.push(dir); return dir }
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))) })

describe('encrypted fixture snapshots', () => {
  it('round trips only with the correct key and rejects tampering', async () => {
    const dir = await scratch()
    const input = join(dir, 'fixture.dump')
    const encrypted = join(dir, 'fixture.enc')
    const output = join(dir, 'restored.dump')
    await writeFile(input, 'local fixture: no real database data')
    await encryptFile(input, encrypted, key)
    expect((await readFile(encrypted)).includes(Buffer.from('local fixture'))).toBe(false)
    await decryptFile(encrypted, output, key)
    expect(await readFile(output, 'utf8')).toBe('local fixture: no real database data')
    await expect(decryptFile(encrypted, output, Buffer.alloc(32, 8))).rejects.toThrow('authentication')
    await expect(readFile(output)).rejects.toThrow()
    const data = await readFile(encrypted)
    data[30] ^= 1
    await writeFile(encrypted, data)
    await expect(decryptFile(encrypted, output, key)).rejects.toThrow('authentication')
    expect(keyFromBase64(key.toString('base64'))).toEqual(key)
    expect(() => keyFromBase64('bad')).toThrow()
  })

  it('retains the newest ten verified snapshots and recovers the latest', async () => {
    const dir = await scratch()
    const storage = new LocalStorage(join(dir, 'fake-r2'))
    const fixtureDir = join(dir, 'fixture-sql')
    await mkdir(fixtureDir)
    const files = ['roles.sql', 'schema.sql', 'data.sql', 'history_schema.sql', 'history_data.sql']
    for (const file of files) await writeFile(join(fixtureDir, file), file === 'schema.sql' ? 'CREATE TABLE restore_fixture (id integer);\n' : '-- disposable fixture\n')
    const fixture = join(dir, 'fixture.tar')
    execFileSync('tar', ['-cf', fixture, '-C', fixtureDir, ...files])
    const source = path => copyFile(fixture, path)
    for (let day = 1; day <= 11; day++) {
      await createSnapshot({ source, storage, key, now: new Date(`2026-11-${String(day).padStart(2, '0')}T09:17:00Z`) })
    }
    const ids = await verifiedIds(storage)
    expect(ids).toHaveLength(10)
    expect(ids[0]).toContain('2026-11-11')
    expect(ids.at(-1)).toContain('2026-11-02')
    expect(await readdir(join(dir, 'fake-r2', 'snapshots'))).toHaveLength(20)
    const output = join(dir, 'recovered.tar')
    await recoverSnapshot({ storage, id: ids[0], key, output })
    expect(await readFile(output)).toEqual(await readFile(fixture))
    expect(execFileSync('tar', ['-tf', output], { encoding: 'utf8' }).trim().split('\n')).toEqual(files)
  })

  it('never prunes old recovery points after failed readback or upload', async () => {
    const dir = await scratch()
    const real = new LocalStorage(join(dir, 'fake-r2'))
    const source = path => writeFile(path, 'fixture')
    for (let day = 1; day <= 10; day++) {
      await createSnapshot({ source, storage: real, key, now: new Date(`2026-11-${String(day).padStart(2, '0')}T09:17:00Z`) })
    }
    const before = await verifiedIds(real)
    const failReadback = { ...real, put: real.put.bind(real), list: real.list.bind(real), delete: real.delete.bind(real), get: async () => { throw new Error('fake download failed') } }
    await expect(createSnapshot({ source, storage: failReadback, key })).rejects.toThrow()
    const failUpload = { put: async () => { throw new Error('fake upload failed') }, get: real.get.bind(real), list: real.list.bind(real), delete: real.delete.bind(real) }
    await expect(createSnapshot({ source, storage: failUpload, key })).rejects.toThrow()
    const failMarkerReadback = {
      put: real.put.bind(real), list: real.list.bind(real), delete: real.delete.bind(real),
      get: (name, target) => name.endsWith('.verified.json') ? Promise.reject(new Error('fake marker readback failed')) : real.get(name, target),
    }
    await expect(createSnapshot({ source, storage: failMarkerReadback, key })).rejects.toThrow()
    expect(await verifiedIds(real)).toEqual(before)
  })

  it('detects a missed weekly backup after eight days', async () => {
    const dir = await scratch()
    const storage = new LocalStorage(join(dir, 'fake-r2'))
    await createSnapshot({ source: path => writeFile(path, 'fixture'), storage, key, now: new Date('2026-11-01T09:17:00Z') })
    await expect(checkFreshness(storage, new Date('2026-11-09T09:17:01Z'))).rejects.toThrow('stale')
    expect((await checkFreshness(storage, new Date('2026-11-08T09:17:00Z'))).ageHours).toBe(168)
  })
})
