/**
 * Operator auth for the Forms CLI. The only supported mode is Google's Application Default
 * Credentials user login through the gcloud CLI (no hand-rolled OAuth, no new dependency):
 *
 *   gcloud auth application-default login --client-id-file=<private client.json> \
 *     --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/cloud-platform
 *
 * The refresh credential stays in gcloud's private per-user store. This module asks gcloud for a
 * short-lived access token once per run and keeps it in memory. The token is never printed, logged
 * or written anywhere.
 */

/** Least-privilege scope: covers create/get/batchUpdate/setPublishSettings for files this client created. */
export const FORMS_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const AUTH_MODE = 'gcloud-adc'

export type ExecFileFn = (
  file: string,
  args: string[],
  opts: { timeout: number; env?: NodeJS.ProcessEnv },
) => Promise<{ stdout: string; stderr: string }>

export class NotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotConfiguredError'
  }
}

export interface AuthConfig {
  getToken: () => Promise<string>
  quotaProject?: string
}

const SETUP = 'See config/google-forms/README.md (Owner setup).'
const PROJECT_ID = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/

/**
 * Returns null when live execution is not configured (GOOGLE_FORMS_AUTH unset), so the CLI can
 * refuse before loading anything else. Throws NotConfiguredError for a set-but-invalid config.
 */
export function authFromEnv(env: Record<string, string | undefined>, execFile: ExecFileFn): AuthConfig | null {
  const mode = env.GOOGLE_FORMS_AUTH
  if (!mode) return null
  if (mode !== AUTH_MODE) throw new NotConfiguredError(`GOOGLE_FORMS_AUTH must be "${AUTH_MODE}" (got an unsupported value). ${SETUP}`)
  const quotaProject = env.GOOGLE_FORMS_QUOTA_PROJECT || undefined
  if (quotaProject && !PROJECT_ID.test(quotaProject)) {
    throw new NotConfiguredError(`GOOGLE_FORMS_QUOTA_PROJECT is not a valid project ID. ${SETUP}`)
  }

  let cached: Promise<string> | null = null
  const fetchToken = async (): Promise<string> => {
    let stdout: string
    try {
      ;({ stdout } = await execFile('gcloud', ['auth', 'application-default', 'print-access-token'], { timeout: 30_000 }))
    } catch (e) {
      const code = (e as { code?: unknown }).code
      // EACCES as well: on WSL a non-executable PATH entry can shadow a missing gcloud.
      if (code === 'ENOENT' || code === 'EACCES') throw new NotConfiguredError(`gcloud CLI not found (or not executable) on PATH. ${SETUP}`)
      // Deliberately not echoing gcloud's stderr: it can include the account email.
      throw new NotConfiguredError(`gcloud has no usable application-default login (run the login step with --client-id-file and the drive.file scope). ${SETUP}`)
    }
    const token = stdout.trim()
    if (!token || /\s/.test(token)) throw new NotConfiguredError(`gcloud returned no access token. ${SETUP}`)
    return token
  }

  return {
    quotaProject,
    getToken: () => {
      cached ??= fetchToken().catch(e => {
        cached = null
        throw e
      })
      return cached
    },
  }
}
