import Link from 'next/link'
import { Button } from '@/components/ui'
import { PageHero } from '@/components/content/PageHero'
import { SITE } from '@/components/content/site-info'

/**
 * Homepage hero.
 * Source: eyebrow/title/lead are the existing homepage hero copy; tagline from
 * src/components/content/site-info.ts (SITE.tagline). Photo: PHOTOS.worship (audited).
 */
export function HeroSection() {
  return (
    <PageHero
      size="large"
      photo="worship"
      eyebrow="Welcome to Thrive Vineyard"
      title={SITE.tagline}
      lead="A Vineyard church in Palatine, IL. Come as you are — explore faith, find community, and grow together."
      actions={
        <>
          <Button href="/plan-a-visit" variant="accent" className="min-h-11 px-6">
            Plan Your Visit
          </Button>
          {/* Secondary-on-dark: Button 'secondary' is dark-on-light, so use a local white outline. */}
          <Link
            href="/sermons"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/70 px-6 py-2.5 text-sm font-medium text-white press hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
          >
            Watch a Message
          </Link>
        </>
      }
    />
  )
}
