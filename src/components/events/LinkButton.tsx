import Link from 'next/link'

type LinkButtonVariant = 'primary' | 'secondary' | 'onDark'

interface LinkButtonProps {
  href: string
  children: React.ReactNode
  variant?: LinkButtonVariant
  className?: string
  /** Force a plain anchor (route handlers such as the iCal download). */
  plain?: boolean
}

const variants: Record<LinkButtonVariant, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-600 focus-visible:ring-brand-600',
  secondary: 'border border-brand-800 text-brand-800 hover:bg-brand-100 focus-visible:ring-brand-600',
  onDark: 'border border-white/70 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-brand-900',
}

const base =
  'inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

/**
 * Local 44px-tall link styled as a button. External http(s) links open in a new
 * tab with rel=noopener; internal links use next/link.
 */
export function LinkButton({ href, children, variant = 'primary', className = '', plain = false }: LinkButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    )
  }
  if (plain || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
