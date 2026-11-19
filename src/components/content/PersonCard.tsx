import Image from 'next/image'
import { PHOTOS, type PhotoKey } from './photos'

interface PersonCardProps {
  name: string
  photo?: PhotoKey
  /** Role or short descriptor. Only pass text that appears in the audit. */
  role?: string
  children?: React.ReactNode
  /** Compact variant for leader and council grids. */
  compact?: boolean
}

export function PersonCard({ name, photo, role, children, compact = false }: PersonCardProps) {
  const image = photo ? PHOTOS[photo] : null
  return (
    <article className="overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5">
      {image ? (
        <div className={`relative w-full ${compact ? 'aspect-square' : 'aspect-[4/3] sm:aspect-square'}`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={compact ? '(min-width: 1024px) 260px, 50vw' : '(min-width: 1024px) 360px, 100vw'}
            className="object-cover object-top"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-square w-full items-center justify-center bg-brand-100 font-display text-5xl text-brand-600"
        >
          {name.charAt(0)}
        </div>
      )}
      <div className={compact ? 'p-4' : 'p-6'}>
        <h3 className={`font-display font-semibold text-neutral-950 ${compact ? 'text-lg' : 'text-2xl'}`}>
          {name}
        </h3>
        {role ? <p className="mt-1 text-sm font-medium text-brand-600">{role}</p> : null}
        {children ? (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">{children}</div>
        ) : null}
      </div>
    </article>
  )
}

export function PeopleGrid({
  children,
  columns = 2,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}) {
  const cols =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'md:grid-cols-2'
  return <div className={`mt-10 grid grid-cols-1 gap-6 ${cols}`}>{children}</div>
}
