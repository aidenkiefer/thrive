type BadgeTone = 'brand' | 'accent' | 'neutral'

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  brand: 'bg-brand-100 text-brand-800',
  accent: 'border border-accent-400 bg-accent-50 text-neutral-950',
  neutral: 'bg-neutral-100 text-neutral-600',
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
