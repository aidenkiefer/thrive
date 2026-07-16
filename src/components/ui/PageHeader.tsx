import { Heading } from './Heading'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`max-w-prose ${className}`}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium tracking-wide text-brand-600">{eyebrow}</p>
      ) : null}
      <Heading level="h1">{title}</Heading>
      {description ? <p className="mt-4 text-lg text-neutral-600">{description}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}
