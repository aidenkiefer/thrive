type SectionBackground = 'white' | 'light' | 'brand' | 'accent'

interface SectionProps {
  children: React.ReactNode
  background?: SectionBackground
  className?: string
  id?: string
}

const backgroundClasses: Record<SectionBackground, string> = {
  white: 'bg-neutral-0',
  light: 'bg-neutral-100',
  brand: 'bg-brand-800 text-white',
  accent: 'bg-accent-50',
}

export function Section({
  children,
  background = 'white',
  className = '',
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`py-16 md:py-24 ${backgroundClasses[background]} ${className}`}
    >
      {children}
    </section>
  )
}
