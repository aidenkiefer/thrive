import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BackLink, Container, PageHeader, Section } from '@/components/ui'
import { getGroupBySlug } from '@/lib/queries/groups'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const group = await getGroupBySlug(slug)
  return group ? { title: group.seo_title || group.name, description: group.seo_description || group.short_summary || undefined } : {}
}

export default async function GroupPage({ params }: Props) {
  const { slug } = await params
  const group = await getGroupBySlug(slug)
  if (!group) notFound()
  return <Section background="light"><Container>
    <BackLink href="/groups">All groups</BackLink>
    <PageHeader title={group.name} eyebrow={group.category || 'Group'} className="mt-5" />
    {group.featured_image_url && <img src={group.featured_image_url} alt="" className="mt-6 max-h-96 w-full rounded-lg object-cover" />}
    {group.description && <p className="mt-6 max-w-prose whitespace-pre-line text-neutral-700">{group.description}</p>}
    <dl className="mt-6 space-y-2 text-sm text-neutral-700">
      {group.meeting_schedule && <div><dt className="inline font-semibold">Schedule: </dt><dd className="inline">{group.meeting_schedule}</dd></div>}
      {group.location && <div><dt className="inline font-semibold">Location: </dt><dd className="inline">{group.location}</dd></div>}
      {group.leader && <div><dt className="inline font-semibold">Leader: </dt><dd className="inline">{group.leader}</dd></div>}
      <div><dt className="inline font-semibold">Status: </dt><dd className="inline">{group.is_open ? 'Open to new participants' : 'Not currently accepting participants'}</dd></div>
    </dl>
    {group.churchsuite_form_url && <a href={group.churchsuite_form_url} className="mt-8 inline-block rounded bg-brand-800 px-5 py-3 text-white">Ask about this group</a>}
    {group.contact_email && <p className="mt-4 text-sm"><a href={`mailto:${group.contact_email}`} className="underline">Contact the group</a></p>}
  </Container></Section>
}
