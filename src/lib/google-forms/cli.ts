/**
 * Operator CLI for Google Forms launch forms (#151). Entry point: scripts/google-forms/forms.ts.
 *
 *   validate                     check templates, launch file and manifest (offline)
 *   plan                         dry run: print ordered API operations and a plan ID (offline)
 *   apply --confirm <planId>     execute that exact plan against Google (live; needs auth config)
 *   inspect <entityKey>          read one recorded form back from Google (live, read-only)
 *
 * All dependencies are injected so tests run with fixtures and no network.
 */
import path from 'node:path'
import { loadLaunchFile, loadManifest, loadTemplates, type FileIO } from './files'
import { buildPlan, type Plan } from './plan'
import { redact, shortId } from './redact'
import type { FormTemplate, LaunchFile, Manifest } from './types'
import { templateId } from './validate'

export const ENTRY = 'npx tsx scripts/google-forms/forms.ts'

export interface Output {
  out(line: string): void
  err(line: string): void
}

export interface CliDeps extends Output {
  io: FileIO
  cwd: string
  /** Live Google execution. Absent in offline contexts; see live.ts. */
  live?: LiveRunner
}

/** Implemented in live.ts; injected so offline commands never load auth or network code paths. */
export interface LiveRunner {
  apply(ctx: LiveContext): Promise<number>
  inspect(ctx: LiveContext & { entityKey: string }): Promise<number>
}

export interface LiveContext {
  plan: Plan
  launch: LaunchFile
  templates: FormTemplate[]
  manifest: Manifest
  manifestPath: string
  io: FileIO
  output: Output
}

interface Args {
  command: string | undefined
  positional: string[]
  flags: Map<string, string>
}

const VALUE_FLAGS = ['--templates', '--launch', '--manifest', '--confirm'] as const

export function parseArgs(argv: string[]): Args | { error: string } {
  const [command, ...rest] = argv
  const flags = new Map<string, string>()
  const positional: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a.startsWith('--')) {
      const [name, inline] = a.split('=', 2)
      if (!(VALUE_FLAGS as readonly string[]).includes(name)) return { error: `unknown option ${name}` }
      const value = inline ?? rest[++i]
      if (value === undefined || value.startsWith('--')) return { error: `${name} needs a value` }
      flags.set(name, value)
    } else {
      positional.push(a)
    }
  }
  return { command, positional, flags }
}

const USAGE = [
  `Usage: ${ENTRY} <validate|plan|apply|inspect> [options]`,
  '  validate                      Check templates, launch file and manifest. Offline.',
  '  plan                          Dry run. Prints the operations and a plan ID. Offline.',
  '  apply --confirm <planId>      Execute exactly the reviewed plan against Google. Live.',
  '  inspect <entityKey>           Read a recorded form back from Google. Live, read-only.',
  'Options: --templates <dir>  --launch <file>  --manifest <file>',
  'Defaults: config/google-forms/templates, config/google-forms/launch.json, config/google-forms/manifest.json',
]

function printErrors(o: Output, title: string, errors: string[]): void {
  o.err(redact(`✖ ${title}`))
  for (const e of errors) o.err(redact(`  - ${e}`))
}

export function formatPlan(plan: Plan, templates: FormTemplate[]): string[] {
  const lines = [
    `Plan ${plan.planId} · ${plan.entries.length} form(s) · ${plan.writeCount} write call(s) · ${plan.blockedCount} blocked`,
  ]
  for (const e of plan.entries) {
    lines.push(`  ${e.entityKey}  ${e.template}  ${e.action.toUpperCase()}  form ${shortId(e.recordedFormId)}`)
    if (e.steps.length) lines.push(`    ${e.steps.join(' → ')}`)
    lines.push(`    ${e.reason}`)
  }
  for (const k of plan.untracked) lines.push(`  ${k}  (in manifest, not in launch file: left untouched)`)
  const drafts = templates.filter(t => t.approval.status === 'draft').map(templateId)
  if (drafts.length) lines.push(`Draft templates (sandbox use only until owner approval): ${drafts.join(', ')}`)
  return lines.map(redact)
}

