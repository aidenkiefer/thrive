import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60
const RESERVED = new Set(['plan-a-visit', 'sermons', 'events', 'groups', 'kids-youth', 'outreach', 'about', 'give', 'ministries', 'admin'])
type Props = { params: Promise<{ slug: string }> }

async function getLanding(slug: string) {
  if (RESERVED.has(slug)) return null
  const db = await createClient()
  const { data } = await db.from('landing_pages').select('*').eq('slug', slug).not('published_at', 'is', null).maybeSingle()
  if (!data) return null
  const tables: Record<string, string> = { recurring_event: 'recurring_events', one_time_event: 'one_time_events', group: 'groups', ministry: 'ministries' }
  const table = tables[data.linked_entity_type as string]
  let entity: Record<string, unknown> | null = null
  if (table && data.linked_entity_id) {
    const result = await db.from(table).select('*').eq('id', data.linked_entity_id).not('published_at', 'is', null).maybeSingle()
    entity = result.data
  }
  return { page: data, entity }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const landing = await getLanding(slug)
  if (!landing) return { robots: { index: false, follow: false } }
  return {
    title: landing.page.seo_title || landing.page.hero_heading || landing.page.title,
    description: landing.page.seo_description || landing.page.hero_subheading || undefined,
    alternates: { canonical: `/${slug}` },
    openGraph: landing.page.og_image_url ? { images: [landing.page.og_image_url] } : undefined,
  }
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params
  const landing = await getLanding(slug)
  if (!landing) notFound()
  const { page, entity } = landing
  const heading = page.hero_heading || (entity?.name as string) || page.title
  const body = page.body_content || (entity?.description as string) || ''
  const image = page.hero_image_url || (entity?.featured_image_url as string) || ''
  const ctaUrl = page.cta_url || (entity?.churchsuite_form_url as string) || (entity?.external_url as string) || ''
  return (
    <Section background="light">
      <Container>
        {image && <img src={image} alt="" className="mb-8 max-h-96 w-full rounded-lg object-cover" />}
        <PageHeader title={heading} />
        {page.hero_subheading && <p className="mt-4 max-w-2xl text-lg text-neutral-700">{page.hero_subheading}</p>}
        {body && <p className="mt-6 max-w-prose whitespace-pre-line text-neutral-700">{body}</p>}
        {ctaUrl && page.cta_text && <a href={ctaUrl} className="mt-8 inline-block rounded bg-brand-800 px-5 py-3 text-white">{page.cta_text}</a>}
      </Container>
    </Section>
  )
}
