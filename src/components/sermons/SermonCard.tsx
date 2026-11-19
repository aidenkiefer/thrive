import Link from 'next/link'
import { Badge } from '@/components/ui'
import { PlayIcon } from '@/components/content/icons'
import { CardImage } from '@/components/events/CardImage'

interface SermonCardProps {
  sermon: {
    slug: string
    title: string
    preached_at: string | null
    thumbnail_url: string | null
    youtube_url: string | null
    speaker: { name: string } | null
    series: { title: string } | null
  }
}

export function SermonCard({ sermon }: SermonCardProps) {
  const date = sermon.preached_at
    ? new Date(sermon.preached_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  // Extract YouTube video ID for thumbnail (handles embed/, watch?v= and youtu.be forms)
  const ytId = sermon.youtube_url?.match(/embed\/([^?]+)/)?.[1]
    ?? sermon.youtube_url?.match(/[?&]v=([^&]+)/)?.[1]
    ?? sermon.youtube_url?.match(/youtu\.be\/([^?&]+)/)?.[1]
    ?? null
  const thumbUrl = sermon.thumbnail_url ?? (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  return (
    <Link
      href={`/sermons/${sermon.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 motion-lift hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <div className="relative aspect-video overflow-hidden bg-brand-100">
        {thumbUrl ? (
          <CardImage
            src={thumbUrl}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-accent-50 text-brand-600">
            <PlayIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        {sermon.series && (
          <div><Badge>{sermon.series.title}</Badge></div>
        )}
        <h3 className={`line-clamp-2 font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800 ${sermon.series ? 'mt-3' : ''}`}>
          {sermon.title}
        </h3>
        {(sermon.speaker || date) && (
          <p className="mt-2 text-sm text-neutral-600">
            {sermon.speaker?.name}
            {sermon.speaker && date && <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>}
            {date}
          </p>
        )}
      </div>
    </Link>
  )
}
