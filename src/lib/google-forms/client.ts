/**
 * Minimal Google Forms REST client: forms.create, forms.get, forms.batchUpdate,
 * forms.setPublishSettings (https://developers.google.com/workspace/forms/api/reference/rest, checked
 * 2026-11-22). Built on injected `fetch`; no SDK dependency.
 *
 * Retry policy (https://developers.google.com/workspace/forms/api/limits): truncated exponential
 * backoff with jitter on 429 and transient 5xx, honoring Retry-After, capped per call. forms.create is
 * not idempotent, so it retries only on 429 (rejected before execution). A 5xx or network failure on
 * create is reported as `ambiguous`: the form may exist.
 */
import { redact } from './redact'
import type { ApiForm, BatchUpdateBody, PublishBody } from './requests'

export const FORMS_API = 'https://forms.googleapis.com/v1'

export type FetchFn = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<{
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  text(): Promise<string>
}>

export interface ClientOptions {
  fetch: FetchFn
  getToken: () => Promise<string>
  quotaProject?: string
  sleep?: (ms: number) => Promise<void>
  random?: () => number
  maxRetries?: number
  maxBackoffMs?: number
  baseUrl?: string
}

export type Method = 'forms.create' | 'forms.get' | 'forms.batchUpdate' | 'forms.setPublishSettings'

export class FormsApiError extends Error {
  constructor(
    readonly method: Method,
    readonly status: number,
    message: string,
    /** True when the request may have taken effect (a write after 5xx, network failure or an unreadable success body). */
    readonly ambiguous: boolean,
    readonly attempts: number,
  ) {
    super(redact(message))
    this.name = 'FormsApiError'
  }
}

export interface BatchUpdateResult {
  form?: ApiForm
  replies?: unknown[]
  writeControl?: { requiredRevisionId?: string }
}

export interface PublishResult {
  formId: string
  publishSettings?: ApiForm['publishSettings']
}

export interface FormsClient {
  create(body: { info: { title: string; documentTitle: string } }): Promise<ApiForm>
  get(formId: string): Promise<ApiForm>
  batchUpdate(formId: string, body: BatchUpdateBody): Promise<BatchUpdateResult>
  setPublishSettings(formId: string, body: PublishBody): Promise<PublishResult>
}

const TRANSIENT = new Set([500, 502, 503, 504])
const FORM_ID = /^[A-Za-z0-9_-]+$/

function errorDetail(raw: string): string {
  try {
    const e = (JSON.parse(raw) as { error?: { status?: string; message?: string } }).error
    if (e) return [e.status, e.message].filter(Boolean).join(': ').slice(0, 300)
  } catch {
    // not JSON
  }
  return raw.slice(0, 120) || 'no response body'
}

/** Retry-After in seconds or HTTP date. Returns ms, or null when absent/unparseable. */
export function retryAfterMs(header: string | null, now = Date.now()): number | null {
  if (!header) return null
  const secs = Number(header)
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000
  const at = Date.parse(header)
  return Number.isNaN(at) ? null : Math.max(0, at - now)
}

export function createFormsClient(opts: ClientOptions): FormsClient {
  const sleep = opts.sleep ?? (ms => new Promise<void>(r => setTimeout(r, ms)))
  const random = opts.random ?? Math.random
  const maxRetries = opts.maxRetries ?? 4
  const maxBackoff = opts.maxBackoffMs ?? 32_000
  const base = opts.baseUrl ?? FORMS_API

  async function call<T>(method: Method, httpMethod: 'GET' | 'POST', path: string, body: unknown, idempotent: boolean): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      let token: string
      try {
        token = await opts.getToken()
      } catch (e) {
        // Nothing was sent, so this is never ambiguous.
        throw new FormsApiError(method, 0, `${method} could not obtain credentials: ${(e as Error).message}`, false, attempt + 1)
      }
      const headers: Record<string, string> = { authorization: `Bearer ${token}`, accept: 'application/json' }
      if (body !== undefined) headers['content-type'] = 'application/json'
      if (opts.quotaProject) headers['x-goog-user-project'] = opts.quotaProject

      let res: Awaited<ReturnType<FetchFn>>
      try {
        res = await opts.fetch(`${base}${path}`, { method: httpMethod, headers, body: body === undefined ? undefined : JSON.stringify(body) })
      } catch (e) {
        if (idempotent && attempt < maxRetries) {
          await sleep(backoff(attempt, null))
          continue
        }
        throw new FormsApiError(method, 0, `${method} network error: ${(e as Error).message}`, !idempotent, attempt + 1)
      }

      let raw: string
      try {
        raw = await res.text()
      } catch (e) {
        // The status line arrived but the body did not. A non-2xx status is still a definitive
        // rejection, so fall through to the status handling with no detail.
        if (res.ok) {
          // Accepted, outcome unreadable. Reads are safe to repeat; a write may have taken effect.
          if (idempotent && attempt < maxRetries) {
            await sleep(backoff(attempt, null))
            continue
          }
          throw new FormsApiError(method, res.status, `${method} response body could not be read: ${(e as Error).message}`, !idempotent, attempt + 1)
        }
        raw = ''
      }
      if (res.ok) {
        try {
          return (raw ? JSON.parse(raw) : {}) as T
        } catch {
          throw new FormsApiError(method, res.status, `${method} returned non-JSON success body`, !idempotent, attempt + 1)
        }
      }
      const retryable = res.status === 429 || (idempotent && TRANSIENT.has(res.status))
      if (retryable && attempt < maxRetries) {
        await sleep(backoff(attempt, retryAfterMs(res.headers.get('retry-after'))))
        continue
      }
      const ambiguous = !idempotent && res.status !== 429 && res.status >= 500
      const exhausted = retryable ? ` after ${attempt + 1} attempt(s)` : ''
      throw new FormsApiError(method, res.status, `${method} failed: HTTP ${res.status}${exhausted}: ${errorDetail(raw)}`, ambiguous, attempt + 1)
    }
  }

  function backoff(attempt: number, retryAfter: number | null): number {
    const exp = 2 ** attempt * 1000 + Math.floor(random() * 1000)
    return Math.min(retryAfter ?? exp, maxBackoff)
  }

  function idPath(formId: string): string {
    if (!FORM_ID.test(formId)) throw new Error('invalid form ID')
    return `/forms/${formId}`
  }

  return {
    create: body => call('forms.create', 'POST', '/forms?unpublished=true', body, false),
    get: async formId => call('forms.get', 'GET', idPath(formId), undefined, true),
    // With requiredRevisionId a replay fails with 400 instead of double-applying, so only then is retry safe.
    batchUpdate: async (formId, body) =>
      call('forms.batchUpdate', 'POST', `${idPath(formId)}:batchUpdate`, body, Boolean(body.writeControl?.requiredRevisionId)),
    setPublishSettings: async (formId, body) => call('forms.setPublishSettings', 'POST', `${idPath(formId)}:setPublishSettings`, body, true),
  }
}
