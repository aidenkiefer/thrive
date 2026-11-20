/**
 * Root URL slugs a landing page can never use, because a site route or system
 * path already answers there. The admin landing-page form and the public
 * `[slug]` page share this list so they cannot drift (#40).
 * reserved-slugs.test.ts fails when a top-level route folder is missing here.
 */
export const RESERVED_SLUGS: readonly string[] = [
  'about', 'admin', 'api', 'events', 'feedback', 'get-connected', 'give', 'groups',
  'kids-youth', 'ministries', 'og', 'outreach', 'plan-a-visit', 'sermons',
  'thrive-flames',
]

const reserved = new Set(RESERVED_SLUGS)

/** True when `slug` (compared trimmed and lowercased) belongs to the site. */
export function isReservedSlug(slug: string): boolean {
  return reserved.has(slug.trim().toLowerCase())
}
