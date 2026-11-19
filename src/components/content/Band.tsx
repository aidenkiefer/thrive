import { Container } from '@/components/ui'

type BandTone = 'white' | 'light' | 'blush' | 'navy'

interface BandProps {
  children: React.ReactNode
  tone?: BandTone
  id?: string
  /** Wrap children in the prose styles used for MDX copy. Default true. */
  prose?: boolean
  /** Narrow single-column layout for long reading. */
  narrow?: boolean
  className?: string
}

const tones: Record<BandTone, string> = {
  white: 'bg-neutral-0',
  light: 'bg-neutral-100',
  blush: 'bg-accent-50',
  navy: 'bg-brand-800 text-white',
}

/**
 * Full-width page band. Used directly in TSX pages and as an MDX component so
 * Markdown content can alternate backgrounds without custom layout code.
 */
export function Band({
  children,
  tone = 'white',
  id,
  prose = true,
  narrow = false,
  className = '',
}: BandProps) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 md:py-24 ${tones[tone]} ${className}`}>
      <Container>
        <div
          className={`${narrow ? 'mx-auto max-w-prose' : ''} ${
            prose ? (tone === 'navy' ? 'prose-content prose-invert-content' : 'prose-content') : ''
          }`}
        >
          {children}
        </div>
      </Container>
    </section>
  )
}
