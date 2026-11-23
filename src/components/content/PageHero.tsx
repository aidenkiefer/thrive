import Image from 'next/image'
import { Container } from '@/components/ui'
import { PHOTOS, type PhotoKey } from './photos'

interface PageHeroProps {
  title: string
  eyebrow?: string
  lead?: string
  /** Photo from ./photos.ts shown behind a navy overlay. Omit for a solid navy hero. */
  photo?: PhotoKey
  /** object-position utility for the background photo */
  photoPosition?: string
  actions?: React.ReactNode
  /** Tall hero for the homepage. */
  size?: 'default' | 'large'
}

export function PageHero({
  title,
  eyebrow,
  lead,
  photo,
  photoPosition = 'object-center',
  actions,
  size = 'default',
}: PageHeroProps) {
  const image = photo ? PHOTOS[photo] : null
  const padding = size === 'large' ? 'py-28 md:py-40' : 'py-20 md:py-28'

  return (
    <section className="relative isolate overflow-hidden bg-brand-900 text-white">
      {image ? (
        <>
          <div aria-hidden="true" className="hero-bg hero-bg-settle absolute inset-0 -z-20">
            <Image
              src={image.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className={`hero-bg-parallax object-cover ${photoPosition}`}
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/95 via-brand-900/75 to-brand-900/30"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700"
          />
          <div aria-hidden="true" className="absolute -right-24 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full bg-accent-400/15 blur-3xl" />
          <Image
            src="/images/brand/thrive-mark.webp"
            alt=""
            width={512}
            height={512}
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 top-1/2 -z-10 hidden h-[26rem] w-[26rem] -translate-y-1/2 opacity-[0.06] md:block"
          />
        </>
      )}
      <Container>
        <div className={`hero-enter max-w-2xl ${padding}`}>
          {eyebrow ? (
            <p className="eyebrow mb-5 text-accent-300">{eyebrow}</p>
          ) : null}
          <h1
            className={`font-display font-semibold leading-[1.1] text-white ${
              size === 'large' ? 'text-5xl md:text-7xl' : 'text-4xl md:text-6xl'
            }`}
          >
            {title}
          </h1>
          {lead ? (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
              {lead}
            </p>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </Container>
    </section>
  )
}
