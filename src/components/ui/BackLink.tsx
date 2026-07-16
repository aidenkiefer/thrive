import Link from 'next/link'

interface BackLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function BackLink({ href, children, className = '' }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm font-medium text-brand-800 underline-offset-4 transition-colors hover:text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${className}`}
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  )
}