export async function runCli(argv: string[], deps: CliDeps): Promise<number> {
  const args = parseArgs(argv)
  if ('error' in args) {
    deps.err(args.error)
    USAGE.forEach(l => deps.err(l))
    return 2
  }
  const { command, flags, positional } = args
  if (!command || command === 'help' || command === '--help') {
    USAGE.forEach(l => deps.out(l))
    return command ? 0 : 2
  }
  if (!['validate', 'plan', 'apply', 'inspect'].includes(command)) {
    deps.err(`unknown command ${command}`)
    USAGE.forEach(l => deps.err(l))
    return 2
  }

  const resolve = (flag: string, fallback: string) => path.resolve(deps.cwd, flags.get(flag) ?? fallback)
  const templatesDir = resolve('--templates', 'config/google-forms/templates')
  const launchPath = resolve('--launch', 'config/google-forms/launch.json')
  const manifestPath = resolve('--manifest', 'config/google-forms/manifest.json')

  const templates = await loadTemplates(deps.io, templatesDir)
  if (!templates.ok) {
    printErrors(deps, 'templates invalid', templates.errors)
    return 1
  }
  const manifest = await loadManifest(deps.io, manifestPath)
  if (!manifest.ok) {
    printErrors(deps, 'manifest invalid', manifest.errors)
    return 1
  }

  if (command === 'inspect') {
    const entityKey = positional[0]
    if (!entityKey) {
      deps.err('inspect needs an entity key, e.g. inspect sandbox:forms-cli-check')
      return 2
    }
    if (!deps.live) return notConfigured(deps)
    const emptyPlan: Plan = { planId: '', entries: [], writeCount: 0, blockedCount: 0, untracked: [] }
    return deps.live.inspect({
      plan: emptyPlan,
      launch: { launchVersion: 1, forms: [] },
      templates: templates.value,
      manifest: manifest.value,
      manifestPath,
      io: deps.io,
      output: deps,
      entityKey,
    })
  }

  if (!(await deps.io.exists(launchPath))) {
    deps.err(`✖ launch file not found: ${path.relative(deps.cwd, launchPath) || launchPath}`)
    deps.err('  Copy config/google-forms/launch.example.json to launch.json and fill it with owner-approved entries.')
    return 1
  }
  const launch = await loadLaunchFile(deps.io, launchPath, templates.value)
  if (!launch.ok) {
    printErrors(deps, 'launch file invalid', launch.errors)
    return 1
  }

  if (command === 'validate') {
    deps.out(
      `✔ ${templates.value.length} template(s), ${launch.value.forms.length} launch entr${launch.value.forms.length === 1 ? 'y' : 'ies'}, ${manifest.value.forms.length} manifest entr${manifest.value.forms.length === 1 ? 'y' : 'ies'} valid`,
    )
    return 0
  }

  const plan = buildPlan(launch.value, templates.value, manifest.value)

  if (command === 'plan') {
    formatPlan(plan, templates.value).forEach(l => deps.out(l))
    deps.out('Dry run only. Nothing was sent to Google.')
    if (manifest.value.fixture) deps.out('Fixture manifest: for review only; apply will refuse it.')
    else if (plan.blockedCount) deps.out('Resolve blocked entries before apply; apply refuses a plan with blocked entries.')
    else if (plan.writeCount) deps.out(`To execute after review: ${ENTRY} apply --confirm ${plan.planId}`)
    return 0
  }

  // apply
  const confirm = flags.get('--confirm')
  if (!confirm) {
    deps.err(`✖ apply needs --confirm <planId>. Run \`${ENTRY} plan\` first and review it.`)
    return 2
  }
  if (confirm !== plan.planId) {
    deps.err(`✖ plan ID mismatch: confirmed ${confirm}, current inputs give ${plan.planId}. Re-run plan and review the changes.`)
    return 1
  }
  if (manifest.value.fixture) {
    deps.err('✖ refusing to execute against a fixture manifest')
    return 1
  }
  if (plan.blockedCount) {
    formatPlan(plan, templates.value).forEach(l => deps.err(l))
    deps.err('✖ plan has blocked entries; resolve them first')
    return 1
  }
  if (plan.writeCount === 0 && plan.entries.every(e => e.steps.length === 0)) {
    deps.out('Nothing to do.')
    return 0
  }
  if (!deps.live) return notConfigured(deps)
  return deps.live.apply({
    plan,
    launch: launch.value,
    templates: templates.value,
    manifest: manifest.value,
    manifestPath,
    io: deps.io,
    output: deps,
  })
}

function notConfigured(o: Output): number {
  o.err('✖ live Google execution is not configured. See config/google-forms/README.md (Owner setup).')
  return 1
}
