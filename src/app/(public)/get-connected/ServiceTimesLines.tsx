// Local component for /get-connected contact cards.
// Source: src/lib/constants/service-times.ts (names, times, pause flags). Never hardcodes pause state.
import { SERVICE_TIMES } from '@/lib/constants/service-times'

export function ServiceTimesLines() {
  return (
    <ul className="space-y-2">
      {SERVICE_TIMES.map((service) => (
        <li key={service.name}>
          <span className="font-medium text-neutral-950">{service.name}</span>
          <span>: {service.time}</span>
          {service.isPaused && service.pauseNote ? (
            <span className="mt-0.5 block text-xs text-brand-600">{service.pauseNote}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
