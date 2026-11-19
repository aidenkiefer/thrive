interface StepProps {
  title: string
  children?: React.ReactNode
}

interface StepListProps {
  children: React.ReactNode
  /** Numbering starts here (the visible badge number). */
  start?: number
}

/** A numbered journey with a connecting line. Use <Step> children. */
export function StepList({ children }: StepListProps) {
  return <ol className="relative mt-8 space-y-8 !list-none !pl-0">{children}</ol>
}

export function Step({ title, children }: StepProps) {
  return (
    <li className="step-item relative !pl-0 sm:pl-0">
      <div className="flex gap-5">
        <span
          aria-hidden="true"
          className="step-badge relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-800 font-display text-lg font-semibold text-white ring-4 ring-neutral-0"
        />
        <div className="max-w-2xl pb-2">
          <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-neutral-950 md:text-2xl">
            {title}
          </h3>
          {children ? (
            <div className="mt-2 space-y-3 text-neutral-600 [&>p]:leading-relaxed">{children}</div>
          ) : null}
        </div>
      </div>
    </li>
  )
}
