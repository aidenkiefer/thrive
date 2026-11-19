import { SITE } from '../content/site-info'

// Same production base URL as `metadataBase` in src/app/layout.tsx.
export const SITE_URL = 'https://thrivevineyard.com'

/**
 * schema.org Church for the homepage. Every value comes from `SITE` (audited facts);
 * deliberately no logo, image, opening hours or founding date because none are audited.
 */
export function buildChurchJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: SITE.name,
    description: SITE.tagline,
    url: SITE_URL,
    telephone: SITE.phone,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
    },
    sameAs: [SITE.social.youtube, SITE.social.facebook, SITE.social.instagram],
    hasMap: SITE.mapsUrl,
  }
}
