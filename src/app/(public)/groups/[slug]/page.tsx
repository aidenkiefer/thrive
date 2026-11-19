import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BackLink } from '@/components/ui'
import { getGroupBySlug } from '@/lib/queries/groups'
import type { Group } from '@/lib/queries/groups'
import { isApprovedFormUrl } from '@/lib/form-urls'
import { CardImage } from '@/components/events/CardImage'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, safely } from '@/components/content'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

const loadGroup = cache((slug: string) => safely<Group | null>(`groups:${slug}`, () => getGroupBySlug(slug), null))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const group = await loadGroup(slug)
  return group
    ? {
        title: group.seo_title || group.name,
        description: group.seo_description || group.short_summary || undefined,
        alternates: { canonical: `/groups/${slug}` },
      }
    : {}
}

export default async function GroupPage({ params }: Props) {
  const { slug } = await params
  const group = await loadGroup(slug)
  if (!group) notFound()
  // Only ChurchSuite / Google Forms links are treated as signup forms.
  const formUrl = isApprovedFormUrl(group.churchsuite_form_url) ? group.churchsuite_form_url : null
  return (
    <>
      <PageHero eyebrow={group.category || 'Group'} title={group.name} />
      <Band tone="white" prose={false}>
        <BackLink href="/groups" className="mb-8 min-h-11">All groups</BackLink>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:items-start">
          <div className="min-w-0">
            {group.featured_image_url && (
              <div className="relative mb-8 aspect-[3/2] max-w-3xl overflow-hidden rounded-2xl bg-brand-100 ring-1 ring-black/5">
                <CardImage src={group.featured_image_url} sizes="(min-width: 1024px) 60vw, 100vw" />
              </div>
            )}
            {group.description ? (
              <div className="max-w-prose">
                <h2 className="font-display text-2xl font-semibold text-neutral-950">About this group</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">{group.description}</p>
              </div>
            ) : (
              <p className="max-w-prose leading-relaxed text-neutral-600">More details about this group are coming soon.</p>
            )}
          </div>

          <aside className="rounded-2xl bg-neutral-100 p-6 ring-1 ring-black/5 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold text-neutral-950">Group details</h2>
            <dl className="mt-4 space-y-3 text-sm text-neutral-700">
              {group.meeting_schedule && <div><dt className="font-semibold text-neutral-950">Schedule</dt><dd>{group.meeting_schedule}</dd></div>}
              {group.location && <div><dt className="font-semibold text-neutral-950">Location</dt><dd>{group.location}</dd></div>}
              {group.leader && <div><dt className="font-semibold text-neutral-950">Leader</dt><dd>{group.leader}</dd></div>}
              <div><dt className="font-semibold text-neutral-950">Status</dt><dd>{group.is_open ? 'Open to new participants' : 'Not currently accepting participants'}</dd></div>
            </dl>
            {(formUrl || group.contact_email) && (
              <div className="mt-6 flex flex-col gap-3">
                {formUrl && <LinkButton href={formUrl}>Ask about this group</LinkButton>}
                {group.contact_email && <LinkButton href={`mailto:${group.contact_email}`} variant={formUrl ? 'secondary' : 'primary'}>Contact the group</LinkButton>}
              </div>
            )}
          </aside>
        </div>
      </Band>
    </>
  )
}
