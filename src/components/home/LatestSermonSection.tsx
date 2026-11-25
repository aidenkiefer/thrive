import Link from 'next/link'
import { Button } from '@/components/ui'
import { Band } from '@/components/content/Band'
import { SectionIntro } from '@/components/content/SectionIntro'
import { ArrowRightIcon, PlayIcon } from '@/components/content/icons'
import { SITE } from '@/components/content/site-info'
import { parseYouTubeId, youtubeEmbedUrl } from '@/components/sermons/media'

interface Speaker {
  name: string
  slug: string
}

interface Series {
  title: string
  slug: string
}

interface Sermon {
  slug: string
  title: string
  preached_at: string | null
  youtube_url: string | null
  speaker: Speaker | null
  series: Series | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

/**
 * Latest message. Sermon data is the canonical record from getLatestSermon().
 * Empty state links to /sermons and the audited YouTube channel (SITE.social.youtube).
 */
export function LatestSermonSection({ sermon }: { sermon: Sermon | null }) {
  if (!sermon) {
    return (
      <Band tone="navy" prose={false}>
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <SectionIntro
            tone="inverse"
            eyebrow="Latest message"
            title="Watch a message"
            lead="Visit our messages page, or watch on our YouTube channel."
          />
          <div className="flex flex-wrap gap-3">
            <Button href="/sermons" variant="accent" className="min-h-11 px-6">
              Browse messages
            </Button>
            <a
              href={SITE.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 px-6 py-2.5 text-sm font-semibold text-white press hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      </Band>
    )
  }

  const youtubeVideoId = parseYouTubeId(sermon.youtube_url)

  const meta = [
    sermon.speaker?.name,
    sermon.series?.title,
    sermon.preached_at ? formatDate(sermon.preached_at) : null,
  ].filter(Boolean)

  return (
    <Band tone="navy" prose={false}>
      <div className="reveal grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
        <div className="lg:col-span-2">
          <p className="eyebrow mb-4 text-accent-300">Latest message</p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-white md:text-4xl">{sermon.title}</h2>
          {meta.length > 0 ? <p className="mt-3 text-white/70">{meta.join(' · ')}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Button href={`/sermons/${sermon.slug}`} variant="accent" className="min-h-11 px-6">
              Watch full message
            </Button>
            <Link
              href="/sermons"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800"
            >
              All messages
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-3">
          {youtubeVideoId ? (
            <div className="aspect-video overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10">
              <iframe
                src={youtubeEmbedUrl(youtubeVideoId)}
                title={sermon.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-brand-900 text-white/50 ring-1 ring-white/10">
              <PlayIcon className="h-10 w-10" />
              <span className="text-sm">Video not available</span>
            </div>
          )}
        </div>
      </div>
    </Band>
  )
}
