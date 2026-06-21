import { SERVICE_TIMES } from '@/lib/constants/service-times'
import { Section, Container, Heading } from '@/components/ui'

export function ServiceTimesSection() {
  return (
    <Section background="light">
      <Container>
        <Heading level="h2" className="text-center mb-8">Join Us Sunday</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {SERVICE_TIMES.map((service) => (
            <div key={service.name} className="bg-neutral-0 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display text-xl font-semibold">{service.name}</h3>
                <span className="text-brand-800 font-medium text-sm">{service.time}</span>
              </div>
              <p className="text-sm text-neutral-600 mb-1">{service.location}</p>
              <p className="text-sm text-neutral-600">{service.description}</p>
              {service.isPaused && service.pauseNote && (
                <p className="mt-3 text-xs text-accent-400 font-medium">{service.pauseNote}</p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
