interface PendingNoteProps {
  title: string
  children?: React.ReactNode
  className?: string
}

/**
 * Intentional "this content is coming" state. Use wherever the audit or owner has
 * not supplied approved facts. Never fill the gap with invented copy.
 */
export function PendingNote({ title, children, className = '' }: PendingNoteProps) {
  return (
    <div
      role="note"
      className={`rounded-2xl border border-dashed border-accent-400 bg-accent-50 p-6 ${className}`}
    >
      <p className="eyebrow text-accent-600">Coming soon</p>
      <p className="mt-1 font-display text-xl font-semibold text-neutral-950">{title}</p>
      {children ? <div className="mt-2 text-sm leading-relaxed text-neutral-600">{children}</div> : null}
    </div>
  )
}
