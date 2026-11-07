import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BackLink, Container, PageHeader, Section } from '@/components/ui'
import { getOutreachBySlug } from '@/lib/queries/outreach'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getOutreachBySlug(slug)
  return item ? { title: item.seo_title || item.name, description: item.seo_description || item.short_summary || undefined } : {}
}

export default async function OutreachDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getOutreachBySlug(slug)
  if (!item) notFound()
  const signup = item.volunteer_signup_url || item.churchsuite_form_url
  return <Section background="light"><Container>
    <BackLink href="/outreach">All outreach</BackLink>
    <PageHeader title={item.name} eyebrow="Outreach" className="mt-5" />
    {item.featured_image_url && <img src={item.featured_image_url} alt="" className="mt-6 max-h-96 w-full rounded-lg object-cover" />}
    {item.description && <p className="mt-6 max-w-prose whitespace-pre-line text-neutral-700">{item.description}</p>}
    {(item.start_date || item.end_date) && <p className="mt-4 text-sm text-neutral-600">{[item.start_date, item.end_date].filter(Boolean).join(' – ')}</p>}
    {signup && <a href={signup} className="mt-8 inline-block rounded bg-brand-800 px-5 py-3 text-white">Get involved</a>}
    {item.contact_email && <p className="mt-4 text-sm"><a href={`mailto:${item.contact_email}`} className="underline">Contact us about this initiative</a></p>}
  </Container></Section>
}
