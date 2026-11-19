import Link from 'next/link'
import Image from 'next/image'
import { PHOTOS, type PhotoKey } from './photos'
import { ArrowRightIcon } from './icons'

export function CardGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}) {
  const cols =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : columns === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-2 lg:grid-cols-3'
  return <div className={`mt-10 grid grid-cols-1 gap-6 ${cols}`}>{children}</div>
}

interface InfoCardProps {
  title: string
  icon?: React.ReactNode
  photo?: PhotoKey
  href?: string
  linkLabel?: string
  children?: React.ReactNode
}

/** Content card: optional photo or icon, title, short copy, optional link. */
export function InfoCard({ title, icon, photo, href, linkLabel = 'Learn more', children }: InfoCardProps) {
  const image = photo ? PHOTOS[photo] : null
  const external = href?.startsWith('http') || href?.startsWith('mailto:') || href?.startsWith('tel:')
  const body = (
    <>
      {image ? (
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}
      <div className="flex h-full flex-col p-6">
        {icon ? (
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-800">
            {icon}
          </span>
        ) : null}
        <h3 className="font-display text-xl font-semibold text-neutral-950">{title}</h3>
        {children ? (
          <div className="mt-2 flex-1 space-y-2 text-sm leading-relaxed text-neutral-600">{children}</div>
        ) : null}
        {href ? (
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-800 group-hover:text-brand-600">
            {linkLabel}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : null}
      </div>
    </>
  )
  const classes =
    'group flex flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md'
  if (!href) return <article className={classes}>{body}</article>
  if (external) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {body}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {body}
    </Link>
  )
}
