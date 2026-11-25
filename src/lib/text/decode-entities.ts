/**
 * Decode HTML character references left over from the WordPress import
 * (e.g. `Faith &amp; Works`, `God&#039;s`, `&#8217;`) into plain text.
 *
 * - Decodes a fixed set of named entities plus decimal (`&#39;`) and hex
 *   (`&#x27;`) numeric references.
 * - Decodes exactly once: `&amp;amp;` becomes `&amp;`.
 * - Unknown named entities and invalid code points are left untouched.
 * - The result is plain text, never markup. React escapes it on render.
 */

const NAMED_ENTITIES: ReadonlyMap<string, string> = new Map(Object.entries({
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
}))

// One pass over the string; each match is replaced once, so the output is never re-scanned.
const ENTITY_PATTERN = /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z][a-zA-Z0-9]{1,31}));/g

function fromCodePoint(codePoint: number, original: string): string {
  const isValid =
    Number.isInteger(codePoint) &&
    codePoint > 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff)
  return isValid ? String.fromCodePoint(codePoint) : original
}

export function decodeHtmlEntities(value: string): string
export function decodeHtmlEntities(value: string | null): string | null
export function decodeHtmlEntities(value: string | null): string | null {
  if (value === null || !value.includes('&')) return value

  return value.replace(ENTITY_PATTERN, (match, dec?: string, hex?: string, name?: string) => {
    if (dec !== undefined) return fromCodePoint(Number.parseInt(dec, 10), match)
    if (hex !== undefined) return fromCodePoint(Number.parseInt(hex, 16), match)
    return (name !== undefined && NAMED_ENTITIES.get(name)) || match
  })
}
