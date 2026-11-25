import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { launchEntry, launchFile, manifest, manifestEntry, template } from './__fixtures__/memory'
import {
  isResponderUrl,
  parseEntityKey,
  publicResponderUrl,
  validateLaunchFile,
  validateManifest,
  validateTemplate,
} from './validate'

const errorsOf = (r: { ok: boolean; errors?: string[] }) => (r.ok ? [] : r.errors ?? [])
const CONFIG = path.resolve(__dirname, '../../../config/google-forms')
const RESPONDER = 'https://docs.google.com/forms/d/e/1FAIpQLSfixture_ABC-123/viewform'

describe('validateTemplate', () => {
  it('accepts a well-formed template with the matching file name', () => {
    expect(validateTemplate(template(), 'group-signup.v1.json').ok).toBe(true)
  })

  it('names each problem by field path', () => {
    const bad = {
      ...template(),
      templateVersion: 0,
      kind: 'ministry',
      settings: { emailCollectionType: 'ALWAYS' },
      questions: [
        { key: 'Full Name', title: '', type: 'shortText', required: 'yes' },
        { key: 'pick', title: 'Pick', type: 'radio', required: true, options: [] },
        { key: 'pick', title: 'Again', type: 'paragraph', required: true, options: ['x'] },
      ],
      extra: 1,
    }
    const errors = errorsOf(validateTemplate(bad))
    expect(errors).toEqual(
      expect.arrayContaining([
        'template.extra: unknown field',
        'template.templateVersion: must be a positive integer',
        'template.kind: must be one of event, group',
        'template.settings.emailCollectionType: must be one of DO_NOT_COLLECT, VERIFIED, RESPONDER_INPUT',
        'template.questions[0].key: must be a kebab-case slug',
        'template.questions[0].title: required non-empty string',
        'template.questions[0].required: must be true or false',
        'template.questions[1].options: radio needs at least one option',
        'template.questions[2].options: only allowed for radio, checkbox and dropdown',
        'template.questions[2].key: duplicate key "pick"',
      ]),
    )
  })

  it('rejects placeholder text and duplicate options', () => {
    const t = template({
      questions: [{ key: 'q', title: 'TODO: real question', type: 'dropdown', required: true, options: ['A', 'A'] }],
    })
    expect(errorsOf(validateTemplate(t))).toEqual([
      'template.questions[0].title: contains placeholder text',
      'template.questions[0].options[1]: duplicate option',
    ])
  })

  it('requires approver role and date only when approved', () => {
    expect(errorsOf(validateTemplate(template({ approval: { status: 'approved', approvedBy: null, approvedOn: null } })))).toEqual([
      'template.approval.approvedBy: required non-empty string',
      'template.approval.approvedOn: required YYYY-MM-DD when approved',
    ])
    expect(errorsOf(validateTemplate(template({ approval: { status: 'draft', approvedBy: 'owner', approvedOn: null } })))).toEqual([
      'template.approval: a draft cannot carry approvedBy/approvedOn',
    ])
  })

  it('ties the file name to key and version', () => {
    expect(errorsOf(validateTemplate(template(), 'group-signup.json'))).toEqual([
      'template: file name must be group-signup.v1.json (got group-signup.json)',
    ])
  })

  it('rejects non-objects', () => {
    expect(errorsOf(validateTemplate([]))).toEqual(['template: must be a JSON object'])
  })
})

describe('parseEntityKey', () => {
  it.each([
    ['group:tuesday-night', { type: 'group', slug: 'tuesday-night' }],
    ['event:fall-retreat-2026', { type: 'event', slug: 'fall-retreat-2026' }],
    ['sandbox:forms-cli-check', { type: 'sandbox', slug: 'forms-cli-check' }],
  ])('parses %s', (key, expected) => expect(parseEntityKey(key)).toEqual(expected))

  it.each(['group', 'ministry:x', 'group:Has Space', 'group:', ':x', 'group:-x', 42])('rejects %s', key => {
    expect(parseEntityKey(key)).toBeNull()
  })
})

