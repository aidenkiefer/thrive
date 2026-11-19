import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MinistryScheduleSignup } from '@/components/ministries'
import { BackLink } from '@/components/ui'
import { CardImage } from '@/components/events/CardImage'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, safely } from '@/components/content'
import { getMinistryBySlug } from '@/lib/queries/ministries'
import { pageMetadata } from '@/components/seo/metadata'
import type { Ministry } from '@/lib/queries/ministries'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

const loadMinistry = cache((slug: string) =>
  safely<Ministry | null>(`ministries:${slug}`, () => getMinistryBySlug(slug), null))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const ministry = await loadMinistry(slug)
  return ministry
    ? pageMetadata({
        title: ministry.seo_title || ministry.name,
        description: ministry.seo_description || ministry.short_summary,
        path: `/ministries/${slug}`,
        image: ministry.og_image_url ?? ministry.featured_image_url,
      })
    : {}
}

export default async function MinistryPage({ params }: Props) {
  const { slug } = await params
  const ministry = await loadMinistry(slug)
  if (!ministry) notFound()

  return (
    <>
      <PageHero eyebrow="Ministry" title={ministry.name} />
      <Band tone="white" prose={false}>
        <BackLink href="/about" className="mb-8 min-h-11">About Thrive</BackLink>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:items-start">
          <div className="min-w-0">
            {ministry.featured_image_url && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-brand-100 ring-1 ring-black/5">
                <CardImage src={ministry.featured_image_url} sizes="(min-width: 1024px) 60vw, 100vw" />
              </div>
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

          <aside className="h-fit rounded-2xl bg-neutral-100 p-6 ring-1 ring-black/5">
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
              <div className="mt-4">
                <LinkButton href={`mailto:${ministry.contact_email}`} variant="secondary">
                  Contact this ministry
                </LinkButton>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-600">
                Contact details are coming soon.
              </p>
            )}
            <MinistryScheduleSignup
              name={ministry.name}
              schedule_description={ministry.schedule_description}
              churchsuite_form_url={ministry.churchsuite_form_url}
            />
          </aside>
        </div>
      </Band>
    </>
  )
}
