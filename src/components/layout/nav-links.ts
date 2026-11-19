/**
 * Single source for the primary site destinations. Imported by the global nav and
 * by the 404 / error pages. Kept free of 'use client' so server components can read
 * the values directly.
 */
export const navLinks = [
  { label: 'Watch & Listen', href: '/sermons' },
  { label: 'Events', href: '/events' },
  { label: 'Groups', href: '/groups' },
  { label: 'Kids & Youth', href: '/kids-youth' },
  { label: 'Outreach', href: '/outreach' },
  { label: 'About', href: '/about' },
  { label: 'Get Connected', href: '/get-connected' },
] as const

export const visitLink = { label: 'Plan a Visit', href: '/plan-a-visit' } as const
export const giveLink = { label: 'Give', href: '/give' } as const

const recoveryHrefs: ReadonlySet<string> = new Set(['/sermons', '/events', '/get-connected'])

/** Destinations offered when a visitor lands on a missing or broken page. */
export const recoveryLinks: readonly { label: string; href: string }[] = [
  visitLink,
  ...navLinks.filter((link) => recoveryHrefs.has(link.href)),
]
