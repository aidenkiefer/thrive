'use client'

import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'

interface ButtonProps {
  variant?: ButtonVariant
  href?: string
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: () => void
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-600',
  secondary: 'border border-brand-800 text-brand-800 hover:bg-brand-100',
  ghost: 'text-brand-800 hover:bg-brand-100',
  accent: 'bg-accent-400 text-neutral-950 hover:bg-accent-50',
}

const baseClasses =
  'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export function Button({
  variant = 'primary',
  href,
  children,
  className = '',
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  )
}
