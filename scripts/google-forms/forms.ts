/**
 * Google Forms launch CLI (#151). Operator-only; see config/google-forms/README.md.
 *   npx tsx scripts/google-forms/forms.ts <validate|plan|apply|inspect> [options]
 */
import { runCli } from '../../src/lib/google-forms/cli'
import { nodeFileIO } from '../../src/lib/google-forms/files'

runCli(process.argv.slice(2), {
  io: nodeFileIO,
  cwd: process.cwd(),
  out: line => console.log(line),
  err: line => console.error(line),
}).then(
  code => process.exit(code),
  error => {
    console.error(`✖ unexpected failure: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  },
)
