import { ImageResponse } from 'next/og'
import { SITE } from '@/components/content/site-info'

// Default social share image: GET /og and GET /og?title=Sunday%20Message
// Uses the built-in next/og ImageResponse with its bundled font: no remote fonts or images.

const SIZE = { width: 1200, height: 630 }
const MAX_TITLE_LENGTH = 80

// Token values from tailwind.config.ts: brand.900, accent.400, neutral.0.
const NAVY = '#0f2838'
const ACCENT = '#c9828a'
const WHITE = '#ffffff'

const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'

/** Plain text only: strips control characters, collapses whitespace, trims to a safe length. */
function cleanTitle(raw: string | null): string | null {
  if (!raw) return null
  const text = raw
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  const chars = Array.from(text)
  return chars.length > MAX_TITLE_LENGTH
    ? `${chars.slice(0, MAX_TITLE_LENGTH - 1).join('').trimEnd()}…`
    : text
}

export function GET(request: Request) {
  const title = cleanTitle(new URL(request.url).searchParams.get('title'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: NAVY,
          color: WHITE,
          padding: '0 96px',
          borderLeft: `24px solid ${ACCENT}`,
        }}
      >
        {title ? (
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 40 ? 56 : 76,
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 40,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            fontSize: title ? 44 : 104,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {SITE.shortName}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: title ? 32 : 48,
            marginTop: 20,
            color: ACCENT,
          }}
        >
          {SITE.tagline}
        </div>
      </div>
    ),
    { ...SIZE, headers: { 'Cache-Control': CACHE_CONTROL } },
  )
}
