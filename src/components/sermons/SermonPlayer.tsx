interface SermonPlayerProps {
  youtubeUrl: string | null
  title: string
}

export function SermonPlayer({ youtubeUrl, title }: SermonPlayerProps) {
  if (!youtubeUrl) {
    return (
      <div className="aspect-video bg-brand-100 rounded-lg flex items-center justify-center">
        <p className="text-neutral-600 text-sm">Video not available</p>
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
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}
