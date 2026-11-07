import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BackLink, Container, PageHeader, Section } from '@/components/ui'
import { getMinistryBySlug } from '@/lib/queries/ministries'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const ministry = await getMinistryBySlug(slug)
  return ministry ? { title: ministry.seo_title || ministry.name, description: ministry.seo_description || ministry.short_summary || undefined } : {}
}

export default async function MinistryPage({ params }: Props) {
  const { slug } = await params
  const ministry = await getMinistryBySlug(slug)
  if (!ministry) notFound()
  return (
    <Section background="light">
      <Container>
        <BackLink href="/about">About Thrive</BackLink>
        <PageHeader
          title={ministry.name}
          eyebrow="Ministry"
          className="mt-5"
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <div>
            {ministry.featured_image_url && (
              <img
                src={ministry.featured_image_url}
                alt=""
                className="mb-8 aspect-[16/9] w-full rounded-lg object-cover"
              />
            )}
            <h2 className="font-display text-2xl font-semibold text-neutral-950">
              About this ministry
            </h2>
            <p className="mt-3 max-w-prose whitespace-pre-line leading-relaxed text-neutral-700">
              {ministry.description ||
                ministry.short_summary ||
                'Details are being prepared.'}
            </p>
          </div>

          <aside className="h-fit rounded-lg bg-neutral-0 p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-neutral-950">
              Get connected
            </h2>
            {ministry.leader ? (
              <p className="mt-4 text-sm text-neutral-700">
                <span className="font-semibold">Leader: </span>
                {ministry.leader}
              </p>
            ) : (
              <p className="mt-4 text-sm text-neutral-600">
                Leadership details are coming soon.
              </p>
            )}
            {ministry.contact_email ? (
              <a
                className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4"
                href={`mailto:${ministry.contact_email}`}
              >
                Contact this ministry
              </a>
            ) : (
              <p className="mt-4 text-sm text-neutral-600">
                Contact details are coming soon.
              </p>
            )}
            {ministry.slug === 'youth-alpha' && (
              <div className="mt-6 border-t border-neutral-200 pt-5">
                <h3 className="font-display text-lg font-semibold text-neutral-950">
                  Schedule &amp; signup
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Schedule and signup details are coming soon.
                </p>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </Section>
  )
}
