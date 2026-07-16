import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui'

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

  // Extract YouTube video ID for thumbnail (handles embed/ and watch?v= forms)
  const ytId = sermon.youtube_url?.match(/embed\/([^?]+)/)?.[1]
    ?? sermon.youtube_url?.match(/[?&]v=([^&]+)/)?.[1]
    ?? null
  const thumbUrl = sermon.thumbnail_url ?? (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  return (
    <Link href={`/sermons/${sermon.slug}`} className="group block overflow-hidden rounded-lg bg-neutral-0 shadow-sm transition-shadow hover:shadow-md">
      {thumbUrl ? (
        <div className="relative aspect-video bg-brand-100">
          <Image
            src={thumbUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-brand-100">
          <span className="text-sm font-medium text-brand-600">Sermon</span>
        </div>
      )}
      <div className="p-5">
        {sermon.series && (
          <Badge>{sermon.series.title}</Badge>
        )}
        <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-snug text-neutral-950 transition-colors group-hover:text-brand-800">
          {sermon.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
          {sermon.speaker && <span>{sermon.speaker.name}</span>}
          {sermon.speaker && date && <span className="text-neutral-400">·</span>}
          {date && <span>{date}</span>}
        </div>
      </div>
    </Link>
  )
}
