/**
 * Google Forms launch CLI (#151). Operator-only; see config/google-forms/README.md.
 *   npx tsx scripts/google-forms/forms.ts <validate|plan|apply|inspect> [options]
 * Live commands need GOOGLE_FORMS_AUTH=gcloud-adc and a gcloud application-default login.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { runCli } from '../../src/lib/google-forms/cli'
import { nodeFileIO } from '../../src/lib/google-forms/files'
import { liveRunnerFromEnv } from '../../src/lib/google-forms/live'

const live = liveRunnerFromEnv({ env: process.env, execFile: promisify(execFile), fetch })
if (live.error) console.error(`✖ ${live.error}`)

runCli(process.argv.slice(2), {
  io: nodeFileIO,
  cwd: process.cwd(),
  live: live.runner,
  out: line => console.log(line),
  err: line => console.error(line),
}).then(
  code => process.exit(code),
  error => {
    console.error(`✖ unexpected failure: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  },
)
