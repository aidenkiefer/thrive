/**
 * Live runner for `apply` and `inspect`. Executes exactly the steps of a confirmed plan, saving
 * the manifest after every successful step so an interrupted run resumes instead of duplicating.
 * Stops at the first failure (bounded; no unattended loops).
 */
import type { LiveContext, LiveRunner, Output } from './cli'
import { FormsApiError, type FormsClient } from './client'
import { saveManifest } from './files'
import type { PlanEntry } from './plan'
import { redact, shortId } from './redact'
import { configureBody, contentHash, createBody, isPublished, publishBody, type ApiForm, type ApiItem } from './requests'
import type { FormTemplate, LaunchEntry, Manifest, ManifestEntry, TemplateQuestion } from './types'
import { isResponderUrl, templateId } from './validate'

export interface ExecuteDeps {
  client: FormsClient
  /** Obtains credentials before any API call, so an auth failure never leaves a half-recorded step. */
  preflight?: () => Promise<void>
  now?: () => Date
}

class StopError extends Error {}

function upsert(manifest: Manifest, entry: ManifestEntry): Manifest {
  const others = manifest.forms.filter(e => e.entityKey !== entry.entityKey)
  return { ...manifest, forms: [...others, entry] }
}

function describe(e: unknown): string {
  if (e instanceof FormsApiError || e instanceof StopError) return e.message
  return `unexpected error: ${e instanceof Error ? e.message : String(e)}`
}

