/**
 * Offline validators for templates, launch files and manifests. Pure: no I/O, no network.
 * Every error names the field path so the operator can fix the file without guessing.
 */
import { isApprovedFormUrl } from '../form-urls'
import {
  EMAIL_COLLECTION_TYPES,
  ENTITY_TYPES,
  PUBLICATION_STATES,
  QUESTION_TYPES,
  TEMPLATE_KINDS,
  type EntityType,
  type FormTemplate,
  type LaunchEntry,
  type LaunchFile,
  type Manifest,
  type ManifestEntry,
  type Result,
} from './types'

export const LIMITS = {
  title: 300,
  description: 4000,
  questions: 50,
  options: 50,
  optionLength: 200,
  launchForms: 100,
} as const

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
/** Placeholder text that must never reach a live form. */
const PLACEHOLDER = /\b(TODO|TBD|TBA|FIXME|lorem ipsum|placeholder)\b|\{\{|\}\}/i
/** Google's published responder URL shape. Editor (/edit) and prefill links are rejected. */
const RESPONDER_PATH = /^\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function checkKeys(v: Obj, allowed: readonly string[], path: string, errors: string[]): void {
  for (const k of Object.keys(v)) {
    if (!allowed.includes(k)) errors.push(`${path}.${k}: unknown field`)
  }
}

function text(
  v: unknown,
  path: string,
  errors: string[],
  opts: { max: number; optional?: boolean; noPlaceholder?: boolean },
): string | undefined {
  if (v === undefined && opts.optional) return undefined
  if (typeof v !== 'string' || v.trim() === '') {
    errors.push(`${path}: required non-empty string`)
    return undefined
  }
  if (v !== v.trim()) errors.push(`${path}: leading or trailing whitespace`)
  if (v.length > opts.max) errors.push(`${path}: longer than ${opts.max} characters`)
  if (opts.noPlaceholder !== false && PLACEHOLDER.test(v)) errors.push(`${path}: contains placeholder text`)
  return v
}

function positiveInt(v: unknown, path: string, errors: string[]): number | undefined {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    errors.push(`${path}: must be a positive integer`)
    return undefined
  }
  return v
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], path: string, errors: string[]): T | undefined {
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    errors.push(`${path}: must be one of ${allowed.join(', ')}`)
    return undefined
  }
  return v as T
}

function done<T>(errors: string[], value: unknown): Result<T> {
  return errors.length ? { ok: false, errors } : { ok: true, value: value as T }
}

/** `<event|group|sandbox>:<kebab-slug>` */
export function parseEntityKey(key: unknown): { type: EntityType; slug: string } | null {
  if (typeof key !== 'string') return null
  const i = key.indexOf(':')
  if (i < 0) return null
  const type = key.slice(0, i) as EntityType
  const slug = key.slice(i + 1)
  if (!ENTITY_TYPES.includes(type) || !SLUG.test(slug)) return null
  return { type, slug }
}

function validateQuestion(q: unknown, path: string, errors: string[]): void {
  if (!isObj(q)) {
    errors.push(`${path}: must be an object`)
    return
  }
  checkKeys(q, ['key', 'title', 'description', 'type', 'required', 'options'], path, errors)
  if (typeof q.key !== 'string' || !SLUG.test(q.key)) errors.push(`${path}.key: must be a kebab-case slug`)
  text(q.title, `${path}.title`, errors, { max: LIMITS.title })
  text(q.description, `${path}.description`, errors, { max: LIMITS.description, optional: true })
  const type = oneOf(q.type, QUESTION_TYPES, `${path}.type`, errors)
  if (typeof q.required !== 'boolean') errors.push(`${path}.required: must be true or false`)
  const isChoice = type === 'radio' || type === 'checkbox' || type === 'dropdown'
  if (isChoice) {
    if (!Array.isArray(q.options) || q.options.length === 0) {
      errors.push(`${path}.options: ${type} needs at least one option`)
    } else {
      if (q.options.length > LIMITS.options) errors.push(`${path}.options: more than ${LIMITS.options}`)
      const seen = new Set<string>()
      q.options.forEach((o, j) => {
        const v = text(o, `${path}.options[${j}]`, errors, { max: LIMITS.optionLength })
        if (v !== undefined) {
          if (seen.has(v)) errors.push(`${path}.options[${j}]: duplicate option`)
          seen.add(v)
        }
      })
    }
  } else if (q.options !== undefined) {
    errors.push(`${path}.options: only allowed for radio, checkbox and dropdown`)
  }
}

/**
 * Validate one template. `fileName`, when given, must be `<templateKey>.v<templateVersion>.json`
 * so a version bump is always a new file and old versions stay reproducible.
 */
