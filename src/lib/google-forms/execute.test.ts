import { describe, expect, it } from 'vitest'
import { QUOTA_BODY, fakeGoogle } from './__fixtures__/fake-google'
import { LAUNCH, MANIFEST, capture, launchEntry, launchFile, memoryIO, repoFiles } from './__fixtures__/memory'
import { runCli } from './cli'
import { createFormsClient } from './client'
import { createLiveRunner } from './execute'
import type { LaunchFile, Manifest } from './types'

const TOKEN = 'ya29.FIXTURE-access-token-never-printed'

function harness(files = repoFiles(), opts: { preflight?: () => Promise<void> } = {}) {
  const mem = memoryIO(files)
  const g = fakeGoogle()
  const cap = capture()
  const client = createFormsClient({ fetch: g.fetch, getToken: async () => TOKEN, sleep: async () => {}, random: () => 0 })
  const live = createLiveRunner({ client, now: () => new Date('2026-11-22T12:00:00Z'), preflight: opts.preflight })
  const run = (...argv: string[]) => runCli(argv, { io: mem.io, cwd: '/repo', live, ...cap.output })
  const all = () => [...cap.out, ...cap.err].join('\n')
  /** plan -> read plan ID -> apply --confirm, like an operator. */
  const applyReviewed = async () => {
    cap.out.length = 0
    await run('plan')
    const id = cap.out[0].match(/^Plan ([0-9a-f]{12})/)![1]
    return run('apply', '--confirm', id)
  }
  const manifest = () => mem.read(MANIFEST) as Manifest
  const setLaunch = (l: LaunchFile) => mem.store.set(`/repo/${LAUNCH}`, JSON.stringify(l))
  const plan = async () => {
    cap.out.length = 0
    await run('plan')
    return cap.out
  }
  return { mem, g, cap, run, all, applyReviewed, manifest, setLaunch, plan }
}

function expectNoSecrets(text: string, formIds: string[]) {
  expect(text).not.toContain(TOKEN)
  expect(text).not.toMatch(/Bearer/)
  for (const id of formIds) expect(text).not.toContain(id)
}

describe('apply: new form', () => {
  it('runs create -> batchUpdate -> setPublishSettings -> get and records a published C1 entry', async () => {
    const h = harness()
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['create', 'batchUpdate', 'setPublishSettings', 'get'])
    expect(h.g.calls[0].path).toBe('/forms?unpublished=true')

    const [form] = [...h.g.forms.values()]
    expect(form.info).toMatchObject({ title: 'Fixture group signup', description: 'Fixture description', documentTitle: 'Thrive signup · group:fixture-group · group-signup v1' })
    expect(form.settings).toEqual({ emailCollectionType: 'RESPONDER_INPUT' })
    expect(form.items?.map(i => i.title)).toEqual(['Full name', 'Notes', 'Preferred night'])

    const m = h.manifest()
    expect(m.forms).toEqual([
      {
        entityKey: 'group:fixture-group',
        templateKey: 'group-signup',
        templateVersion: 1,
        formId: form.formId,
        responderUrl: form.responderUri,
        publicationState: 'published',
        contentHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
        revisionId: form.revisionId,
        updatedAt: '2026-11-22T12:00:00.000Z',
      },
    ])
    expect(h.cap.out).toContain('    ✔ forms.create → form fakeFo… (unpublished)')
    expectNoSecrets(h.all(), [form.formId])
  })

  it('stops at configured when publish is false', async () => {
    const h = harness(repoFiles({ launch: launchFile(launchEntry({ publish: false })) }))
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['create', 'batchUpdate'])
    expect(h.manifest().forms[0]).toMatchObject({ publicationState: 'configured', responderUrl: null })
    const [form] = [...h.g.forms.values()]
    expect(form.publishSettings?.publishState).toEqual({ isPublished: false, isAcceptingResponses: false })
  })
})

describe('apply: reconciliation across reruns', () => {
  it('a second run reads back the recorded form and creates nothing', async () => {
    const h = harness()
    await h.applyReviewed()
    h.g.calls.length = 0
    expect((await h.plan())[0]).toMatch(/· 0 write call\(s\) · 0 blocked$/)
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['get'])
    expect(h.g.forms.size).toBe(1)
  })

  it('configured -> later publish runs get -> setPublishSettings -> get only', async () => {
    const h = harness(repoFiles({ launch: launchFile(launchEntry({ publish: false })) }))
    await h.applyReviewed()
    h.setLaunch(launchFile(launchEntry({ publish: true })))
    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['get', 'setPublishSettings', 'get'])
    expect(h.manifest().forms[0].publicationState).toBe('published')
    expect(h.g.forms.size).toBe(1)
  })

  it('an unpublished form whose launch text changed is reconfigured in place', async () => {
    const h = harness(repoFiles({ launch: launchFile(launchEntry({ publish: false })) }))
    await h.applyReviewed()
    h.setLaunch(launchFile(launchEntry({ publish: false, title: 'Updated title' })))
    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['get', 'batchUpdate'])
    const [form] = [...h.g.forms.values()]
    expect(form.info.title).toBe('Updated title')
    expect(form.items).toHaveLength(3) // old items deleted, not duplicated
  })
})