export function createLiveRunner(deps: ExecuteDeps): LiveRunner {
  const now = () => (deps.now ? deps.now() : new Date()).toISOString()
  const { client } = deps

  async function ready(o: Output): Promise<boolean> {
    try {
      await deps.preflight?.()
      return true
    } catch (e) {
      o.err(redact(`✖ live Google execution is not configured: ${e instanceof Error ? e.message : String(e)}`))
      return false
    }
  }

  async function applyEntry(
    ctx: LiveContext,
    plan: PlanEntry,
    launch: LaunchEntry,
    template: FormTemplate,
    manifest: { current: Manifest },
    counter: { writes: number },
  ): Promise<void> {
    const o = ctx.output
    const save = async (entry: ManifestEntry) => {
      manifest.current = upsert(manifest.current, entry)
      await saveManifest(ctx.io, ctx.manifestPath, manifest.current)
    }
    const recorded = manifest.current.forms.find(e => e.entityKey === plan.entityKey)
    let entry: ManifestEntry = recorded ?? {
      entityKey: launch.entityKey,
      templateKey: launch.templateKey,
      templateVersion: launch.templateVersion,
      formId: null,
      responderUrl: null,
      publicationState: 'planned',
      contentHash: null,
      revisionId: null,
      updatedAt: null,
    }
    let live: ApiForm | null = null
    let published = false

    for (const step of plan.steps) {
      if (step === 'forms.create') {
        const before = entry
        // Record intent first: if the response is lost, the next plan blocks instead of creating twice.
        const body = createBody(launch)
        entry = { ...entry, publicationState: 'creating', formId: null, updatedAt: now() }
        await save(entry)
        try {
          live = await client.create(body)
        } catch (e) {
          // Only a definitive rejection from Google proves nothing was created. Anything else
          // (ambiguous status, unreadable body, unexpected error) keeps "creating" so the next
          // plan blocks instead of creating a duplicate.
          if (!(e instanceof FormsApiError) || e.ambiguous) {
            throw new StopError(`${describe(e)}. The form may exist: entry left as "creating"; see README Recovery before rerunning.`)
          }
          await save(before)
          throw e
        }
        counter.writes++
        if (!live.formId) throw new StopError('forms.create returned no formId; entry left as "creating"; see README Recovery')
        entry = { ...entry, formId: live.formId, publicationState: 'created', revisionId: live.revisionId ?? null, updatedAt: now() }
        await save(entry)
        o.out(`    ✔ forms.create → form ${shortId(live.formId)} (unpublished)`)
      } else if (step === 'forms.get' && !published) {
        live = await client.get(entry.formId!)
        if (live.formId !== entry.formId) throw new StopError('forms.get returned a different form; stopping')
        o.out(`    ✔ forms.get → ${isPublished(live) ? 'published' : 'not published'}, ${live.items?.length ?? 0} item(s)`)
        const writesContent = plan.steps.includes('forms.batchUpdate')
        if (writesContent && entry.revisionId && live.revisionId && live.revisionId !== entry.revisionId) {
          throw new StopError(
            'form was edited in Google since the CLI last wrote it; not overwriting. Review it with inspect, then clear revisionId in the manifest to replace it',
          )
        }
        if (plan.action === 'verify') {
          if (entry.publicationState === 'published' && !isPublished(live)) o.out('    ⚠ manifest says published but Google reports it is not accepting responses')
          if (entry.publicationState === 'configured' && isPublished(live)) o.out('    ⚠ form was published outside the CLI; manifest not changed')
        }
      } else if (step === 'forms.batchUpdate') {
        if (!live) throw new StopError('internal: batchUpdate without a form read')
        // Publish settings are not part of the content revision, so a form published directly in
        // Google can keep the recorded revision ID. Never rewrite a published form's content: the
        // delete/recreate batch would alter a live form that may already have responses.
        if (live.publishSettings?.publishState?.isPublished) {
          throw new StopError(
            'form was published in Google outside the CLI; the CLI does not rewrite live forms (existing responses would detach). Inspect it, then edit it in Google or launch a new form',
          )
        }
        // The batch deletes and recreates every item; only send it pinned to the revision just read.
        if (!live.revisionId) {
          throw new StopError('Google returned no revision ID for the form; not sending an unguarded content rewrite')
        }
        const body = configureBody(launch, template, live)
        if (!body.writeControl?.requiredRevisionId) throw new StopError('internal: content batch is not revision-pinned')
        const res = await client.batchUpdate(entry.formId!, body)
        counter.writes++
        const items = res.form?.items?.length ?? -1
        if (items !== template.questions.length) {
          throw new StopError(`forms.batchUpdate left ${items} item(s), expected ${template.questions.length}; entry not marked configured`)
        }
        live = res.form!
        entry = {
          ...entry,
          templateVersion: launch.templateVersion,
          publicationState: 'configured',
          contentHash: contentHash(launch, template),
          revisionId: res.form?.revisionId ?? res.writeControl?.requiredRevisionId ?? null,
          updatedAt: now(),
        }
        await save(entry)
        o.out(`    ✔ forms.batchUpdate → ${items} question(s) applied`)
      } else if (step === 'forms.setPublishSettings') {
        const res = await client.setPublishSettings(entry.formId!, publishBody())
        counter.writes++
        if (!isPublished({ publishSettings: res.publishSettings })) {
          throw new StopError('forms.setPublishSettings did not report the form as published and accepting responses')
        }
        published = true
        o.out('    ✔ forms.setPublishSettings → published, accepting responses')
      } else if (step === 'forms.get' && published) {
        live = await client.get(entry.formId!)
        if (!isPublished(live)) throw new StopError('read-back after publish shows the form is not accepting responses')
        if (!isResponderUrl(live.responderUri)) {
          throw new StopError('read-back responderUri is not a docs.google.com/forms/d/e/<id>/viewform link; not recorded')
        }
        entry = { ...entry, publicationState: 'published', responderUrl: live.responderUri, updatedAt: now() }
        await save(entry)
        o.out(`    ✔ forms.get → responder URL recorded`)
      }
    }
  }

  return {
    async apply(ctx) {
      const o = ctx.output
      const manifest = { current: ctx.manifest }
      const counter = { writes: 0 }
      const templates = new Map(ctx.templates.map(t => [templateId(t), t]))
      const launches = new Map(ctx.launch.forms.map(l => [l.entityKey, l]))
      if (!(await ready(o))) return 1
      o.out(`Applying plan ${ctx.plan.planId} (${ctx.plan.writeCount} planned write call(s))`)
      for (const p of ctx.plan.entries) {
        const launch = launches.get(p.entityKey)!
        o.out(`  ${p.entityKey}  ${p.action.toUpperCase()}`)
        try {
          await applyEntry(ctx, p, launch, templates.get(p.template)!, manifest, counter)
        } catch (e) {
          o.err(redact(`  ✖ ${p.entityKey}: ${describe(e)}`))
          o.err(`Stopped after ${counter.writes} write call(s). The manifest records every completed step; run plan again to resume.`)
          return 1
        }
      }
      o.out(`Done: ${counter.writes} write call(s). Manifest: ${ctx.manifestPath}`)
      o.out('Nothing was written to the website database. Link approved responder URLs through each entity’s admin signup field.')
      return 0
    },

    async inspect(ctx) {
      const o = ctx.output
      const entry = ctx.manifest.forms.find(e => e.entityKey === ctx.entityKey)
      if (!entry?.formId) {
        o.err(`✖ no recorded form for ${ctx.entityKey}`)
        return 1
      }
      if (!(await ready(o))) return 1
      let form: ApiForm
      try {
        form = await client.get(entry.formId)
      } catch (e) {
        o.err(redact(`✖ ${describe(e)}`))
        return 1
      }
      const template = ctx.templates.find(t => t.templateKey === entry.templateKey && t.templateVersion === entry.templateVersion)
      formatInspect(o, entry, form, template)
      return 0
    },
  }
}

