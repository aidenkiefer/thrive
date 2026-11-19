import { QuoteIcon } from './icons'

interface PullQuoteProps {
  children: React.ReactNode
  attribution?: string
  tone?: 'default' | 'inverse'
}

export function PullQuote({ children, attribution, tone = 'default' }: PullQuoteProps) {
  const inverse = tone === 'inverse'
  return (
    <figure className={`reveal relative my-10 rounded-2xl p-8 md:p-10 ${inverse ? 'bg-white/10' : 'bg-accent-50'}`}>
      <QuoteIcon className={`mb-4 h-8 w-8 ${inverse ? 'text-accent-400' : 'text-accent-400'}`} />
      <blockquote
        className={`font-display text-xl leading-relaxed md:text-2xl ${
          inverse ? 'text-white' : 'text-neutral-950'
        }`}
      >
        {children}
      </blockquote>
      {attribution ? (
        <figcaption className={`mt-4 text-sm font-medium ${inverse ? 'text-white/70' : 'text-neutral-600'}`}>
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  )
}
