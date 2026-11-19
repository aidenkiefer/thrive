import Link from 'next/link'
import { SITE } from '@/components/content/site-info'
import { recoveryLinks } from './nav-links'

const linkClass =
  'inline-flex min-h-11 items-center rounded-md px-3 py-2 text-base font-medium text-brand-800 underline underline-offset-4 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

/** "Where to next" list shared by the 404 and error pages. */
export function RecoveryLinks() {
  return (
    <nav aria-label="Helpful links" className="mt-10 border-t border-neutral-200 pt-8">
      <h2 className="font-display text-xl font-semibold text-neutral-950">
        Where would you like to go?
      </h2>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1">
        {recoveryLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-neutral-600">
        Still stuck?{' '}
        <a
          href={`mailto:${SITE.email}`}
          className="inline-flex min-h-11 items-center font-medium text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Email us
        </a>{' '}
        and we will help.
      </p>
    </nav>
  )
}
