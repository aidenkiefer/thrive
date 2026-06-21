type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

interface HeadingProps {
  level: HeadingLevel
  children: React.ReactNode
  className?: string
}

const levelClasses: Record<HeadingLevel, string> = {
  h1: 'font-display text-4xl md:text-5xl font-semibold text-neutral-950 leading-tight',
  h2: 'font-display text-3xl font-semibold text-neutral-950 leading-snug',
  h3: 'font-display text-2xl font-semibold text-neutral-950',
  h4: 'font-display text-xl font-semibold text-neutral-950',
}

export function Heading({ level, children, className = '' }: HeadingProps) {
  const Tag = level
  return <Tag className={`${levelClasses[level]} ${className}`}>{children}</Tag>
}
