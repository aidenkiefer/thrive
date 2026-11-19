import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BackLink } from '@/components/ui'
import { getOutreachBySlug } from '@/lib/queries/outreach'
import type { Outreach } from '@/lib/queries/outreach'
import { isApprovedFormUrl } from '@/lib/form-urls'
import { CardImage } from '@/components/events/CardImage'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, safely } from '@/components/content'
import { pageMetadata } from '@/components/seo/metadata'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

const loadOutreach = cache((slug: string) => safely<Outreach | null>(`outreach:${slug}`, () => getOutreachBySlug(slug), null))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await loadOutreach(slug)
  return item
    ? pageMetadata({
        title: item.seo_title || item.name,
        description: item.seo_description || item.short_summary,
        path: `/outreach/${slug}`,
        image: item.og_image_url ?? item.featured_image_url,
      })
    : {}
}

export default async function OutreachDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await loadOutreach(slug)
  if (!item) notFound()
  // Only ChurchSuite / Google Forms links are treated as signup forms.
  const signup = [item.volunteer_signup_url, item.churchsuite_form_url].find(isApprovedFormUrl) ?? null
  const fmt = (d: string) => {
    const parsed = new Date(`${d.slice(0, 10)}T12:00:00-06:00`)
    return Number.isNaN(parsed.getTime())
      ? d
      : parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' })
  }
  const dates = [item.start_date, item.end_date].filter((d): d is string => Boolean(d)).map(fmt).join(' – ')
  const hasAside = Boolean(dates || signup || item.contact_email)
  return (
    <>
      <PageHero eyebrow="Outreach" title={item.name} />
      <Band tone="white" prose={false}>
        <BackLink href="/outreach" className="mb-8 min-h-11">All outreach</BackLink>
        <div className={hasAside ? 'grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:items-start' : ''}>
          <div className="min-w-0">
            {item.featured_image_url && (
              <div className="relative mb-8 aspect-[3/2] max-w-3xl overflow-hidden rounded-2xl bg-brand-100 ring-1 ring-black/5">
                <CardImage src={item.featured_image_url} sizes="(min-width: 1024px) 60vw, 100vw" />
              </div>
            )}
            {item.description ? (
              <div className="max-w-prose">
                <h2 className="font-display text-2xl font-semibold text-neutral-950">About this initiative</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">{item.description}</p>
              </div>
            ) : (
              <p className="max-w-prose leading-relaxed text-neutral-600">More details about this initiative are coming soon.</p>
            )}
          </div>

          {hasAside && (
            <aside className="rounded-2xl bg-neutral-100 p-6 ring-1 ring-black/5 lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-semibold text-neutral-950">Details</h2>
              {dates && <p className="mt-4 text-sm text-neutral-700">{dates}</p>}
              {(signup || item.contact_email) && (
                <div className="mt-6 flex flex-col gap-3">
                  {signup && <LinkButton href={signup}>Get involved</LinkButton>}
                  {item.contact_email && <LinkButton href={`mailto:${item.contact_email}`} variant={signup ? 'secondary' : 'primary'}>Contact us about this initiative</LinkButton>}
                </div>
              )}
            </aside>
          )}
        </div>
      </Band>
    </>
  )
}
