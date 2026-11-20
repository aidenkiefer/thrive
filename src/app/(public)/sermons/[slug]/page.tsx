import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSermonBySlug } from '@/lib/queries'
import type { Sermon } from '@/lib/queries/sermons'
import { SermonPlayer } from '@/components/sermons/SermonPlayer'
import { SermonMeta } from '@/components/sermons/SermonMeta'
import { BackLink } from '@/components/ui'
import { Band, PageHero, safely } from '@/components/content'
import { pageMetadata } from '@/components/seo/metadata'
import { parseYouTubeId } from '@/components/sermons/media'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

const loadSermon = cache((slug: string) =>
  safely<Sermon | null>(`sermons:${slug}`, () => getSermonBySlug(slug), null))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sermon = await loadSermon(slug)
  if (!sermon) return {}
  const videoId = parseYouTubeId(sermon.youtube_url)
  const image =
    sermon.og_image_url ??
    sermon.thumbnail_url ??
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)
  return pageMetadata({
    title: sermon.seo_title ?? sermon.title,
    description: sermon.seo_description ?? sermon.description,
    path: `/sermons/${slug}`,
    image,
  })
}

export default async function SermonDetailPage({ params }: Props) {
  const { slug } = await params
  const sermon = await loadSermon(slug)
  if (!sermon) notFound()

  return (
    <>
      <PageHero eyebrow="Message" title={sermon.title} />
      <Band tone="white" prose={false}>
        <BackLink href="/sermons" className="mb-8 min-h-11">All messages</BackLink>

        <div className="max-w-3xl">
          <SermonPlayer
            youtubeUrl={sermon.youtube_url}
            videoUrl={sermon.video_url}
            audioUrl={sermon.audio_url}
            title={sermon.title}
          />
        </div>

        <div className="mt-8 max-w-3xl">
          <SermonMeta
            speaker={sermon.speaker}
            preachedAt={sermon.preached_at}
            series={sermon.series}
            scriptureReferences={sermon.scripture_references}
            topics={sermon.topics}
            durationSeconds={sermon.duration_seconds}
          />
        </div>

        {sermon.description && (
          <div className="mt-10 max-w-prose">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">About this message</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-600">{sermon.description}</p>
          </div>
        )}
      </Band>
    </>
  )
}
