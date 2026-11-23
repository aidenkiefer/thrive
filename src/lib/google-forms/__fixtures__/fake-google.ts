/**
 * Stateful in-memory stand-in for the four Forms REST methods the CLI uses. Lets tests check
 * operation order, reconciliation across reruns and failure handling with zero network.
 * Shapes follow the public reference; this is a fixture, not evidence the real service behaves so.
 */
import type { FetchFn } from '../client'
import type { ApiForm, ApiItem, ApiRequest } from '../requests'

export interface RecordedCall {
  method: string
  path: string
  headers: Record<string, string>
  body: unknown
}

interface Failure {
  match: string
  status: number
  times: number
  body?: unknown
  headers?: Record<string, string>
  /** Apply the request, then fail (simulates a lost response). */
  afterApply?: boolean
  network?: boolean
}

export const QUOTA_BODY = {
  error: { code: 429, message: "Quota exceeded for quota metric 'Write requests' and limit 'Write requests per minute per user'", status: 'RESOURCE_EXHAUSTED' },
}

export function fakeGoogle() {
  const forms = new Map<string, ApiForm>()
  const calls: RecordedCall[] = []
  const failures: Failure[] = []
  let seq = 0
  let rev = 0
  const nextRev = () => `rev${++rev}`

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
    text: async () => JSON.stringify(body),
  })

  function apply(method: string, path: string, body: unknown) {
    if (method === 'POST' && path.startsWith('/forms?')) {
      const b = body as { info: ApiForm['info'] }
      const formId = `fakeForm${String(++seq).padStart(4, '0')}_ABCDEFG`
      const form: ApiForm = {
        formId,
        info: { title: b.info.title, documentTitle: b.info.documentTitle },
        items: [],
        revisionId: nextRev(),
        // Real responder IDs differ from form IDs; keep them distinct so leak checks are meaningful.
        responderUri: `https://docs.google.com/forms/d/e/1FAIpQLSfakeResponder${seq}/viewform`,
        publishSettings: { publishState: { isPublished: !path.includes('unpublished=true'), isAcceptingResponses: !path.includes('unpublished=true') } },
      }
      forms.set(formId, form)
      return json(200, form)
    }
    const m = path.match(/^\/forms\/([^/:?]+)(?::(batchUpdate|setPublishSettings))?$/)
    const form = m && forms.get(m[1])
    if (!m || !form) return json(404, { error: { code: 404, message: 'Requested entity was not found.', status: 'NOT_FOUND' } })
    if (!m[2]) return json(200, form)
    if (m[2] === 'setPublishSettings') {
      const b = body as { publishSettings: ApiForm['publishSettings'] }
      form.publishSettings = b.publishSettings
      return json(200, { formId: form.formId, publishSettings: form.publishSettings })
    }
    const b = body as { requests: ApiRequest[]; writeControl?: { requiredRevisionId: string }; includeFormInResponse: boolean }
    if (b.writeControl && b.writeControl.requiredRevisionId !== form.revisionId) {
      return json(400, { error: { code: 400, message: 'The required revision ID does not match the latest revision.', status: 'FAILED_PRECONDITION' } })
    }
    const items = [...(form.items ?? [])]
    for (const r of b.requests) {
      if ('deleteItem' in r) items.splice(r.deleteItem.location.index, 1)
      else if ('createItem' in r) items.splice(r.createItem.location.index, 0, { itemId: `item${items.length}`, ...r.createItem.item })
      else if ('updateFormInfo' in r) form.info = { ...form.info, ...r.updateFormInfo.info }
      else if ('updateSettings' in r) form.settings = { ...form.settings, ...r.updateSettings.settings }
    }
    form.items = items
    form.revisionId = nextRev()
    return json(200, { replies: b.requests.map(() => ({})), form: b.includeFormInResponse ? form : undefined, writeControl: { requiredRevisionId: form.revisionId } })
  }

  const fetch: FetchFn = async (url, init) => {
    const path = url.replace('https://forms.googleapis.com/v1', '')
    const body = init.body ? JSON.parse(init.body) : undefined
    calls.push({ method: init.method, path, headers: init.headers, body })
    const label = `${init.method} ${path}`
    const f = failures.find(x => x.times > 0 && label.includes(x.match))
    if (f) {
      f.times--
      if (f.afterApply) apply(init.method, path, body)
      if (f.network) throw new Error('socket hang up')
      return json(f.status, f.body ?? { error: { code: f.status, message: 'Backend Error', status: 'UNAVAILABLE' } }, f.headers)
    }
    return apply(init.method, path, body)
  }

  return {
    fetch,
    forms,
    calls,
    /** `match` is a substring of "<HTTP method> <path>", e.g. "POST /forms?" or ":batchUpdate". */
    fail(match: string, status: number, opts: Partial<Omit<Failure, 'match' | 'status'>> = {}) {
      failures.push({ match, status, times: 1, ...opts })
    },
    /** Simulate a staff edit in the Google UI. */
    editInGoogle(formId: string, item: ApiItem) {
      const form = forms.get(formId)!
      form.items = [...(form.items ?? []), item]
      form.revisionId = nextRev()
    },
    /** Short operation log: "create", "get", "batchUpdate", "setPublishSettings". */
    ops: () =>
      calls.map(c =>
        c.path.startsWith('/forms?') ? 'create' : c.path.endsWith(':batchUpdate') ? 'batchUpdate' : c.path.endsWith(':setPublishSettings') ? 'setPublishSettings' : 'get',
      ),
  }
}
