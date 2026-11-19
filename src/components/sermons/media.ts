/**
 * Safe parsing for sermon media URLs stored in the database. Pure functions, no I/O.
 * One YouTube parser serves the detail page and the card thumbnail.
 */

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
])

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

function parseUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null
  try {
    return new URL(raw.trim())
  } catch {
    return null
  }
}

/** Returns the 11-character video id for a YouTube URL on an allowed host, otherwise null. */
export function parseYouTubeId(raw: string | null | undefined): string | null {
  const url = parseUrl(raw)
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) return null
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null

  const segments = url.pathname.split('/').filter(Boolean)
  let candidate: string | undefined
  if (url.hostname.toLowerCase() === 'youtu.be') {
    candidate = segments[0]
  } else if (segments[0] === 'watch') {
    candidate = url.searchParams.get('v') ?? undefined
  } else if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) {
    candidate = segments[1]
  }
  return candidate && VIDEO_ID.test(candidate) ? candidate : null
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/** Returns the normalized URL only when it is a valid https: URL, otherwise null. */
export function safeHttpsUrl(raw: string | null | undefined): string | null {
  const url = parseUrl(raw)
  return url && url.protocol === 'https:' ? url.toString() : null
}

/** "42 min" or "1 hr 5 min"; null when the value is missing or not a positive number. */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return null
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`
}
