import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border border-brand-100 bg-neutral-0 px-4 py-2.5 text-neutral-950 placeholder:text-neutral-600 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  )
})
