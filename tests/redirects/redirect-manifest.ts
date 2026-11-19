export type RedirectDisposition =
  | { disposition: 'redirect'; source: string; destination: string; permanent: boolean }
  | { disposition: 'same-path' }
  | { disposition: 'pending-owner'; reason: string }
  | { disposition: 'do-not-migrate'; reason: string }

export type ManifestEntry = { liveUrls: readonly string[] } & RedirectDisposition

const pendingCampaign = 'Search Console and active Ads audit; owner destinations: https://github.com/aidenkiefer/thrive/issues/55'
const pendingActivation = 'Owner destination decided; activation remains gated by #63: https://github.com/aidenkiefer/thrive/issues/63'

// Exactly one entry per migration-map table row. Keep multi-URL rows together.
// This inventory records current behavior; it does not activate redirects.
export const redirectManifest: readonly ManifestEntry[] = [
  { liveUrls: ['/im-new/'], disposition: 'redirect', source: '/im-new', destination: '/plan-a-visit', permanent: true },
  { liveUrls: ['/teaching/'], disposition: 'redirect', source: '/teaching', destination: '/sermons', permanent: true },
  { liveUrls: ['/sermons/'], disposition: 'same-path' },
  { liveUrls: ['/sermons/[slug]/'], disposition: 'same-path' },
  { liveUrls: ['/events/'], disposition: 'same-path' },
  { liveUrls: ['/upcoming-events/[slug]/'], disposition: 'redirect', source: '/upcoming-events/:slug', destination: '/events/:slug', permanent: true },
  { liveUrls: ['/groups/'], disposition: 'same-path' },
  { liveUrls: ['/kids/'], disposition: 'redirect', source: '/kids', destination: '/kids-youth', permanent: true },
  { liveUrls: ['/youth-alpha/'], disposition: 'pending-owner', reason: 'Published ministry, current dates and approved form required: https://github.com/aidenkiefer/thrive/issues/55' },
  { liveUrls: ['/about/'], disposition: 'same-path' },
  { liveUrls: ['/give/'], disposition: 'same-path' },
  { liveUrls: ['/get-connected/'], disposition: 'same-path' },
  { liveUrls: ['/prayer/'], disposition: 'pending-owner', reason: pendingActivation },
  { liveUrls: ['/expresso/'], disposition: 'pending-owner', reason: pendingActivation },
  { liveUrls: ['/volunteering/'], disposition: 'pending-owner', reason: pendingActivation },
  { liveUrls: ['/series/[slug]/'], disposition: 'redirect', source: '/series/:slug', destination: '/sermons/series/:slug', permanent: true },
  { liveUrls: ['/speaker/[slug]/'], disposition: 'pending-owner', reason: 'Speaker taxonomy disposition needs owner audit: https://github.com/aidenkiefer/thrive/issues/55' },
  { liveUrls: ['/topics/[slug]/'], disposition: 'redirect', source: '/topics/:slug', destination: '/sermons', permanent: false },
  { liveUrls: ['/book/[slug]/'], disposition: 'redirect', source: '/book/:slug', destination: '/sermons', permanent: false },
  { liveUrls: ['/service-type/[slug]/'], disposition: 'redirect', source: '/service-type/:slug', destination: '/sermons', permanent: false },
  { liveUrls: ['/joydrop/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/pantry/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/plug/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/la-vina/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/prayer-walk/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/greenthumbs/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/sokm/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/feel-the-power/', '/fuelthefire/', '/fasting/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['/easter/', '/christmas-guide/'], disposition: 'pending-owner', reason: pendingCampaign },
  { liveUrls: ['*.wpenginepowered.com/*'], disposition: 'do-not-migrate', reason: 'Stale staging hostname' },
  { liveUrls: ['*.myftpupload.com/*'], disposition: 'do-not-migrate', reason: 'Stale staging hostname' },
  { liveUrls: ['/news/'], disposition: 'do-not-migrate', reason: 'Empty WordPress placeholder' },
  { liveUrls: ['/wp-admin/*', '/wp-json/*'], disposition: 'do-not-migrate', reason: 'WordPress infrastructure' },
  { liveUrls: ['/communications/'], disposition: 'do-not-migrate', reason: 'Internal staff form' },
]
