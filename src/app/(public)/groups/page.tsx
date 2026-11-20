import Link from 'next/link'
import type { Metadata } from 'next'
import { getGroups } from '@/lib/queries/groups'
import type { Group } from '@/lib/queries/groups'
import { Badge } from '@/components/ui'
import { CardImage } from '@/components/events/CardImage'
import { LinkButton } from '@/components/events/LinkButton'
import { Band, PageHero, PendingNote, SITE, safely } from '@/components/content'
import { pageMetadata } from '@/components/seo/metadata'

export const revalidate = 60

export const metadata: Metadata = pageMetadata({
  title: 'Groups',
  description: 'Groups at Thrive Vineyard Church.',
  path: '/groups',
})

export default async function GroupsPage() {
  const groups = await safely<Group[]>('groups:list', () => getGroups(), [])
  return (
    <>
      <PageHero eyebrow="Community" title="Groups" lead="Groups at Thrive Vineyard." />
      <Band tone="light" prose={false}>
        <h2 className="sr-only">All groups</h2>
        {groups.length === 0 ? (
          <PendingNote title="No groups are listed right now" className="max-w-2xl">
            <p>Groups will appear here as they are published. In the meantime, we would love to hear from you.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <LinkButton href="/get-connected">Get connected</LinkButton>
              <LinkButton href={`mailto:${SITE.email}`} variant="secondary">Email us</LinkButton>
            </div>
          </PendingNote>
        ) : (
          <div className="reveal-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 motion-lift hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                {group.featured_image_url && (
                  <div className="relative aspect-[3/2] overflow-hidden bg-brand-100">
                    <CardImage src={group.featured_image_url} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  {group.category && <div><Badge>{group.category}</Badge></div>}
                  <h3 className={`font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800 ${group.category ? 'mt-3' : ''}`}>{group.name}</h3>
                  {group.short_summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{group.short_summary}</p>}
                  {group.meeting_schedule && <p className="mt-3 text-sm font-medium text-brand-800">{group.meeting_schedule}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Band>
    </>
  )
}
