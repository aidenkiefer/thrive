import Link from 'next/link'
import { Container } from '@/components/ui'
import { ArrowRightIcon } from '@/components/content/icons'

interface Announcement {
  title: string
  body: string | null
  cta_text: string | null
  cta_url: string | null
}

/**
 * Featured announcement banner. Content comes entirely from the canonical
 * announcement record (no copy here). Rendered by the page only when present.
 */
export function FeaturedAnnouncement({ announcement }: { announcement: Announcement }) {
  const { title, body, cta_text, cta_url } = announcement
  const external = cta_url ? /^(https?:|mailto:|tel:)/.test(cta_url) : false
  const ctaClasses =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

  return (
    <section aria-label="Announcement" className="bg-neutral-0 py-8 md:py-10">
      <Container>
        <div className="flex flex-col gap-5 rounded-2xl border-l-4 border-accent-400 bg-accent-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">{title}</h2>
            {body ? (
              <p className="mt-2 leading-relaxed text-neutral-600">{body}</p>
            ) : null}
          </div>
          {cta_text && cta_url ? (
            external ? (
              <a
                href={cta_url}
                className={ctaClasses}
                {...(cta_url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {cta_text}
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : (
              <Link href={cta_url} className={ctaClasses}>
                {cta_text}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )
          ) : null}
        </div>
      </Container>
    </section>
  )
}
