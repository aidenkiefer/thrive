import { revalidatePath } from 'next/cache'

/**
 * Which cached pages show each admin-edited entity (#44), so a publish, edit or
 * unpublish refreshes all of them at once instead of waiting for the 60s ISR
 * fallback. Publish, unpublish and edit refresh the same set: any of them can
 * change what a list, the home page or the sitemap shows. A slug change also
 * refreshes the old detail path. revalidate.test.ts checks the sitemap entries
 * against the tables src/app/sitemap.ts reads.
 */
export type RevalidateEntity =
  | 'announcement' | 'one_time_event' | 'recurring_event' | 'group' | 'outreach'
  | 'ministry' | 'landing_page' | 'sermon' | 'staff'

/** A concrete path, or a dynamic route pattern refreshed for every slug. */
export type RevalidateTarget = string | { pattern: string; type: 'page' }

interface EntityPages {
  admin: string[]
  list?: string[]
  detail?: (slug: string) => string
  /** Dynamic routes that may show the entity under another record's slug. */
  patterns?: string[]
  home?: boolean
  sitemap?: boolean
}

const PAGES: Record<RevalidateEntity, EntityPages> = {
  announcement: { admin: ['/admin/announcements'], home: true },
  one_time_event: { admin: ['/admin/events'], list: ['/events'], detail: s => `/events/${s}`, home: true, sitemap: true },
  recurring_event: { admin: ['/admin/recurring-events', '/admin/events'], list: ['/events'], detail: s => `/events/${s}`, home: true, sitemap: true },
  group: { admin: ['/admin/groups'], list: ['/groups'], detail: s => `/groups/${s}`, home: true },
  outreach: { admin: ['/admin/outreach'], list: ['/outreach'], detail: s => `/outreach/${s}`, home: true },
  ministry: { admin: ['/admin/ministries'], detail: s => `/ministries/${s}`, sitemap: true },
  landing_page: { admin: ['/admin/landing-pages'], detail: s => `/${s}`, sitemap: true },
  sermon: {
    admin: ['/admin/sermons'], list: ['/sermons', '/sermons/series'], detail: s => `/sermons/${s}`,
    patterns: ['/sermons/series/[slug]'], home: true, sitemap: true,
  },
  staff: { admin: ['/admin/staff'], list: ['/about/team', '/about'] },
}

/** Every page to refresh after a change to one record. Pure, for tests. */
export function entityPaths(entity: RevalidateEntity, slug?: string | null, previousSlug?: string | null): RevalidateTarget[] {
  const p = PAGES[entity]
  const details = p.detail ? [slug, previousSlug].filter((s): s is string => Boolean(s)).map(p.detail) : []
  const paths = [...p.admin, ...(p.list ?? []), ...details, ...(p.home ? ['/'] : []), ...(p.sitemap ? ['/sitemap.xml'] : [])]
  return [...new Set(paths), ...(p.patterns ?? []).map(pattern => ({ pattern, type: 'page' as const }))]
}

/** Call from an admin server action after a save, also when the save threw. */
export function revalidateEntity(entity: RevalidateEntity, slug?: string | null, previousSlug?: string | null): void {
  for (const target of entityPaths(entity, slug, previousSlug)) {
    if (typeof target === 'string') revalidatePath(target)
    else revalidatePath(target.pattern, target.type)
  }
}

/** Entities whose published rows are listed in /sitemap.xml, keyed by table (checked by the test). */
export const SITEMAP_TABLES: Record<string, RevalidateEntity | null> = {
  sermons: 'sermon',
  sermon_series: null, // no admin editor yet (#42); add one here when it exists
  one_time_events: 'one_time_event',
  recurring_events: 'recurring_event',
  landing_pages: 'landing_page',
  ministries: 'ministry',
}
