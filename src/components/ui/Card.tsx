import Link from 'next/link'
import Image from 'next/image'

interface CardProps {
  title: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  footer?: React.ReactNode
  className?: string
  href?: string
}

export function Card({
  title,
  description,
  imageUrl,
  imageAlt = '',
  footer,
  className = '',
  href,
}: CardProps) {
  const content = (
    <>
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={720}
            height={405}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <p className="font-display text-xl text-neutral-950 font-semibold">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{description}</p>
        )}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </>
  )

  const rootClasses = `rounded-lg bg-neutral-0 shadow-sm overflow-hidden ${className}`

  if (href) {
    return (
      <Link href={href} className={rootClasses}>
        {content}
      </Link>
    )
  }

  return <div className={rootClasses}>{content}</div>
}
