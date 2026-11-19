import { SITE } from '@/components/content/site-info'
import { parseYouTubeId, safeHttpsUrl, youtubeEmbedUrl } from './media'

interface SermonPlayerProps {
  youtubeUrl: string | null
  videoUrl?: string | null
  audioUrl?: string | null
  title: string
}

const linkClass =
  'inline-flex min-h-11 items-center text-sm font-medium text-brand-800 underline underline-offset-4 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

function AudioBlock({ src, title, heading }: { src: string; title: string; heading: string }) {
  return (
    <section aria-label={heading} className="rounded-2xl bg-brand-100 p-5 md:p-6">
      <h2 className="font-display text-xl font-semibold text-neutral-950">{heading}</h2>
      <audio controls preload="none" src={src} aria-label={`Audio: ${title}`} className="mt-3 w-full">
        Your browser does not support audio playback.
      </audio>
      <a href={src} download target="_blank" rel="noopener noreferrer" className={`mt-2 ${linkClass}`}>
        Download the audio
      </a>
    </section>
  )
}

export function SermonPlayer({ youtubeUrl, videoUrl = null, audioUrl = null, title }: SermonPlayerProps) {
  // `youtube_url` first, then a YouTube link stored in `video_url`.
  const videoId = parseYouTubeId(youtubeUrl) ?? parseYouTubeId(videoUrl)
  // A non-YouTube video link is only ever offered as an outbound link, never an iframe.
  const externalVideo = videoId ? null : safeHttpsUrl(videoUrl)
  const audio = safeHttpsUrl(audioUrl)

  if (videoId) {
    return (
      <div className="space-y-6">
        <div className="aspect-video overflow-hidden rounded-2xl bg-neutral-950 shadow-sm">
          <iframe
            src={youtubeEmbedUrl(videoId)}
            title={title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        {audio && <AudioBlock src={audio} title={title} heading="Listen" />}
      </div>
    )
  }

  const channelLink = (
    <a href={SITE.social.youtube} target="_blank" rel="noopener noreferrer" className={linkClass}>
      Visit our YouTube channel
    </a>
  )

  if (audio) {
    return (
      <div className="space-y-2">
        <AudioBlock src={audio} title={title} heading="Listen to this message" />
        <div className="flex flex-wrap gap-x-5">
          {externalVideo && (
            <a href={externalVideo} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Watch the video
            </a>
          )}
          {channelLink}
        </div>
      </div>
    )
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-brand-100 p-6 text-center">
      <p className="text-sm text-neutral-600">Video not available</p>
      {externalVideo && (
        <a href={externalVideo} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Watch the video
        </a>
      )}
      {channelLink}
    </div>
  )
}