describe('apply: failures leave an accurate manifest', () => {
  it('a batchUpdate failure after create records "created"; the rerun resumes without a second create', async () => {
    const h = harness()
    h.g.fail(':batchUpdate', 400, { body: { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Invalid requests[2].createItem' } } })
    expect(await h.applyReviewed()).toBe(1)
    expect(h.cap.err[0]).toBe('  ✖ group:fixture-group: forms.batchUpdate failed: HTTP 400: INVALID_ARGUMENT: Invalid requests[2].createItem')
    expect(h.manifest().forms[0]).toMatchObject({ publicationState: 'created', formId: expect.any(String) })

    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['get', 'batchUpdate', 'setPublishSettings', 'get'])
    expect(h.g.forms.size).toBe(1)
    expect(h.manifest().forms[0].publicationState).toBe('published')
  })

  it('429 on publish retries with backoff, then stops cleanly when the budget is spent; rerun publishes', async () => {
    const h = harness()
    h.g.fail(':setPublishSettings', 429, { times: 5, body: QUOTA_BODY })
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.ops()).toEqual(['create', 'batchUpdate', ...Array(5).fill('setPublishSettings')])
    expect(h.cap.err[0]).toMatch(/HTTP 429 after 5 attempt\(s\): RESOURCE_EXHAUSTED/)
    expect(h.cap.err[1]).toBe('Stopped after 2 write call(s). The manifest records every completed step; run plan again to resume.')
    expect(h.manifest().forms[0].publicationState).toBe('configured')

    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.ops()).toEqual(['get', 'setPublishSettings', 'get'])
  })

  it('an ambiguous create (5xx) stays "creating" and the next plan is blocked, never re-created', async () => {
    const h = harness()
    h.g.fail('POST /forms?', 503, { afterApply: true })
    expect(await h.applyReviewed()).toBe(1)
    expect(h.cap.err[0]).toMatch(/The form may exist: entry left as "creating"/)
    expect(h.manifest().forms[0]).toMatchObject({ publicationState: 'creating', formId: null })
    const out = await h.plan()
    expect(out[0]).toMatch(/1 blocked$/)
    expect(out.join('\n')).toContain('Thrive signup · group:fixture-group · group-signup v1')
    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.calls).toHaveLength(0)
  })

  it('an accepted create whose response body cannot be read stays "creating" and is never re-created', async () => {
    const h = harness()
    h.g.fail('POST /forms?', 200, { afterApply: true, brokenBody: true })
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.ops()).toEqual(['create'])
    expect(h.cap.err[0]).toMatch(/forms\.create response body could not be read: aborted: stream reset\. The form may exist: entry left as "creating"/)
    expect(h.manifest().forms[0]).toMatchObject({ publicationState: 'creating', formId: null })
    expect((await h.plan())[0]).toMatch(/1 blocked$/)
    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.calls).toHaveLength(0)
    expect(h.g.forms.size).toBe(1)
    expectNoSecrets(h.all(), [...h.g.forms.keys()])
  })

  it('a rejected create (403) restores the entry so the next run can create', async () => {
    const h = harness()
    h.g.fail('POST /forms?', 403, { body: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Forms API has not been used in project 123' } } })
    expect(await h.applyReviewed()).toBe(1)
    expect(h.manifest().forms[0]).toMatchObject({ publicationState: 'planned', formId: null })
    expect(await h.applyReviewed()).toBe(0)
    expect(h.g.forms.size).toBe(1)
  })

  it('does not overwrite a form edited in Google since the CLI last wrote it', async () => {
    const h = harness(repoFiles({ launch: launchFile(launchEntry({ publish: false })) }))
    await h.applyReviewed()
    const [form] = [...h.g.forms.values()]
    h.g.editInGoogle(form.formId, { title: 'Staff-added question', questionItem: { question: { required: false, textQuestion: { paragraph: false } } } })
    h.setLaunch(launchFile(launchEntry({ publish: false, title: 'Updated title' })))
    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(1)
    expect(h.cap.err[0]).toMatch(/edited in Google since the CLI last wrote it; not overwriting/)
    expect(h.g.ops()).toEqual(['get'])
    expect(form.items).toHaveLength(4)
  })

  it('never rewrites content of a form published in Google, even when the revision ID still matches', async () => {
    const h = harness(repoFiles({ launch: launchFile(launchEntry({ publish: false })) }))
    await h.applyReviewed()
    const [form] = [...h.g.forms.values()]
    h.g.publishInGoogle(form.formId)
    expect(form.revisionId).toBe(h.manifest().forms[0].revisionId) // publish is not a content revision
    h.setLaunch(launchFile(launchEntry({ publish: false, title: 'Updated title' })))
    const before = h.manifest().forms[0]
    h.g.calls.length = 0
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.ops()).toEqual(['get'])
    expect(h.cap.err[0]).toMatch(/published in Google outside the CLI; the CLI does not rewrite live forms/)
    expect(form.info.title).not.toBe('Updated title')
    expect(form.items).toHaveLength(3)
    expect(h.manifest().forms[0]).toEqual(before)
  })

  it('fails closed before the destructive batch when forms.get returns no revision ID', async () => {
    const h = harness()
    h.g.fail(':batchUpdate', 400)
    await h.applyReviewed() // leaves "created", so the rerun resumes via get -> batchUpdate
    const [form] = [...h.g.forms.values()]
    h.g.omitRevisionIds()
    h.g.calls.length = 0
    h.cap.err.length = 0
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.ops()).toEqual(['get'])
    expect(h.cap.err[0]).toMatch(/no revision ID for the form; not sending an unguarded content rewrite/)
    expect(h.g.calls.some(c => c.path.endsWith(':batchUpdate'))).toBe(false)
    expect(form.items).toHaveLength(0)
    expect(h.manifest().forms[0].publicationState).toBe('created')
  })

  it('every content batch it sends is pinned with requiredRevisionId', async () => {
    const h = harness(repoFiles({ launch: launchFile(launchEntry({ publish: false })) }))
    await h.applyReviewed()
    h.setLaunch(launchFile(launchEntry({ publish: false, title: 'Updated title' })))
    expect(await h.applyReviewed()).toBe(0)
    const batches = h.g.calls.filter(c => c.path.endsWith(':batchUpdate'))
    expect(batches).toHaveLength(2)
    for (const b of batches) expect(b.body).toMatchObject({ writeControl: { requiredRevisionId: expect.stringMatching(/^rev\d+$/) } })
  })

  it('stops at the first failing entity and leaves later entities untouched', async () => {
    const files = repoFiles({ launch: launchFile(launchEntry({ entityKey: 'group:a' }), launchEntry({ entityKey: 'group:b' })) })
    const h = harness(files)
    h.g.fail('POST /forms?', 400)
    expect(await h.applyReviewed()).toBe(1)
    expect(h.g.ops()).toEqual(['create'])
    expect(h.manifest().forms.map(e => e.entityKey)).toEqual(['group:a'])
  })

  it('an auth preflight failure makes no API call and no manifest write', async () => {
    const h = harness(repoFiles(), {
      preflight: async () => {
        throw new Error('gcloud has no usable application-default login')
      },
    })
    expect(await h.applyReviewed()).toBe(1)
    expect(h.cap.err[0]).toBe('✖ live Google execution is not configured: gcloud has no usable application-default login')
    expect(h.g.calls).toHaveLength(0)
    expect(h.mem.writes).toEqual([])
  })
})

