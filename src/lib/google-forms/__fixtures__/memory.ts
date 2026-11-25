/** Test helpers: in-memory file system and captured output. Not shipped; used by *.test.ts. */
import path from 'node:path'
import type { FileIO } from '../files'
import type { FormTemplate, LaunchEntry, LaunchFile, Manifest, ManifestEntry } from '../types'

export function memoryIO(files: Record<string, unknown> = {}) {
  const store = new Map<string, string>(
    Object.entries(files).map(([p, v]) => [path.resolve('/repo', p), typeof v === 'string' ? v : JSON.stringify(v)]),
  )
  const writes: string[] = []
  const io: FileIO = {
    async readFile(p) {
      const v = store.get(p)
      if (v === undefined) throw Object.assign(new Error(`ENOENT ${p}`), { code: 'ENOENT' })
      return v
    },
    async writeFile(p, d) {
      writes.push(p)
      store.set(p, d)
    },
    async rename(a, b) {
      const v = store.get(a)
      if (v === undefined) throw new Error(`ENOENT ${a}`)
      store.delete(a)
      store.set(b, v)
    },
    async readdir(dir) {
      const prefix = dir.endsWith('/') ? dir : `${dir}/`
      const names = [...store.keys()].filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length))
      if (!names.length) throw new Error(`ENOENT ${dir}`)
      return names.filter(n => !n.includes('/'))
    },
    async exists(p) {
      return store.has(p)
    },
  }
  const read = (p: string) => {
    const v = store.get(path.resolve('/repo', p))
    return v === undefined ? undefined : JSON.parse(v)
  }
  return { io, store, writes, read }
}

export function capture() {
  const out: string[] = []
  const err: string[] = []
  return { out, err, output: { out: (l: string) => out.push(l), err: (l: string) => err.push(l) } }
}

export function template(overrides: Partial<FormTemplate> = {}): FormTemplate {
  return {
    templateKey: 'group-signup',
    templateVersion: 1,
    kind: 'group',
    approval: { status: 'approved', approvedBy: 'owner', approvedOn: '2026-11-22' },
    settings: { emailCollectionType: 'RESPONDER_INPUT' },
    questions: [
      { key: 'full-name', title: 'Full name', type: 'shortText', required: true },
      { key: 'notes', title: 'Notes', type: 'paragraph', required: false },
      { key: 'night', title: 'Preferred night', type: 'radio', required: false, options: ['Tuesday', 'Thursday'] },
    ],
    ...overrides,
  }
}

export function launchEntry(overrides: Partial<LaunchEntry> = {}): LaunchEntry {
  return {
    entityKey: 'group:fixture-group',
    templateKey: 'group-signup',
    templateVersion: 1,
    title: 'Fixture group signup',
    description: 'Fixture description',
    publish: true,
    ...overrides,
  }
}

export function launchFile(...forms: LaunchEntry[]): LaunchFile {
  return { launchVersion: 1, forms: forms.length ? forms : [launchEntry()] }
}

export function manifestEntry(overrides: Partial<ManifestEntry> = {}): ManifestEntry {
  return {
    entityKey: 'group:fixture-group',
    templateKey: 'group-signup',
    templateVersion: 1,
    formId: null,
    responderUrl: null,
    publicationState: 'planned',
    contentHash: null,
    revisionId: null,
    updatedAt: null,
    ...overrides,
  }
}

export function manifest(...forms: ManifestEntry[]): Manifest {
  return { manifestVersion: 1, forms }
}

export const TEMPLATE_DIR = 'config/google-forms/templates'
export const LAUNCH = 'config/google-forms/launch.json'
export const MANIFEST = 'config/google-forms/manifest.json'

/** Standard repo layout in memory: one approved group template and a one-entry launch file. */
export function repoFiles(opts: { template?: FormTemplate; launch?: LaunchFile; manifest?: Manifest } = {}) {
  const t = opts.template ?? template()
  const files: Record<string, unknown> = {
    [`${TEMPLATE_DIR}/${t.templateKey}.v${t.templateVersion}.json`]: t,
    [LAUNCH]: opts.launch ?? launchFile(),
  }
  if (opts.manifest) files[MANIFEST] = opts.manifest
  return files
}
