import { Container } from '@/components/ui'

/**
 * Route loading state for public pages. Shown only while a dynamic page streams in,
 * so navigation feels immediate instead of frozen. Calm pulse, no layout shift on swap.
 */
export default function PublicLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <section className="bg-brand-900 py-20 md:py-28" aria-hidden="true">
        <Container>
          <div className="skeleton max-w-2xl space-y-5">
            <div className="h-3 w-24 rounded-full bg-white/20" />
            <div className="h-12 w-3/4 rounded-lg bg-white/20 md:h-16" />
            <div className="h-5 w-2/3 rounded-full bg-white/15" />
          </div>
        </Container>
      </section>
      <section className="bg-neutral-100 py-16" aria-hidden="true">
        <Container>
          <div className="skeleton grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5">
                <div className="aspect-[3/2] bg-brand-100" />
                <div className="space-y-3 p-6">
                  <div className="h-5 w-2/3 rounded-full bg-brand-100" />
                  <div className="h-3 w-full rounded-full bg-neutral-100" />
                  <div className="h-3 w-4/5 rounded-full bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}