export function validateTemplate(input: unknown, fileName?: string): Result<FormTemplate> {
  const errors: string[] = []
  const p = 'template'
  if (!isObj(input)) return { ok: false, errors: [`${p}: must be a JSON object`] }
  checkKeys(input, ['$comment', 'templateKey', 'templateVersion', 'kind', 'approval', 'settings', 'questions'], p, errors)
  if (typeof input.templateKey !== 'string' || !SLUG.test(input.templateKey)) {
    errors.push(`${p}.templateKey: must be a kebab-case slug`)
  }
  const version = positiveInt(input.templateVersion, `${p}.templateVersion`, errors)
  oneOf(input.kind, TEMPLATE_KINDS, `${p}.kind`, errors)

  if (!isObj(input.approval)) {
    errors.push(`${p}.approval: required object`)
  } else {
    const a = input.approval
    checkKeys(a, ['status', 'approvedBy', 'approvedOn', 'notes'], `${p}.approval`, errors)
    const status = oneOf(a.status, ['draft', 'approved'] as const, `${p}.approval.status`, errors)
    if (status === 'approved') {
      text(a.approvedBy, `${p}.approval.approvedBy`, errors, { max: 100 })
      if (typeof a.approvedOn !== 'string' || !DATE.test(a.approvedOn)) {
        errors.push(`${p}.approval.approvedOn: required YYYY-MM-DD when approved`)
      }
    } else if (status === 'draft' && (a.approvedBy != null || a.approvedOn != null)) {
      errors.push(`${p}.approval: a draft cannot carry approvedBy/approvedOn`)
    }
    if (a.notes !== undefined && typeof a.notes !== 'string') errors.push(`${p}.approval.notes: must be a string`)
  }

  if (!isObj(input.settings)) {
    errors.push(`${p}.settings: required object`)
  } else {
    checkKeys(input.settings, ['emailCollectionType'], `${p}.settings`, errors)
    oneOf(input.settings.emailCollectionType, EMAIL_COLLECTION_TYPES, `${p}.settings.emailCollectionType`, errors)
  }

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    errors.push(`${p}.questions: at least one question required`)
  } else {
    if (input.questions.length > LIMITS.questions) errors.push(`${p}.questions: more than ${LIMITS.questions}`)
    const keys = new Set<string>()
    input.questions.forEach((q, i) => {
      validateQuestion(q, `${p}.questions[${i}]`, errors)
      const key = isObj(q) ? q.key : undefined
      if (typeof key === 'string') {
        if (keys.has(key)) errors.push(`${p}.questions[${i}].key: duplicate key "${key}"`)
        keys.add(key)
      }
    })
  }

  if (fileName !== undefined && typeof input.templateKey === 'string' && version !== undefined) {
    const expected = `${input.templateKey}.v${version}.json`
    if (fileName !== expected) errors.push(`${p}: file name must be ${expected} (got ${fileName})`)
  }
  return done<FormTemplate>(errors, input)
}

export function templateId(t: { templateKey: string; templateVersion: number }): string {
  return `${t.templateKey}@v${t.templateVersion}`
}

/**
 * Validate a launch file against the loaded templates. Live use of a draft template is
 * allowed only for `sandbox:` entities (the owner-assisted check); that rule is enforced
 * by the planner so dry runs still show drafts.
 */
export function validateLaunchFile(input: unknown, templates: FormTemplate[]): Result<LaunchFile> {
  const errors: string[] = []
  const p = 'launch'
  if (!isObj(input)) return { ok: false, errors: [`${p}: must be a JSON object`] }
  checkKeys(input, ['$comment', 'launchVersion', 'forms'], p, errors)
  if (input.launchVersion !== 1) errors.push(`${p}.launchVersion: must be 1`)
  if (!Array.isArray(input.forms)) {
    errors.push(`${p}.forms: required array`)
    return { ok: false, errors }
  }
  if (input.forms.length > LIMITS.launchForms) errors.push(`${p}.forms: more than ${LIMITS.launchForms} entries`)
  const byId = new Map(templates.map(t => [templateId(t), t]))
  const seen = new Set<string>()
  input.forms.forEach((f, i) => {
    const fp = `${p}.forms[${i}]`
    if (!isObj(f)) {
      errors.push(`${fp}: must be an object`)
      return
    }
    checkKeys(f, ['entityKey', 'templateKey', 'templateVersion', 'title', 'description', 'publish'], fp, errors)
    const entity = parseEntityKey(f.entityKey)
    if (!entity) errors.push(`${fp}.entityKey: must look like event:<slug>, group:<slug> or sandbox:<slug>`)
    if (typeof f.entityKey === 'string') {
      if (seen.has(f.entityKey)) errors.push(`${fp}.entityKey: duplicate "${f.entityKey}" (one form per entity)`)
      seen.add(f.entityKey)
    }
    text(f.title, `${fp}.title`, errors, { max: LIMITS.title })
    text(f.description, `${fp}.description`, errors, { max: LIMITS.description, optional: true })
    if (typeof f.publish !== 'boolean') errors.push(`${fp}.publish: must be true or false`)
    const version = positiveInt(f.templateVersion, `${fp}.templateVersion`, errors)
    if (typeof f.templateKey !== 'string' || version === undefined) {
      if (typeof f.templateKey !== 'string') errors.push(`${fp}.templateKey: required`)
      return
    }
    const t = byId.get(templateId({ templateKey: f.templateKey, templateVersion: version }))
    if (!t) {
      errors.push(`${fp}: no template ${f.templateKey}@v${version}`)
    } else if (entity && entity.type !== 'sandbox' && entity.type !== t.kind) {
      errors.push(`${fp}: ${entity.type} entity cannot use ${t.kind} template ${templateId(t)}`)
    }
  })
  return done<LaunchFile>(errors, input)
}