function itemShape(item: ApiItem): string {
  const q = item.questionItem?.question
  if (!q) return 'non-question item'
  const type = q.textQuestion ? (q.textQuestion.paragraph ? 'paragraph' : 'shortText') : q.choiceQuestion?.type.toLowerCase().replace('drop_down', 'dropdown') ?? 'other'
  const opts = q.choiceQuestion ? ` [${q.choiceQuestion.options.map(x => x.value).join(' | ')}]` : ''
  return `${type}${q.required ? ', required' : ''}${opts}`
}

function questionShape(q: TemplateQuestion): string {
  return `${q.type}${q.required ? ', required' : ''}${q.options ? ` [${q.options.join(' | ')}]` : ''}`
}

function formatInspect(o: Output, entry: ManifestEntry, form: ApiForm, template: FormTemplate | undefined): void {
  const items = form.items ?? []
  const lines = [
    `${entry.entityKey}  form ${shortId(form.formId)}  manifest state: ${entry.publicationState}`,
    `  title: ${form.info.title}`,
    `  description: ${form.info.description ? `${form.info.description.length} characters` : '(none)'}`,
    `  email collection: ${form.settings?.emailCollectionType ?? 'unspecified'}`,
    `  published: ${form.publishSettings?.publishState?.isPublished ? 'yes' : 'no'}, accepting responses: ${form.publishSettings?.publishState?.isAcceptingResponses ? 'yes' : 'no'}`,
    `  responder URL: ${isPublished(form) && isResponderUrl(form.responderUri) ? form.responderUri : '(not published)'}`,
    `  revision: ${form.revisionId && form.revisionId === entry.revisionId ? 'matches manifest' : 'differs from manifest (edited outside the CLI, or not yet recorded)'}`,
    `  questions (${items.length}):`,
    ...items.map((it, i) => `    ${i + 1}. ${it.title ?? '(untitled)'} — ${itemShape(it)}`),
  ]
  if (template) {
    const expected = template.questions.map(q => `${q.title} — ${questionShape(q)}`)
    const actual = items.map(it => `${it.title ?? ''} — ${itemShape(it)}`)
    const same = expected.length === actual.length && expected.every((x, i) => x === actual[i])
    lines.push(`  template ${templateId(template)}: ${same ? 'questions match' : 'questions DIFFER from template'}`)
  }
  lines.forEach(l => o.out(redact(l)))
}
