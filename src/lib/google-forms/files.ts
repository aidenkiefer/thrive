/**
 * Local file access for the operator CLI (templates, launch file, manifest). Node-only; never
 * import from app code. Manifest writes are atomic (temp file + rename) so an interrupted run
 * cannot leave a half-written record.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { FormTemplate, LaunchFile, Manifest, Result } from './types'
import { emptyManifest, validateLaunchFile, validateManifest, validateTemplate } from './validate'

export interface FileIO {
  readFile(p: string): Promise<string>
  writeFile(p: string, data: string): Promise<void>
  rename(from: string, to: string): Promise<void>
  readdir(p: string): Promise<string[]>
  exists(p: string): Promise<boolean>
}

export const nodeFileIO: FileIO = {
  readFile: p => fs.readFile(p, 'utf8'),
  writeFile: (p, d) => fs.writeFile(p, d, { encoding: 'utf8', mode: 0o644 }),
  rename: (a, b) => fs.rename(a, b),
  readdir: p => fs.readdir(p),
  exists: p => fs.access(p).then(() => true, () => false),
}

async function readJson(io: FileIO, p: string): Promise<Result<unknown>> {
  let raw: string
  try {
    raw = await io.readFile(p)
  } catch {
    return { ok: false, errors: [`${p}: cannot read file`] }
  }
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch (e) {
    return { ok: false, errors: [`${p}: invalid JSON (${(e as Error).message})`] }
  }
}

function prefix<T>(p: string, r: Result<T>): Result<T> {
  return r.ok ? r : { ok: false, errors: r.errors.map(e => `${p}: ${e}`) }
}

export async function loadTemplates(io: FileIO, dir: string): Promise<Result<FormTemplate[]>> {
  let names: string[]
  try {
    names = (await io.readdir(dir)).filter(n => n.endsWith('.json')).sort()
  } catch {
    return { ok: false, errors: [`${dir}: cannot read template directory`] }
  }
  if (names.length === 0) return { ok: false, errors: [`${dir}: no templates found`] }
  const errors: string[] = []
  const templates: FormTemplate[] = []
  for (const name of names) {
    const p = path.join(dir, name)
    const json = await readJson(io, p)
    if (!json.ok) {
      errors.push(...json.errors)
      continue
    }
    const t = prefix(p, validateTemplate(json.value, name))
    if (t.ok) templates.push(t.value)
    else errors.push(...t.errors)
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: templates }
}

export async function loadLaunchFile(io: FileIO, p: string, templates: FormTemplate[]): Promise<Result<LaunchFile>> {
  const json = await readJson(io, p)
  return json.ok ? prefix(p, validateLaunchFile(json.value, templates)) : json
}

/** A missing manifest means nothing has been created yet. */
export async function loadManifest(io: FileIO, p: string): Promise<Result<Manifest>> {
  if (!(await io.exists(p))) return { ok: true, value: emptyManifest() }
  const json = await readJson(io, p)
  return json.ok ? prefix(p, validateManifest(json.value)) : json
}

export async function saveManifest(io: FileIO, p: string, manifest: Manifest): Promise<void> {
  const checked = validateManifest(manifest)
  if (!checked.ok) throw new Error(`refusing to write an invalid manifest: ${checked.errors.join('; ')}`)
  const sorted: Manifest = { ...manifest, forms: [...manifest.forms].sort((a, b) => a.entityKey.localeCompare(b.entityKey)) }
  const tmp = `${p}.tmp`
  await io.writeFile(tmp, `${JSON.stringify(sorted, null, 2)}\n`)
  await io.rename(tmp, p)
}
