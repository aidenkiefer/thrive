import { SERVICE_TIMES } from '@/lib/constants/service-times'
import { Band } from '@/components/content/Band'
import { SectionIntro } from '@/components/content/SectionIntro'
import { SITE } from '@/components/content/site-info'
import { ArrowRightIcon, ClockIcon, PinIcon } from '@/components/content/icons'

/**
 * Service times band.
 * Source: SERVICE_TIMES (src/lib/constants/service-times.ts) for names, times, locations,
 * descriptions and the pause note (rendered only when isPaused && pauseNote).
 * Address and directions: SITE (site-info.ts; audit about.md "Location").
 */
export function ServiceTimesSection() {
  return (
    <Band tone="light" prose={false}>
      <SectionIntro eyebrow="Sundays at Thrive" title="Join us Sunday" />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {SERVICE_TIMES.map((service) => (
          <article
            key={service.name}
            className="flex flex-col rounded-2xl bg-neutral-0 p-6 shadow-sm ring-1 ring-black/5 md:p-8"
          >
            <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-brand-600">
              <ClockIcon className="h-5 w-5" />
              {service.time}
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-neutral-950">
              {service.name}
            </h3>
            <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span>{service.location}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{service.description}</p>
            {service.isPaused && service.pauseNote ? (
              <p className="mt-4 inline-block self-start rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-accent-400/60">
                {service.pauseNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-100 px-6 py-5">
        <p className="flex items-start gap-2 text-sm text-neutral-950">
          <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <span>
            <span className="block font-medium">{SITE.name}</span>
            {SITE.addressLine}
          </span>
        </p>
        <a
          href={SITE.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Get directions
          <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>
    </Band>
  )
}
