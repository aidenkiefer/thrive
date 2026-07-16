import { Button, Container, Section } from '@/components/ui'

export function HeroSection() {
  return (
    <Section background="brand" className="py-24 md:py-32">
      <Container>
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium tracking-wide text-accent-400">
            Welcome to Thrive Vineyard
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
            Spirit Filled.<br />Down to Earth.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            A Vineyard church in Palatine, IL. Come as you are — explore faith, find community, and grow together.
          </p>
          <Button href="/plan-a-visit" variant="accent">
            Plan Your Visit
          </Button>
        </div>
      </Container>
    </Section>
  )
}
