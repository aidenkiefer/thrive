import { Photo } from './Photo'
import type { PhotoKey } from './photos'

interface FeatureSplitProps {
  photo: PhotoKey
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
  children,
  reverse = false,
  aspect = 'aspect-[4/5]',
  position,
  className = '',
}: FeatureSplitProps) {
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${className}`}>
      <div className={reverse ? 'lg:order-2' : ''}>
        <Photo name={photo} aspect={aspect} position={position} />
      </div>
      <div className={`prose-content ${reverse ? 'lg:order-1' : ''}`}>{children}</div>
    </div>
  )
}