describe('validateLaunchFile', () => {
  const templates = [template(), template({ templateKey: 'event-signup', kind: 'event' })]

  it('accepts entries that reference loaded templates', () => {
    const launch = launchFile(launchEntry(), launchEntry({ entityKey: 'event:x', templateKey: 'event-signup' }))
    expect(validateLaunchFile(launch, templates).ok).toBe(true)
  })

  it('fails clearly on missing required inputs', () => {
    const launch = { launchVersion: 1, forms: [{ entityKey: 'group:a' }] }
    expect(errorsOf(validateLaunchFile(launch, templates))).toEqual([
      'launch.forms[0].title: required non-empty string',
      'launch.forms[0].publish: must be true or false',
      'launch.forms[0].templateVersion: must be a positive integer',
      'launch.forms[0].templateKey: required',
    ])
  })

  it('rejects unknown templates, kind mismatches and duplicate entities', () => {
    const launch = launchFile(
      launchEntry({ templateVersion: 9 }),
      launchEntry({ entityKey: 'event:x' }),
      launchEntry({ entityKey: 'event:x', templateKey: 'event-signup' }),
    )
    expect(errorsOf(validateLaunchFile(launch, templates))).toEqual([
      'launch.forms[0]: no template group-signup@v9',
      'launch.forms[1]: event entity cannot use group template group-signup@v1',
      'launch.forms[2].entityKey: duplicate "event:x" (one form per entity)',
    ])
  })

  it('lets sandbox entities use any template kind', () => {
    expect(validateLaunchFile(launchFile(launchEntry({ entityKey: 'sandbox:check' })), templates).ok).toBe(true)
  })

  it('rejects placeholder titles so invented copy cannot launch', () => {
    expect(errorsOf(validateLaunchFile(launchFile(launchEntry({ title: 'Group name TBD' })), templates))).toEqual([
      'launch.forms[0].title: contains placeholder text',
    ])
  })
})

describe('validateManifest (contract C1)', () => {
  const published = manifestEntry({
    formId: 'form_ABCDEFGHIJ',
    responderUrl: RESPONDER,
    publicationState: 'published',
    contentHash: 'sha256:x',
  })

  it('accepts every lifecycle state with consistent fields', () => {
    const m = manifest(
      manifestEntry({ entityKey: 'group:a' }),
      manifestEntry({ entityKey: 'group:b', publicationState: 'creating' }),
      manifestEntry({ entityKey: 'group:c', formId: 'form_c_123456', publicationState: 'created' }),
      manifestEntry({ entityKey: 'group:d', formId: 'form_d_123456', publicationState: 'configured', contentHash: 'sha256:x' }),
      published,
    )
    expect(validateManifest(m).ok).toBe(true)
  })

  it('rejects extra fields so tokens or editor URLs cannot be stored', () => {
    const m = manifest({ ...published, accessToken: 'ya29.x', editUrl: 'https://docs.google.com/forms/d/x/edit' } as never)
    expect(errorsOf(validateManifest(m))).toEqual([
      'manifest.forms[0].accessToken: unknown field',
      'manifest.forms[0].editUrl: unknown field',
    ])
  })

  it('enforces state invariants', () => {
    const m = manifest(
      manifestEntry({ entityKey: 'group:a', formId: 'form_a_123456' }),
      manifestEntry({ entityKey: 'group:b', publicationState: 'published', formId: 'form_b_123456', contentHash: 'x' }),
      manifestEntry({ entityKey: 'group:c', publicationState: 'configured', formId: 'form_c_123456', responderUrl: RESPONDER }),
      manifestEntry({ entityKey: 'group:d', publicationState: 'created' }),
    )
    expect(errorsOf(validateManifest(m))).toEqual([
      'manifest.forms[0]: planned entries cannot have a formId',
      'manifest.forms[1]: published entries need a responderUrl',
      'manifest.forms[2].responderUrl: only published entries carry a responder URL',
      'manifest.forms[2]: configured entries need a contentHash',
      'manifest.forms[3]: created entries need a formId',
    ])
  })

  it('rejects duplicate entities and one form recorded twice', () => {
    const m = manifest(published, { ...published }, { ...published, entityKey: 'group:other' })
    expect(errorsOf(validateManifest(m))).toEqual([
      'manifest.forms[1].entityKey: duplicate "group:fixture-group"',
      'manifest.forms[1].formId: recorded for more than one entity',
      'manifest.forms[2].formId: recorded for more than one entity',
    ])
  })
})

