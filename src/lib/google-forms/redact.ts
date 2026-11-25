/**
 * Output redaction. Every line the CLI prints, and every error message it builds from a Google
 * response, passes through `redact`. Defense in depth: tokens are never formatted into output in
 * the first place.
 */

const PATTERNS: [RegExp, string][] = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]'],
  [/\bya29\.[A-Za-z0-9._-]+/g, '[redacted-access-token]'],
  [/\b1\/\/[A-Za-z0-9._-]{10,}/g, '[redacted-refresh-token]'],
  [/"(access_token|refresh_token|id_token|client_secret|private_key)"\s*:\s*"[^"]*"/gi, '"$1":"[redacted]"'],
  [/\b(access_token|refresh_token|client_secret)=[^&\s]+/gi, '$1=[redacted]'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[redacted-private-key]'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]'],
  // Editor links grant nothing without permission, but they are not public; keep them out of logs.
  [/https:\/\/docs\.google\.com\/forms\/d\/(?!e\/)[A-Za-z0-9_-]+\/edit[^\s"]*/g, '[redacted-editor-url]'],
]

export function redact(text: string): string {
  return PATTERNS.reduce((t, [re, sub]) => t.replace(re, sub), text)
}

/** Form IDs are management identifiers; print a short prefix only. The full ID lives in the manifest. */
export function shortId(id: string | null | undefined): string {
  if (!id) return '-'
  return id.length > 8 ? `${id.slice(0, 6)}…` : id
}
