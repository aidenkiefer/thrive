import { isApprovedFormUrl } from '@/lib/form-urls'

/**
 * Presentation-side helpers for the branded signup handoff (#149).
 *
 * These reuse the canonical allowlist in `src/lib/form-urls.ts` (owner decision,
 * Contract C1/C3) and add only the wording and fixture distinctions the public
 * panel needs. No new allowlist, no network, no per-visitor Forms API call.
 */

export type FormProvider = 'churchsuite' | 'google'

/** The hosting provider for an approved responder URL, or null if not approved. */
export function formProvider(url: string | null | undefined): FormProvider | null {
  if (!isApprovedFormUrl(url)) return null
  const host = new URL(url).hostname
  if (host === 'churchsuite.com' || host.endsWith('.churchsuite.com')) return 'churchsuite'
  if (host === 'docs.google.com' || host === 'forms.gle') return 'google'
  return null
}

/** Human label for the hosting provider, used in the provider/help line. */
export function providerLabel(provider: FormProvider): string {
  return provider === 'google' ? 'Google Forms' : 'ChurchSuite'
}

/**
 * The public responder URL to hand a visitor to, or null when there is none to
 * show. Rejects anything the allowlist rejects, and additionally refuses Google
 * editor/response links so an owner-only URL is never exposed as a public CTA.
 */
export function resolveResponderUrl(url: string | null | undefined): string | null {
  if (!isApprovedFormUrl(url)) return null
  const parsed = new URL(url)
  if (parsed.hostname === 'docs.google.com') {
    const path = parsed.pathname.toLowerCase()
    // /forms/d/<id>/edit and /forms/d/<id>/responses are owner-only surfaces.
    if (path.includes('/edit') || path.includes('/responses')) return null
  }
  return url
}

/**
 * True for an approved URL that is plainly a development fixture, not a real
 * connected form (an `example.` host or a demo/fixture/placeholder sentinel in
 * the path or query). Lets a preview be built and clearly labelled before the
 * owner configures the real Google account, without inventing a live URL.
 */
export function isDemoFormUrl(url: string | null | undefined): boolean {
  if (!isApprovedFormUrl(url)) return false
  const parsed = new URL(url)
  if (parsed.hostname.split('.')[0] === 'example') return true
  const haystack = `${parsed.pathname}${parsed.search}`.toLowerCase()
  return /(^|[/_-])(demo|example|fixture|placeholder)([/_-]|$)/.test(haystack)
}
