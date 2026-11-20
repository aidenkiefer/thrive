import { describe, expect, it, vi } from 'vitest'
import { readLimitedText } from './limited-body'

/** A request whose body arrives in chunks and that declares no content-length. */
function streamed(chunks: string[], onPull?: () => void): Request {
  const enc = new TextEncoder()
  let i = 0
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      onPull?.()
      if (i < chunks.length) controller.enqueue(enc.encode(chunks[i++]))
      else controller.close()
    },
  })
  return new Request('http://localhost/x', { method: 'POST', body, duplex: 'half' } as RequestInit)
}

describe('readLimitedText', () => {
  it('returns the body when it fits, counting bytes not characters', async () => {
    expect(await readLimitedText(streamed(['{"a":', '"é"}']), 10)).toBe('{"a":"é"}')
    expect(await readLimitedText(streamed(['{"a":', '"é"}']), 9)).toBeNull()
  })

  it('rejects a declared oversize body without reading it', async () => {
    const req = new Request('http://localhost/x', { method: 'POST', body: 'x'.repeat(10), headers: { 'content-length': '10' } })
    expect(await readLimitedText(req, 9)).toBeNull()
    expect(req.bodyUsed).toBe(false)
  })

  it('stops reading once an undeclared body passes the cap', async () => {
    const pull = vi.fn()
    const chunks = Array.from({ length: 100 }, () => 'x'.repeat(1000))
    expect(await readLimitedText(streamed(chunks, pull), 2500)).toBeNull()
    expect(pull.mock.calls.length).toBeLessThan(10)
  })

  it('returns an empty string for a request without a body', async () => {
    expect(await readLimitedText(new Request('http://localhost/x', { method: 'POST' }), 10)).toBe('')
  })
})
