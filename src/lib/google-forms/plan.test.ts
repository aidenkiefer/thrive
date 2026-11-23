import { describe, expect, it } from 'vitest'
import { launchEntry, launchFile, manifest, manifestEntry, template } from './__fixtures__/memory'
import { buildPlan } from './plan'
import { configureBody, contentHash, contentRequests, createBody, documentTitle, publishBody } from './requests'

const t = template()
const draft = template({ approval: { status: 'draft', approvedBy: null, approvedOn: null } })
const l = launchEntry()
const hash = contentHash(l, t)

function planFor(entry = l, recorded?: Parameters<typeof manifestEntry>[0], tmpl = t) {
  return buildPlan(launchFile(entry), [tmpl], manifest(...(recorded ? [manifestEntry(recorded)] : []))).entries[0]
}

describe('buildPlan: operation order', () => {
  it('new entity: create (unpublished) -> batchUpdate -> setPublishSettings -> get', () => {
    const e = planFor()
    expect(e.action).toBe('create')
    expect(e.steps).toEqual(['forms.create', 'forms.batchUpdate', 'forms.setPublishSettings', 'forms.get'])
  })

  it('new entity not set to publish stops after batchUpdate', () => {
    expect(planFor({ ...l, publish: false }).steps).toEqual(['forms.create', 'forms.batchUpdate'])
  })

  it('treats a planned manifest entry like a new entity', () => {
    expect(planFor(l, { publicationState: 'planned' }).action).toBe('create')
  })
})

describe('buildPlan: reconciliation never duplicates a recorded form', () => {
  it('created (content not applied) resumes with get -> batchUpdate, no create', () => {
    const e = planFor(l, { formId: 'form_1234567890', publicationState: 'created' })
    expect(e.action).toBe('configure')
    expect(e.steps).toEqual(['forms.get', 'forms.batchUpdate', 'forms.setPublishSettings', 'forms.get'])
    expect(e.recordedFormId).toBe('form_1234567890')
  })

  it('configured and unchanged only publishes', () => {
    const e = planFor(l, { formId: 'form_1234567890', publicationState: 'configured', contentHash: hash })
    expect(e.action).toBe('publish')
    expect(e.steps).toEqual(['forms.get', 'forms.setPublishSettings', 'forms.get'])
  })

  it('configured and unchanged, not publishing: read-only verify', () => {
    const e = planFor({ ...l, publish: false }, { formId: 'form_1234567890', publicationState: 'configured', contentHash: hash })
    expect(e).toMatchObject({ action: 'verify', steps: ['forms.get'] })
  })

  it('configured with drifted content reapplies the template', () => {
    const e = planFor({ ...l, title: 'New title' }, { formId: 'form_1234567890', publicationState: 'configured', contentHash: hash })
    expect(e.action).toBe('configure')
  })

  it('published and unchanged: verify only, zero writes', () => {
    const p = buildPlan(
      launchFile(l),
      [t],
      manifest(manifestEntry({ formId: 'form_1234567890', publicationState: 'published', contentHash: hash, responderUrl: 'https://docs.google.com/forms/d/e/x/viewform' })),
    )
    expect(p.entries[0]).toMatchObject({ action: 'verify', steps: ['forms.get'] })
    expect(p.writeCount).toBe(0)
  })
})

describe('buildPlan: blocked instead of guessing', () => {
  it('a lost create result (creating) is blocked with recovery guidance', () => {
    const e = planFor(l, { publicationState: 'creating' })
    expect(e.action).toBe('blocked')
    expect(e.steps).toEqual([])
    expect(e.reason).toContain(documentTitle(l))
  })

  it('a published form whose content drifted is never rewritten', () => {
    const e = planFor({ ...l, title: 'Changed' }, { formId: 'form_1234567890', publicationState: 'published', contentHash: hash, responderUrl: 'x' })
    expect(e.action).toBe('blocked')
    expect(e.reason).toContain('does not rewrite live forms')
  })

  it('a draft template is blocked for real entities but allowed for sandbox', () => {
    expect(planFor(l, undefined, draft).action).toBe('blocked')
    expect(planFor({ ...l, entityKey: 'sandbox:check' }, undefined, draft).action).toBe('create')
  })

  it('switching template keys on a recorded entity is blocked', () => {
    const other = template({ templateKey: 'other-signup' })
    const p = buildPlan(
      launchFile({ ...l, templateKey: 'other-signup' }),
      [other],
      manifest(manifestEntry({ formId: 'form_1234567890', publicationState: 'configured', contentHash: hash })),
    )
    expect(p.entries[0].action).toBe('blocked')
  })
})

describe('plan ID and totals', () => {
  it('is stable for identical inputs and changes when anything reviewed changes', () => {
    const a = buildPlan(launchFile(l), [t], manifest())
    expect(buildPlan(launchFile(l), [t], manifest()).planId).toBe(a.planId)
    expect(buildPlan(launchFile({ ...l, title: 'Other' }), [t], manifest()).planId).not.toBe(a.planId)
    expect(buildPlan(launchFile(l), [t], manifest(manifestEntry({ publicationState: 'creating' }))).planId).not.toBe(a.planId)
    expect(a.planId).toMatch(/^[0-9a-f]{12}$/)
  })

  it('counts writes and blocked entries and lists untracked manifest entries', () => {
    const p = buildPlan(
      launchFile(l, { ...l, entityKey: 'group:two', publish: false }),
      [t],
      manifest(manifestEntry({ entityKey: 'group:retired', formId: 'form_r_123456', publicationState: 'configured', contentHash: 'x' })),
    )
    expect(p.writeCount).toBe(3 + 2)
    expect(p.blockedCount).toBe(0)
    expect(p.untracked).toEqual(['group:retired'])
  })
})

describe('request bodies', () => {
  it('create sends only title and a deterministic documentTitle', () => {
    expect(createBody(l)).toEqual({ info: { title: 'Fixture group signup', documentTitle: 'Thrive signup · group:fixture-group · group-signup v1' } })
  })

  it('content: info, settings, then one createItem per question in template order', () => {
    const r = contentRequests(l, t)
    expect(r[0]).toEqual({ updateFormInfo: { info: { title: l.title, description: l.description }, updateMask: 'title,description' } })
    expect(r[1]).toEqual({ updateSettings: { settings: { emailCollectionType: 'RESPONDER_INPUT' }, updateMask: 'emailCollectionType' } })
    expect(r.slice(2)).toEqual([
      { createItem: { item: { title: 'Full name', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } }, location: { index: 0 } } },
      { createItem: { item: { title: 'Notes', questionItem: { question: { required: false, textQuestion: { paragraph: true } } } }, location: { index: 1 } } },
      {
        createItem: {
          item: { title: 'Preferred night', questionItem: { question: { required: false, choiceQuestion: { type: 'RADIO', options: [{ value: 'Tuesday' }, { value: 'Thursday' }] } } } },
          location: { index: 2 },
        },
      },
    ])
  })

  it('configure deletes existing items highest index first and pins the revision', () => {
    const body = configureBody(l, t, { items: [{}, {}], revisionId: 'rev1' })
    expect(body.requests.slice(0, 2)).toEqual([{ deleteItem: { location: { index: 1 } } }, { deleteItem: { location: { index: 0 } } }])
    expect(body.writeControl).toEqual({ requiredRevisionId: 'rev1' })
    expect(body.includeFormInResponse).toBe(true)
  })

  it('publish sets both publishState flags', () => {
    expect(publishBody()).toEqual({ publishSettings: { publishState: { isPublished: true, isAcceptingResponses: true } }, updateMask: 'publishState' })
  })
})
