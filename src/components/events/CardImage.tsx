import Image from 'next/image'

/**
 * Hosts configured in next.config.ts `images.remotePatterns`. next/image throws
 * for any other host, which would 500 a whole list page, so unknown hosts fall
 * back to a plain <img>. Keep in sync with next.config.ts.
 */
function isOptimizable(src: string): boolean {
  if (src.startsWith('/')) return true
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') return false
    if (url.hostname.endsWith('.supabase.co')) return url.pathname.startsWith('/storage/v1/object/public/')
    if (url.hostname === 'thrivevineyard.com') return url.pathname.startsWith('/wp-content/uploads/')
    if (url.hostname === 'img.youtube.com') return url.pathname.startsWith('/vi/')
    return false
  } catch {
    return false
  }
}

interface CardImageProps {
  src: string
  /** Empty by default: card images sit next to the title and are decorative. */
  alt?: string
  sizes?: string
  className?: string
}

/** Fills its (relative, aspect-ratio) parent. */
export function CardImage({
  src,
  alt = '',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  className = 'object-cover',
}: CardImageProps) {
  if (isOptimizable(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`absolute inset-0 h-full w-full ${className}`} />
}
