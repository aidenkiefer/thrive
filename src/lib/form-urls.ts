/**
 * Approved signup-form destinations (owner decision, 2026-11-07): ChurchSuite
 * forms, or a Google Form where ChurchSuite doesn't provide one.
 *
 * Pure (no Next or Supabase imports), so admin validation and public pages use
 * the same rule: admin rejects other links at publish, and pages embed only
 * links that pass. Contract C3 in docs/agents/assignments/2026-11-07-release-candidate-2.md.
 */

/** True only for an HTTPS ChurchSuite or Google Forms URL. */
export function isApprovedFormUrl(url: string | null | undefined): url is string {
  if (typeof url !== 'string' || !url || url.trim() !== url) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return false
  const host = parsed.hostname // already lowercased by URL
  if (host === 'churchsuite.com' || host.endsWith('.churchsuite.com')) return true
  if (host === 'docs.google.com') return parsed.pathname.startsWith('/forms/')
  if (host === 'forms.gle') return parsed.pathname.length > 1
  return false
}
