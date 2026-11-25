/**
 * Template + launch entry -> Google Forms REST request bodies (forms.create, forms.batchUpdate,
 * forms.setPublishSettings). Field names follow https://developers.google.com/workspace/forms/api/reference/rest
 * (checked 2026-11-22). Pure apart from hashing.
 */
import { createHash } from 'node:crypto'
import type { FormTemplate, LaunchEntry, TemplateQuestion } from './types'

/* ---- Minimal Forms API shapes (only the fields this tool reads or writes) ---- */

export interface ApiQuestion {
  required: boolean
  textQuestion?: { paragraph: boolean }
  choiceQuestion?: { type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN'; options: { value: string }[] }
}

export interface ApiItem {
  itemId?: string
  title?: string
  description?: string
  questionItem?: { question: ApiQuestion }
  [other: string]: unknown
}

export interface ApiForm {
  formId: string
  info: { title: string; documentTitle?: string; description?: string }
  settings?: { emailCollectionType?: string }
  items?: ApiItem[]
  revisionId?: string
  responderUri?: string
  publishSettings?: { publishState?: { isPublished: boolean; isAcceptingResponses: boolean } }
}

export type ApiRequest =
  | { updateFormInfo: { info: { title: string; description: string }; updateMask: string } }
  | { updateSettings: { settings: { emailCollectionType: string }; updateMask: string } }
  | { createItem: { item: ApiItem; location: { index: number } } }
  | { deleteItem: { location: { index: number } } }

export interface BatchUpdateBody {
  requests: ApiRequest[]
  includeFormInResponse: boolean
  writeControl?: { requiredRevisionId: string }
}

export interface PublishBody {
  publishSettings: { publishState: { isPublished: boolean; isAcceptingResponses: boolean } }
  updateMask: 'publishState'
}

/* ---- Builders ---- */

/**
 * Drive file name for the form. Deterministic and entity-tagged so an operator can find a form
 * in Drive if a create call's result was lost (manifest state `creating`).
 */
export function documentTitle(entry: LaunchEntry): string {
  return `Thrive signup · ${entry.entityKey} · ${entry.templateKey} v${entry.templateVersion}`
}

/** forms.create accepts only info.title and info.documentTitle; everything else goes through batchUpdate. */
export function createBody(entry: LaunchEntry): { info: { title: string; documentTitle: string } } {
  return { info: { title: entry.title, documentTitle: documentTitle(entry) } }
}

export function questionItem(q: TemplateQuestion): ApiItem {
  const item: ApiItem = { title: q.title }
  if (q.description) item.description = q.description
  const question: ApiQuestion = { required: q.required }
  if (q.type === 'shortText' || q.type === 'paragraph') {
    question.textQuestion = { paragraph: q.type === 'paragraph' }
  } else {
    const type = q.type === 'radio' ? 'RADIO' : q.type === 'checkbox' ? 'CHECKBOX' : 'DROP_DOWN'
    question.choiceQuestion = { type, options: (q.options ?? []).map(value => ({ value })) }
  }
  item.questionItem = { question }
  return item
}

/** The content-defining requests: info, settings, then one createItem per question in order. */
export function contentRequests(entry: LaunchEntry, template: FormTemplate): ApiRequest[] {
  return [
    { updateFormInfo: { info: { title: entry.title, description: entry.description ?? '' }, updateMask: 'title,description' } },
    { updateSettings: { settings: { emailCollectionType: template.settings.emailCollectionType }, updateMask: 'emailCollectionType' } },
    ...template.questions.map((q, index) => ({ createItem: { item: questionItem(q), location: { index } } })),
  ]
}

/**
 * Full configure batch: delete whatever items the live form has (highest index first, so
 * indexes stay valid), then apply content. Guarded by requiredRevisionId so a concurrent edit
 * in Google fails the batch instead of being overwritten.
 */
export function configureBody(
  entry: LaunchEntry,
  template: FormTemplate,
  live: Pick<ApiForm, 'items' | 'revisionId'>,
): BatchUpdateBody {
  const existing = live.items?.length ?? 0
  const deletes: ApiRequest[] = Array.from({ length: existing }, (_, i) => ({
    deleteItem: { location: { index: existing - 1 - i } },
  }))
  const body: BatchUpdateBody = { requests: [...deletes, ...contentRequests(entry, template)], includeFormInResponse: true }
  if (live.revisionId) body.writeControl = { requiredRevisionId: live.revisionId }
  return body
}

export function publishBody(): PublishBody {
  return { publishSettings: { publishState: { isPublished: true, isAcceptingResponses: true } }, updateMask: 'publishState' }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    return `{${Object.keys(o)
      .filter(k => o[k] !== undefined)
      .sort()
      .map(k => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function sha256(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex')
}

/** Hash of everything the CLI writes into a form, so template/title edits are detected as drift. */
export function contentHash(entry: LaunchEntry, template: FormTemplate): string {
  return `sha256:${sha256({ template: `${template.templateKey}@v${template.templateVersion}`, requests: contentRequests(entry, template) })}`
}

export function isPublished(form: Pick<ApiForm, 'publishSettings'>): boolean {
  const s = form.publishSettings?.publishState
  return Boolean(s?.isPublished && s.isAcceptingResponses)
}
