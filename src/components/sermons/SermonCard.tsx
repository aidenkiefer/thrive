import Link from 'next/link'

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
    <Link href={`/sermons/${sermon.slug}`} className="group block rounded-lg bg-neutral-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {thumbUrl ? (
        <div className="aspect-video bg-brand-100">
          <img src={thumbUrl} alt={sermon.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-brand-100 flex items-center justify-center">
          <span className="text-brand-600 text-sm">No preview</span>
        </div>
      )}
      <div className="p-4">
        {sermon.series && (
          <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-1">{sermon.series.title}</p>
        )}
        <h3 className="font-display text-lg font-semibold text-neutral-950 leading-snug group-hover:text-brand-800 transition-colors line-clamp-2">
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
