/**
 * Wires the live runner from the operator's environment. Returns no runner when
 * GOOGLE_FORMS_AUTH is unset, so `apply` and `inspect` refuse before any network call.
 */
import { authFromEnv, NotConfiguredError, type ExecFileFn } from './auth'
import type { LiveRunner } from './cli'
import { createFormsClient, type FetchFn } from './client'
import { createLiveRunner } from './execute'

export interface LiveEnvDeps {
  env: Record<string, string | undefined>
  execFile: ExecFileFn
  fetch: FetchFn
  sleep?: (ms: number) => Promise<void>
}

export function liveRunnerFromEnv(deps: LiveEnvDeps): { runner?: LiveRunner; error?: string } {
  let auth
  try {
    auth = authFromEnv(deps.env, deps.execFile)
  } catch (e) {
    if (e instanceof NotConfiguredError) return { error: e.message }
    throw e
  }
  if (!auth) return {}
  const client = createFormsClient({ fetch: deps.fetch, getToken: auth.getToken, quotaProject: auth.quotaProject, sleep: deps.sleep })
  return { runner: createLiveRunner({ client, preflight: async () => void (await auth.getToken()) }) }
}
