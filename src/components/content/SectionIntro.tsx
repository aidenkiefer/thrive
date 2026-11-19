interface SectionIntroProps {
  title: string
  eyebrow?: string
  lead?: string
  align?: 'left' | 'center'
  tone?: 'default' | 'inverse'
  as?: 'h2' | 'h3'
  className?: string
}

export function SectionIntro({
  title,
  eyebrow,
  lead,
  align = 'left',
  tone = 'default',
  as: Tag = 'h2',
  className = '',
}: SectionIntroProps) {
  const inverse = tone === 'inverse'
  return (
    <div className={`reveal ${align === 'center' ? 'mx-auto text-center' : ''} max-w-2xl ${className}`}>
      {eyebrow ? (
        <p
          className={`mb-3 text-sm font-medium tracking-wide ${
            inverse ? 'text-accent-400' : 'text-brand-600'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={`font-display text-3xl font-semibold leading-tight md:text-4xl ${
          inverse ? 'text-white' : 'text-neutral-950'
        }`}
      >
        {title}
      </Tag>
      {lead ? (
        <p
          className={`mt-4 text-lg leading-relaxed ${
            inverse ? 'text-white/80' : 'text-neutral-600'
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}
