type BadgeTone = 'brand' | 'accent' | 'neutral'

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200',
  accent: 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200',
  neutral: 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200',
}

export function Badge({ children, tone = 'brand', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
