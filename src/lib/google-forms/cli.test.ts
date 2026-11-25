import { describe, expect, it } from 'vitest'
import { LAUNCH, MANIFEST, capture, launchEntry, launchFile, manifest, manifestEntry, memoryIO, repoFiles, template } from './__fixtures__/memory'
import { parseArgs, runCli, type LiveRunner } from './cli'

function setup(files = repoFiles(), live?: LiveRunner) {
  const mem = memoryIO(files)
  const cap = capture()
  const run = (...argv: string[]) => runCli(argv, { io: mem.io, cwd: '/repo', live, ...cap.output })
  return { mem, cap, run }
}

function liveSpy() {
  const calls: string[] = []
  const live: LiveRunner = {
    async apply(ctx) {
      calls.push(`apply:${ctx.plan.planId}`)
      return 0
    },
    async inspect(ctx) {
      calls.push(`inspect:${ctx.entityKey}`)
      return 0
    },
  }
  return { calls, live }
}

async function planId(run: (...a: string[]) => Promise<number>, out: string[]) {
  await run('plan')
  return out[0].match(/^Plan ([0-9a-f]{12})/)![1]
}

describe('parseArgs', () => {
  it('parses values in both forms and rejects unknown options', () => {
    const a = parseArgs(['plan', '--launch', 'x.json', '--manifest=m.json'])
    expect(a).toMatchObject({ command: 'plan' })
    expect('flags' in a && Object.fromEntries(a.flags)).toEqual({ '--launch': 'x.json', '--manifest': 'm.json' })
    expect(parseArgs(['plan', '--yes'])).toEqual({ error: 'unknown option --yes' })
    expect(parseArgs(['apply', '--confirm'])).toEqual({ error: '--confirm needs a value' })
  })
})

describe('offline commands', () => {
  it('validate passes with zero network and zero writes', async () => {
    const { run, cap, mem } = setup()
    expect(await run('validate')).toBe(0)
    expect(cap.out).toEqual(['✔ 1 template(s), 1 launch entry, 0 manifest entries valid'])
    expect(mem.writes).toEqual([])
  })

  it('plan prints ordered operations and a plan ID, and writes nothing', async () => {
    const { run, cap, mem } = setup()
    expect(await run('plan')).toBe(0)
    expect(cap.out[0]).toMatch(/^Plan [0-9a-f]{12} · 1 form\(s\) · 3 write call\(s\) · 0 blocked$/)
    expect(cap.out).toContain('    forms.create → forms.batchUpdate → forms.setPublishSettings → forms.get')
    expect(cap.out).toContain('Dry run only. Nothing was sent to Google.')
    expect(cap.out.at(-1)).toMatch(/apply --confirm [0-9a-f]{12}$/)
    expect(mem.writes).toEqual([])
  })

  it('plan flags draft templates', async () => {
    const draft = template({ approval: { status: 'draft', approvedBy: null, approvedOn: null } })
    const { run, cap } = setup(repoFiles({ template: draft, launch: launchFile(launchEntry({ entityKey: 'sandbox:check' })) }))
    await run('plan')
    expect(cap.out).toContain('Draft templates (sandbox use only until owner approval): group-signup@v1')
  })

  it('missing launch file fails clearly', async () => {
    const files = repoFiles()
    delete files[LAUNCH]
    const { run, cap } = setup(files)
    expect(await run('plan')).toBe(1)
    expect(cap.err[0]).toBe('✖ launch file not found: config/google-forms/launch.json')
  })

  it('invalid input lists every error and exits 1', async () => {
    const { run, cap } = setup(repoFiles({ launch: { launchVersion: 1, forms: [{ entityKey: 'nope' }] } as never }))
    expect(await run('validate')).toBe(1)
    expect(cap.err[0]).toBe('✖ launch file invalid')
    expect(cap.err).toContain('  - /repo/config/google-forms/launch.json: launch.forms[0].entityKey: must look like event:<slug>, group:<slug> or sandbox:<slug>')
  })

  it('malformed JSON is reported, not thrown', async () => {
    const { run, cap } = setup({ ...repoFiles(), [MANIFEST]: '{not json' })
    expect(await run('plan')).toBe(1)
    expect(cap.err[1]).toMatch(/manifest\.json: invalid JSON/)
  })

  it('unknown command and bare invocation print usage with exit 2', async () => {
    const { run, cap } = setup()
    expect(await run('submit')).toBe(2)
    expect(cap.err[0]).toBe('unknown command submit')
    expect(await run()).toBe(2)
  })
})

describe('apply guards (before any live call)', () => {
  it('requires --confirm', async () => {
    const { live, calls } = liveSpy()
    const { run, cap } = setup(repoFiles(), live)
    expect(await run('apply')).toBe(2)
    expect(cap.err[0]).toMatch(/apply needs --confirm/)
    expect(calls).toEqual([])
  })

  it('refuses a confirmation that does not match the current plan', async () => {
    const { live, calls } = liveSpy()
    const { run, cap } = setup(repoFiles(), live)
    expect(await run('apply', '--confirm', 'abcdef123456')).toBe(1)
    expect(cap.err[0]).toMatch(/plan ID mismatch/)
    expect(calls).toEqual([])
  })

  it('refuses blocked plans', async () => {
    const { live, calls } = liveSpy()
    const { run, cap } = setup(repoFiles({ manifest: manifest(manifestEntry({ publicationState: 'creating' })) }), live)
    const id = await planId(run, cap.out)
    expect(await run('apply', '--confirm', id)).toBe(1)
    expect(cap.err.at(-1)).toBe('✖ plan has blocked entries; resolve them first')
    expect(calls).toEqual([])
  })

  it('refuses a fixture manifest', async () => {
    const { live, calls } = liveSpy()
    const { run, cap } = setup(repoFiles({ manifest: { ...manifest(), fixture: true } }), live)
    const id = await planId(run, cap.out)
    expect(await run('apply', '--confirm', id)).toBe(1)
    expect(cap.err.at(-1)).toBe('✖ refusing to execute against a fixture manifest')
    expect(calls).toEqual([])
  })

  it('fails clearly when live execution is not configured', async () => {
    const { run, cap } = setup()
    const id = await planId(run, cap.out)
    expect(await run('apply', '--confirm', id)).toBe(1)
    expect(cap.err.at(-1)).toMatch(/live Google execution is not configured/)
    expect(await run('inspect', 'group:fixture-group')).toBe(1)
  })

  it('hands a confirmed plan to the live runner', async () => {
    const { live, calls } = liveSpy()
    const { run, cap } = setup(repoFiles(), live)
    const id = await planId(run, cap.out)
    expect(await run('apply', `--confirm=${id}`)).toBe(0)
    expect(calls).toEqual([`apply:${id}`])
  })
})