/** True for Google's published hosted-form URL; false for editor, prefill or other links. */
export function isResponderUrl(url: unknown): url is string {
  if (!isApprovedFormUrl(url as string)) return false
  const u = new URL(url as string)
  return u.hostname === 'docs.google.com' && RESPONDER_PATH.test(u.pathname) && u.search === '' && u.hash === ''
}

const FORM_ID = /^[A-Za-z0-9_-]{10,200}$/

export function validateManifest(input: unknown): Result<Manifest> {
  const errors: string[] = []
  const p = 'manifest'
  if (!isObj(input)) return { ok: false, errors: [`${p}: must be a JSON object`] }
  checkKeys(input, ['$comment', 'manifestVersion', 'fixture', 'forms'], p, errors)
  if (input.manifestVersion !== 1) errors.push(`${p}.manifestVersion: must be 1`)
  if (input.fixture !== undefined && typeof input.fixture !== 'boolean') errors.push(`${p}.fixture: must be boolean`)
  if (!Array.isArray(input.forms)) {
    errors.push(`${p}.forms: required array`)
    return { ok: false, errors }
  }
  const seenEntity = new Set<string>()
  const seenForm = new Set<string>()
  input.forms.forEach((e, i) => {
    const ep = `${p}.forms[${i}]`
    if (!isObj(e)) {
      errors.push(`${ep}: must be an object`)
      return
    }
    // Strict key set: a token, editor URL or response field has nowhere to hide.
    checkKeys(
      e,
      ['entityKey', 'templateKey', 'templateVersion', 'formId', 'responderUrl', 'publicationState', 'contentHash', 'revisionId', 'updatedAt'],
      ep,
      errors,
    )
    if (!parseEntityKey(e.entityKey)) errors.push(`${ep}.entityKey: invalid`)
    if (typeof e.entityKey === 'string') {
      if (seenEntity.has(e.entityKey)) errors.push(`${ep}.entityKey: duplicate "${e.entityKey}"`)
      seenEntity.add(e.entityKey)
    }
    if (typeof e.templateKey !== 'string' || !SLUG.test(e.templateKey)) errors.push(`${ep}.templateKey: invalid`)
    positiveInt(e.templateVersion, `${ep}.templateVersion`, errors)
    const state = oneOf(e.publicationState, PUBLICATION_STATES, `${ep}.publicationState`, errors)

    if (e.formId !== null && (typeof e.formId !== 'string' || !FORM_ID.test(e.formId))) {
      errors.push(`${ep}.formId: must be null or a Forms ID`)
    }
    if (typeof e.formId === 'string') {
      if (seenForm.has(e.formId)) errors.push(`${ep}.formId: recorded for more than one entity`)
      seenForm.add(e.formId)
    }
    const hasForm = typeof e.formId === 'string'
    if ((state === 'planned' || state === 'creating') && hasForm) errors.push(`${ep}: ${state} entries cannot have a formId`)
    if (state && state !== 'planned' && state !== 'creating' && !hasForm) errors.push(`${ep}: ${state} entries need a formId`)

    if (e.responderUrl !== null && !isResponderUrl(e.responderUrl)) {
      errors.push(`${ep}.responderUrl: must be null or a docs.google.com/forms/d/e/<id>/viewform URL`)
    }
    if (state === 'published' && e.responderUrl === null) errors.push(`${ep}: published entries need a responderUrl`)
    if (state !== 'published' && e.responderUrl !== null && e.responderUrl !== undefined) {
      errors.push(`${ep}.responderUrl: only published entries carry a responder URL`)
    }
    for (const k of ['contentHash', 'revisionId', 'updatedAt'] as const) {
      if (e[k] !== null && typeof e[k] !== 'string') errors.push(`${ep}.${k}: must be null or a string`)
    }
    if ((state === 'configured' || state === 'published') && typeof e.contentHash !== 'string') {
      errors.push(`${ep}: ${state} entries need a contentHash`)
    }
  })
  return done<Manifest>(errors, input)
}

/**
 * C1 consumer helper: the only URL a public page may link for an entity, or null.
 * Requires a published entry whose URL passes both the responder shape and the site allowlist.
 */
export function publicResponderUrl(entry: ManifestEntry | null | undefined): string | null {
  if (!entry || entry.publicationState !== 'published') return null
  if (parseEntityKey(entry.entityKey)?.type === 'sandbox') return null
  return isResponderUrl(entry.responderUrl) ? entry.responderUrl : null
}

/** A draft template may only reach Google for a sandbox entity. */
export function liveUseAllowed(entry: LaunchEntry, template: FormTemplate): boolean {
  return template.approval.status === 'approved' || parseEntityKey(entry.entityKey)?.type === 'sandbox'
}

export function emptyManifest(): Manifest {
  return { manifestVersion: 1, forms: [] }
}
