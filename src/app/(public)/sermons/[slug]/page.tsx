import { getSermonBySlug } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { SermonPlayer } from '@/components/sermons/SermonPlayer'
import { SermonMeta } from '@/components/sermons/SermonMeta'
import { Section, Container, Heading } from '@/components/ui'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sermon = await getSermonBySlug(slug)
  if (!sermon) return {}
  return {
    title: sermon.seo_title ?? sermon.title,
    description: sermon.seo_description ?? sermon.description ?? undefined,
  }
}

export default async function SermonDetailPage({ params }: Props) {
  const { slug } = await params
  const sermon = await getSermonBySlug(slug)
  if (!sermon) notFound()

  return (
    <Section background="white">
      <Container>
        <div className="mb-4">
          <Link href="/sermons" className="text-sm text-brand-600 hover:text-brand-800 transition-colors">
            ← Back to sermons
          </Link>
        </div>

        <Heading level="h1" className="mb-4">{sermon.title}</Heading>

        <div className="mb-6">
          <SermonMeta
            speaker={sermon.speaker}
            preachedAt={sermon.preached_at}
            series={sermon.series}
            scriptureReferences={sermon.scripture_references}
            topics={sermon.topics}
          />
        </div>

        <div className="mb-8 max-w-3xl">
          <SermonPlayer youtubeUrl={sermon.youtube_url} title={sermon.title} />
        </div>

        {sermon.description && (
          <div className="max-w-prose">
            <h2 className="font-display text-xl font-semibold mb-3">About this message</h2>
            <p className="text-neutral-600 leading-relaxed">{sermon.description}</p>
          </div>
        )}
      </Container>
    </Section>
  )
}
