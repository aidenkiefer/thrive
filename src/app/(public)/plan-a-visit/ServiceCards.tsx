// Local MDX components for /plan-a-visit.
// Source: src/lib/constants/service-times.ts (names, times, locations, descriptions, pause flags)
// and docs/audit/2026-11/pages/plan-a-visit.md (step 4 wording on service length and location).
// Pause state is NEVER hardcoded here: it always comes from SERVICE_TIMES.isPaused.
import { SERVICE_TIMES } from '@/lib/constants/service-times'
import { ClockIcon, PinIcon } from '@/components/content/icons'

export function ServiceCards() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
      {SERVICE_TIMES.map((service) => (
        <article
          key={service.name}
          className="flex flex-col rounded-2xl bg-neutral-0 p-6 shadow-sm ring-1 ring-black/5 md:p-8"
        >
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-800">
            <ClockIcon className="h-5 w-5" />
          </span>
          <h3 className="font-display text-2xl font-semibold text-neutral-950">{service.name}</h3>
          <p className="mt-1 font-display text-3xl font-semibold text-brand-800">{service.time}</p>
          <p className="mt-4 flex items-start gap-2 text-sm text-neutral-600">
            <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>{service.location}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{service.description}</p>
          {service.isPaused && service.pauseNote ? (
            <p
              role="note"
              className="mt-5 rounded-lg border border-dashed border-accent-400 bg-accent-50 px-4 py-3 text-sm font-medium text-brand-800"
            >
              {service.pauseNote}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

/** Audited step 4 wording, generated per service so the pause flag decides what shows. */
const AUDITED_DETAILS: Record<string, (time: string) => string> = {
  'Express(o)': (time) =>
    `Our Express(o) service starts at ${time} and lasts around 45 minutes and is located in the cafe downstairs.`,
  'Family Worship': (time) =>
    `Our family worship service starts at ${time} and lasts 80–90 minutes and offers full programming for all ages of kids.`,
}

export function ServiceDetails() {
  return (
    <>
      {SERVICE_TIMES.map((service) => {
        if (service.isPaused) {
          return (
            <p key={service.name}>
              <strong className="font-medium text-neutral-950">{service.name}:</strong>{' '}
              {service.pauseNote}
            </p>
          )
        }
        const detail = AUDITED_DETAILS[service.name]
        return <p key={service.name}>{detail ? detail(service.time) : service.description}</p>
      })}
    </>
  )
}
