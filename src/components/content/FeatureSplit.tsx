import { Photo } from './Photo'
import type { PhotoKey } from './photos'

interface FeatureSplitProps {
  /** Single photo. Ignored when `photos` has entries. */
  photo?: PhotoKey
  /** Two or more photos, shown together in the media column. */
  photos?: PhotoKey[]
  /** Optional caption under each photo, in the same order as `photos`. */
  captions?: string[]
  /** Optional object-position utility per photo, in the same order as `photos`. */
  positions?: string[]
  children: React.ReactNode
  /** Put the photo on the right on large screens. */
  reverse?: boolean
  aspect?: string
  position?: string
  className?: string
}

/** Photo beside copy. Stacks on small screens (photo first). */
export function FeatureSplit({
  photo,
  photos,
  captions,
  positions,
  children,
  reverse = false,
  aspect = 'aspect-[4/5]',
  position,
  className = '',
}: FeatureSplitProps) {
  const frames = photos && photos.length > 0 ? photos : photo ? [photo] : []
  const paired = frames.length > 1

  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${className}`}>
      <div className={`${paired ? 'grid grid-cols-2 gap-3 sm:gap-4' : ''} reveal ${reverse ? 'lg:order-2' : ''}`}>
        {frames.map((name, index) => (
          <Photo
            key={name}
            name={name}
            aspect={aspect}
            position={positions?.[index] ?? position}
            caption={captions?.[index]}
            sizes={paired ? '(min-width: 1024px) 280px, 46vw' : undefined}
          />
        ))}
      </div>
      <div className={`prose-content reveal reveal-late ${reverse ? 'lg:order-1' : ''}`}>{children}</div>
    </div>
  )
}
