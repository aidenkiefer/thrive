import Link from 'next/link'
import { Section, Container, Heading, Button } from '@/components/ui'

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

export function LatestSermonSection({ sermon }: { sermon: Sermon | null }) {
  if (!sermon) return null

  const youtubeEmbedUrl = sermon.youtube_url
    ?.replace('watch?v=', 'embed/')
    .replace('/embed/embed/', '/embed/')

  return (
    <Section background="brand">
      <Container>
        <p className="text-accent-400 text-sm font-medium tracking-wide uppercase mb-2">
          Latest Message
        </p>
        <Heading level="h2" className="text-white mb-1">
          {sermon.title}
        </Heading>
        {sermon.speaker && (
          <p className="text-white/70 mb-6">
            {sermon.speaker.name}
            {sermon.series && (
              <span className="text-white/50"> · {sermon.series.title}</span>
            )}
          </p>
        )}

        {youtubeEmbedUrl ? (
          <div className="aspect-video max-w-3xl rounded-lg overflow-hidden mb-6">
            <iframe
              src={youtubeEmbedUrl}
              title={sermon.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="h-48 max-w-3xl bg-brand-900 rounded-lg mb-6 flex items-center justify-center">
            <span className="text-white/40 text-sm">Video not available</span>
          </div>
        )}

        <Button
          href={`/sermons/${sermon.slug}`}
          variant="secondary"
          className="border-white/40 text-white hover:bg-brand-600"
        >
          Watch Full Message
        </Button>
      </Container>
    </Section>
  )
}
