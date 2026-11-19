import Image from 'next/image'
import { PHOTOS, type PhotoKey } from './photos'

interface PhotoProps {
  /** Key from the audited photo catalog in ./photos.ts */
  name: PhotoKey
  /** Tailwind aspect utility, e.g. "aspect-[4/3]". Defaults to the photo's own ratio via object-cover in a 4/3 box. */
  aspect?: string
  sizes?: string
  priority?: boolean
  rounded?: boolean
  /** object-position utility, e.g. "object-top" */
  position?: string
  className?: string
  caption?: string
}

export function Photo({
  name,
  aspect = 'aspect-[4/3]',
  sizes = '(min-width: 1024px) 560px, 100vw',
  priority = false,
  rounded = true,
  position = 'object-center',
  className = '',
  caption,
}: PhotoProps) {
  const photo = PHOTOS[name]
  return (
    <figure className={className}>
      <div
        className={`relative w-full overflow-hidden bg-brand-100 ${aspect} ${
          rounded ? 'rounded-2xl' : ''
        }`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${position}`}
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-xs text-neutral-600">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
