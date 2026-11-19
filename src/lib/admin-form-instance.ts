/**
 * Form instance token: an opaque, non-sensitive random id that names "the form
 * as it was last mounted after a successful save". It rides in the URL as ?fi=…
 * so a later rejected save (?error=…) can reuse it and keep the same React key,
 * which keeps what the editor typed. No submitted content is ever involved.
 */
const TOKEN = /^[A-Za-z0-9-]{8,64}$/

export function newFormInstance(): string {
  return crypto.randomUUID()
}

/** Returns the token only if it is a well-formed, bounded id; anything else is dropped. */
export function parseFormInstance(value: unknown): string | undefined {
  return typeof value === 'string' && TOKEN.test(value) ? value : undefined
}

/**
 * Reads the token from the page URL the form was submitted from (the Referer).
 * The URL is only parsed for ?fi=; it is never used as a redirect target.
 */
export function formInstanceFromReferer(referer: string | null | undefined): string | undefined {
  if (!referer || referer.length > 2048) return undefined
  try {
    return parseFormInstance(new URL(referer).searchParams.get('fi'))
  } catch {
    return undefined
  }
}

/** React key: stable until the next successful save issues a new token. */
export function instanceKey(formKey: string, token: string | undefined): string {
  return token ? `${formKey}-${token}` : formKey
}
