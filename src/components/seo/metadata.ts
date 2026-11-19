import type { Metadata } from 'next'
import { SITE } from '../content/site-info'
import { SITE_URL } from './church'

interface PageMetadataInput {
  /** Page title. `layout.tsx`'s template appends " | Thrive Vineyard". */
  title: string
  /** Falls back to the site tagline when a page has no description. */
  description?: string | null
  /** Site-relative path, e.g. `/sermons/[slug]`. Used for the canonical and `og:url`. */
  path: string
  /**
   * Absolute or site-relative image URL. Callers pass the record's stored image
   * (`og_image_url`, then `thumbnail_url` / `featured_image_url` / a YouTube thumbnail
   * already on the record) and fall back to the generated `/og` route themselves.
   */
  image?: string | null
}

/** Resolves a path or an already-absolute URL against `SITE_URL`. */
function absoluteUrl(value: string): string {
  return new URL(value, SITE_URL).toString()
}

/** Only `https:` image URLs are used; anything else (e.g. `javascript:`) falls through to `/og`. */
function safeImageUrl(value: string): string | null {
  try {
    const url = new URL(value, SITE_URL)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/**
 * Shared Open Graph / Twitter metadata for public routes (#43). No invented copy: callers
 * supply the existing title/description; a missing image falls back to `/og`, never a made-up URL.
 */
export function pageMetadata({ title, description, path, image }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const resolvedDescription = description ?? SITE.tagline
  const resolvedImage =
    (image && safeImageUrl(image)) || absoluteUrl(`/og?title=${encodeURIComponent(title)}`)

  return {
    title,
    description: resolvedDescription,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: resolvedDescription,
      url,
      siteName: SITE.shortName,
      type: 'website',
      images: [resolvedImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  }
}
