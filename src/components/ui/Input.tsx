import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-neutral-950 shadow-sm transition-colors placeholder:text-neutral-500 hover:border-neutral-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${className}`}
      {...props}
    />
  )
})
