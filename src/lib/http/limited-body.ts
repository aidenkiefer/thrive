/**
 * Reads a request body as UTF-8 text, at most `maxBytes`. Streams the body and
 * stops as soon as the cap is passed, so a missing or false content-length
 * cannot make the server buffer an unbounded body (request.text() and
 * request.json() read everything first). Returns null when the body is too
 * large. A body that fails mid-read rejects; callers treat that as malformed.
 */
export async function readLimitedText(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) return null
  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}
