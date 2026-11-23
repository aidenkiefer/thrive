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
  primary: 'bg-brand-800 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20 dark:bg-brand-600 dark:hover:bg-brand-500',
  secondary: 'border border-brand-800/80 text-brand-800 hover:border-brand-800 hover:bg-brand-50',
  ghost: 'text-brand-800 hover:bg-brand-50',
  accent: 'bg-accent-400 text-brand-950 shadow-sm shadow-accent-700/20 hover:bg-accent-300 hover:shadow-md hover:shadow-accent-700/20',
}

const baseClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

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