describe('inspect', () => {
  it('reads a recorded form back: fields, publish state, responder URL, template match', async () => {
    const h = harness()
    await h.applyReviewed()
    h.cap.out.length = 0
    h.g.calls.length = 0
    expect(await h.run('inspect', 'group:fixture-group')).toBe(0)
    expect(h.g.ops()).toEqual(['get'])
    const [form] = [...h.g.forms.values()]
    expect(h.cap.out).toEqual([
      'group:fixture-group  form fakeFo…  manifest state: published',
      '  title: Fixture group signup',
      '  description: 19 characters',
      '  email collection: RESPONDER_INPUT',
      '  published: yes, accepting responses: yes',
      `  responder URL: ${form.responderUri}`,
      '  revision: matches manifest',
      '  questions (3):',
      '    1. Full name — shortText, required',
      '    2. Notes — paragraph',
      '    3. Preferred night — radio [Tuesday | Thursday]',
      '  template group-signup@v1: questions match',
    ])
    expectNoSecrets(h.all(), [form.formId])
  })

  it('reports an unknown entity without calling Google', async () => {
    const h = harness()
    expect(await h.run('inspect', 'group:nope')).toBe(1)
    expect(h.cap.err).toEqual(['✖ no recorded form for group:nope'])
    expect(h.g.calls).toHaveLength(0)
  })

  it('reports a deleted form clearly', async () => {
    const h = harness()
    await h.applyReviewed()
    h.g.forms.clear()
    h.cap.err.length = 0
    expect(await h.run('inspect', 'group:fixture-group')).toBe(1)
    expect(h.cap.err[0]).toBe('✖ forms.get failed: HTTP 404: NOT_FOUND: Requested entity was not found.')
  })
})
