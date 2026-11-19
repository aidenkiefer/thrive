import { SITE } from '@/components/content/site-info'

interface SermonPlayerProps {
  youtubeUrl: string | null
  title: string
}

export function SermonPlayer({ youtubeUrl, title }: SermonPlayerProps) {
  if (!youtubeUrl) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-brand-100 p-6 text-center">
        <p className="text-sm text-neutral-600">Video not available</p>
        <a
          href={SITE.social.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-medium text-brand-800 underline underline-offset-4 hover:text-brand-600"
        >
          Visit our YouTube channel
        </a>
      </div>
    )
  }

  // Normalize all YouTube URL forms to a canonical embed URL
  let embedUrl: string
  if (/youtu\.be\//.test(youtubeUrl)) {
    embedUrl = youtubeUrl.replace(/.*youtu\.be\/([^?]+).*/, 'https://www.youtube.com/embed/$1')
  } else if (/[?&]v=/.test(youtubeUrl)) {
    embedUrl = youtubeUrl.replace(/.*[?&]v=([^&]+).*/, 'https://www.youtube.com/embed/$1')
  } else {
    // Already an embed URL — guard against double embed path
    embedUrl = youtubeUrl.replace(/\/embed\/embed\//, '/embed/')
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-neutral-950 shadow-sm">
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