describe('responder URLs', () => {
  it.each([
    [RESPONDER, true],
    ['https://docs.google.com/forms/d/1abcDEF/edit', false],
    ['https://docs.google.com/forms/d/e/1FAIpQL/viewform?usp=pp_url&entry.1=x', false],
    ['https://docs.google.com/forms/d/e/1FAIpQL/formResponse', false],
    ['http://docs.google.com/forms/d/e/1FAIpQL/viewform', false],
    ['https://forms.gle/abc', false],
    ['https://evil.example/forms/d/e/1FAIpQL/viewform', false],
  ])('%s -> %s', (url, ok) => expect(isResponderUrl(url)).toBe(ok))

  it('publicResponderUrl returns a URL only for published, non-sandbox entries', () => {
    const published = manifestEntry({ formId: 'form_ABCDEFGHIJ', responderUrl: RESPONDER, publicationState: 'published', contentHash: 'x' })
    expect(publicResponderUrl(published)).toBe(RESPONDER)
    expect(publicResponderUrl({ ...published, entityKey: 'sandbox:check' })).toBeNull()
    expect(publicResponderUrl({ ...published, publicationState: 'configured' })).toBeNull()
    expect(publicResponderUrl({ ...published, responderUrl: 'https://docs.google.com/forms/d/x/edit' })).toBeNull()
    expect(publicResponderUrl(undefined)).toBeNull()
  })
})

describe('shipped config files', () => {
  it('every template validates and is still a draft pending owner approval', () => {
    const dir = path.join(CONFIG, 'templates')
    const names = readdirSync(dir).filter(n => n.endsWith('.json'))
    expect(names.sort()).toEqual(['event-signup.v1.json', 'group-signup.v1.json'])
    for (const name of names) {
      const t = JSON.parse(readFileSync(path.join(dir, name), 'utf8'))
      expect(errorsOf(validateTemplate(t, name))).toEqual([])
      expect(t.approval.status).toBe('draft')
    }
  })

  it('the C1 example manifest validates, is flagged fixture and carries only fake IDs', () => {
    const m = JSON.parse(readFileSync(path.join(CONFIG, 'manifest.example.json'), 'utf8'))
    expect(errorsOf(validateManifest(m))).toEqual([])
    expect(m.fixture).toBe(true)
    expect(m.forms.map((e: { publicationState: string }) => e.publicationState)).toEqual(['planned', 'configured', 'published'])
    for (const e of m.forms) {
      for (const k of ['entityKey', 'templateKey', 'templateVersion', 'formId', 'responderUrl', 'publicationState']) expect(e).toHaveProperty(k)
      if (e.responderUrl) expect(e.responderUrl).toContain('FIXTURE')
    }
  })

  it('the example launch file only contains a sandbox entry', () => {
    const dir = path.join(CONFIG, 'templates')
    const templates = readdirSync(dir).map(n => JSON.parse(readFileSync(path.join(dir, n), 'utf8')))
    const launch = JSON.parse(readFileSync(path.join(CONFIG, 'launch.example.json'), 'utf8'))
    expect(errorsOf(validateLaunchFile(launch, templates))).toEqual([])
    expect(launch.forms.every((f: { entityKey: string }) => f.entityKey.startsWith('sandbox:'))).toBe(true)
  })
})
