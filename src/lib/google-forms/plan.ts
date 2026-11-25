/**
 * Offline planner: launch file + templates + manifest -> ordered Forms API operations.
 * No credentials, no network. The plan ID binds `apply --confirm <id>` to exactly what the
 * operator reviewed; any change to the inputs changes the ID.
 *
 * Reconciliation rule: an entity with a recorded form is never created again. Ambiguous or
 * risky states (lost create result, published-form drift, draft templates) are `blocked`
 * with a reason instead of guessed at.
 */
import { contentHash, documentTitle, sha256 } from './requests'
import type { FormTemplate, LaunchEntry, LaunchFile, Manifest, ManifestEntry } from './types'
import { liveUseAllowed, templateId } from './validate'

export type ApiStep = 'forms.create' | 'forms.get' | 'forms.batchUpdate' | 'forms.setPublishSettings'
export const WRITE_STEPS: readonly ApiStep[] = ['forms.create', 'forms.batchUpdate', 'forms.setPublishSettings']

export type PlanAction = 'create' | 'configure' | 'publish' | 'verify' | 'blocked'

export interface PlanEntry {
  entityKey: string
  template: string
  action: PlanAction
  /** API calls in execution order. The executor never makes a write that is not listed here. */
  steps: ApiStep[]
  reason: string
  /** Formatted for review; the executor re-derives request bodies from the same inputs. */
  desiredHash: string
  recordedFormId: string | null
}

export interface Plan {
  planId: string
  entries: PlanEntry[]
  writeCount: number
  blockedCount: number
  /** Manifest entries not mentioned in the launch file. Left untouched. */
  untracked: string[]
}

function entryPlan(launch: LaunchEntry, template: FormTemplate, recorded: ManifestEntry | undefined): PlanEntry {
  const desiredHash = contentHash(launch, template)
  const base = {
    entityKey: launch.entityKey,
    template: templateId(template),
    desiredHash,
    recordedFormId: recorded?.formId ?? null,
  }
  const blocked = (reason: string): PlanEntry => ({ ...base, action: 'blocked', steps: [], reason })
  const publishTail: ApiStep[] = launch.publish ? ['forms.setPublishSettings', 'forms.get'] : []

  if (!liveUseAllowed(launch, template)) {
    return blocked(`template ${templateId(template)} is a draft; only sandbox: entities may use drafts until the owner approves it`)
  }
  if (recorded && recorded.templateKey !== launch.templateKey) {
    return blocked(`recorded form uses template ${recorded.templateKey}; switching template keys needs a new form (new entity record) chosen by the owner`)
  }
  if (!recorded || recorded.publicationState === 'planned') {
    return {
      ...base,
      action: 'create',
      steps: ['forms.create', 'forms.batchUpdate', ...publishTail],
      reason: launch.publish ? 'no recorded form; create unpublished, apply template, then publish' : 'no recorded form; create unpublished and apply template',
    }
  }
  if (recorded.publicationState === 'creating') {
    return blocked(
      `an earlier create was sent but its result was not recorded; look in Drive for "${documentTitle(launch)}" and record its formId (state "created") or remove the entry before rerunning`,
    )
  }
  const drift = recorded.contentHash !== desiredHash || recorded.templateVersion !== launch.templateVersion
  if (recorded.publicationState === 'published') {
    if (drift) {
      return blocked('form is published and its recorded content differs from the launch file; the CLI does not rewrite live forms (existing responses would detach). Edit it in Google or launch a new form')
    }
    return { ...base, action: 'verify', steps: ['forms.get'], reason: launch.publish ? 'published and up to date' : 'published; unpublishing is a manual Google step' }
  }
  if (recorded.publicationState === 'created' || drift) {
    return {
      ...base,
      action: 'configure',
      steps: ['forms.get', 'forms.batchUpdate', ...publishTail],
      reason: recorded.publicationState === 'created' ? 'form exists but template content was not applied; resume' : 'unpublished form content differs; reapply template',
    }
  }
  if (launch.publish) {
    return { ...base, action: 'publish', steps: ['forms.get', ...publishTail], reason: 'configured and up to date; publish' }
  }
  return { ...base, action: 'verify', steps: ['forms.get'], reason: 'configured and up to date; not set to publish' }
}

export function buildPlan(launch: LaunchFile, templates: FormTemplate[], manifest: Manifest): Plan {
  const byTemplate = new Map(templates.map(t => [templateId(t), t]))
  const byEntity = new Map(manifest.forms.map(e => [e.entityKey, e]))
  const entries = launch.forms.map(l => {
    const t = byTemplate.get(templateId(l))
    if (!t) throw new Error(`launch entry ${l.entityKey}: template ${templateId(l)} not loaded (validate first)`)
    return entryPlan(l, t, byEntity.get(l.entityKey))
  })
  const launched = new Set(launch.forms.map(l => l.entityKey))
  const untracked = manifest.forms.map(e => e.entityKey).filter(k => !launched.has(k))
  const writeCount = entries.reduce((n, e) => n + e.steps.filter(s => WRITE_STEPS.includes(s)).length, 0)
  const blockedCount = entries.filter(e => e.action === 'blocked').length
  const planId = sha256({
    entries: entries.map(e => [e.entityKey, e.template, e.action, e.steps, e.desiredHash, e.recordedFormId]),
    manifest: manifest.forms
      .filter(e => launched.has(e.entityKey))
      .map(e => [e.entityKey, e.formId, e.publicationState, e.contentHash, e.revisionId, e.templateVersion]),
  }).slice(0, 12)
  return { planId, entries, writeCount, blockedCount, untracked }
}
