import { SITE } from '@/components/content/site-info'
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/content/icons'
import { SERVICE_TIMES } from '@/lib/constants/service-times'

/**
 * Service times, address, email and phone for the "Get in touch" band.
 * Service data comes from SERVICE_TIMES (pause status is read from the data, never hardcoded);
 * address/email/phone come from SITE (site-info.ts).
 * Designed for a navy band, so all colours are light-on-dark.
 */
export function ContactDetails() {
  const linkClass =
    'inline-flex min-h-[44px] items-center font-medium text-white underline decoration-accent-400/60 underline-offset-4 hover:text-accent-300'

  return (
    <div className="not-prose mt-10 grid gap-8 md:grid-cols-2">
      <div>
        <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
          <ClockIcon className="h-5 w-5 text-accent-400" />
          Service times
        </h3>
        <ul className="mt-4 space-y-4">
          {SERVICE_TIMES.map((service) => (
            <li key={service.name} className="rounded-xl bg-white/10 p-4">
              <p className="font-medium text-white">
                {service.time} <span className="text-white/60">·</span> {service.name}
              </p>
              <p className="mt-1 text-sm text-white/75">{service.location}</p>
              <p className="mt-1 text-sm text-white/75">{service.description}</p>
              {service.isPaused && service.pauseNote ? (
                <p className="mt-2 text-sm font-medium text-accent-300">{service.pauseNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold text-white">Find and reach us</h3>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3">
            <PinIcon className="mt-3 h-5 w-5 shrink-0 text-accent-400" />
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {SITE.addressLine}
            </a>
          </li>
          <li className="flex items-start gap-3">
            <MailIcon className="mt-3 h-5 w-5 shrink-0 text-accent-400" />
            <a href={`mailto:${SITE.email}`} className={linkClass}>
              {SITE.email}
            </a>
          </li>
          <li className="flex items-start gap-3">
            <PhoneIcon className="mt-3 h-5 w-5 shrink-0 text-accent-400" />
            <a href={SITE.phoneHref} className={linkClass}>
              {SITE.phone}
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

/** Inline mailto link for use inside light-background notes. */
export function EmailLink() {
  return (
    <a
      href={`mailto:${SITE.email}`}
      className="font-medium text-brand-800 underline decoration-brand-600/40 underline-offset-4 hover:text-brand-600"
    >
      {SITE.email}
    </a>
  )
}

/** Outlined mailto button for use on navy bands (e.g. CtaBand actions). */
export function EmailButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={`mailto:${SITE.email}`}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white press hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
    >
      {children}
    </a>
  )
}
