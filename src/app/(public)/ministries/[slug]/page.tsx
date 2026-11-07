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
  return <Section background="light"><Container>
    <BackLink href="/about">About Thrive</BackLink>
    <PageHeader title={ministry.name} eyebrow="Ministry" className="mt-5" />
    {ministry.featured_image_url && <img src={ministry.featured_image_url} alt="" className="mt-6 max-h-96 w-full rounded-lg object-cover" />}
    {ministry.description && <p className="mt-6 max-w-prose whitespace-pre-line text-neutral-700">{ministry.description}</p>}
    {ministry.leader && <p className="mt-5 text-sm"><span className="font-semibold">Leader: </span>{ministry.leader}</p>}
    {ministry.contact_email && <p className="mt-3 text-sm"><a className="underline" href={`mailto:${ministry.contact_email}`}>Contact this ministry</a></p>}
  </Container></Section>
}
