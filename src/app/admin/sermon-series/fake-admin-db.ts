/**
 * Test-only stand-in for the Supabase admin client used by the series and
 * speaker action tests. Records each query (table, operation, filters, row) and
 * answers it from a handler, so tests never reach a real database.
 */

export interface FakeQuery {
  table: string
  op: 'select' | 'insert' | 'update' | 'delete'
  columns?: string
  options?: unknown
  filters: string[]
  row?: Record<string, unknown>
}

export interface FakeResult {
  data?: unknown
  error?: { message: string; code?: string } | null
  count?: number | null
}

export function fakeAdminDb(respond: (query: FakeQuery) => FakeResult = () => ({})) {
  const queries: FakeQuery[] = []
  const rpcs: Array<Record<string, unknown>> = []
  const from = (table: string) => {
    const query: FakeQuery = { table, op: 'select', filters: [] }
    const chain = {
      select(columns: string, options?: unknown) {
        if (query.op === 'select') { query.columns = columns; query.options = options }
        return chain
      },
      insert(row: Record<string, unknown>) { query.op = 'insert'; query.row = row; return chain },
      update(row: Record<string, unknown>) { query.op = 'update'; query.row = row; return chain },
      delete() { query.op = 'delete'; return chain },
      eq(column: string, value: unknown) { query.filters.push(`${column}=${value}`); return chain },
      not(column: string, operator: string, value: unknown) { query.filters.push(`${column} not ${operator} ${value}`); return chain },
      single() { return chain },
      maybeSingle() { return chain },
      then<T>(resolve: (result: Required<FakeResult>) => T, reject?: (error: unknown) => T) {
        queries.push(query)
        return Promise.resolve({ data: null, error: null, count: null, ...respond(query) }).then(resolve, reject)
      },
    }
    return chain
  }
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    rpcs.push({ fn, ...args })
    return { data: args.p_publish ? '2026-11-24T12:00:00.000Z' : null, error: null }
  }
  return { db: { from, rpc }, queries, rpcs }
}

/** Builds a FormData from plain fields. */
export function formOf(fields: Record<string, string>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}
