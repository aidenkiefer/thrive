import { Button, Container, Heading, Section } from '@/components/ui'

export default function NotFound() {
  return (
    <Section background="light">
      <Container>
        <div className="mx-auto max-w-prose py-12 text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-brand-600">404</p>
          <Heading level="h1">Page not found</Heading>
          <p className="mt-4 text-lg text-neutral-600">
            The page you requested is not available.
          </p>
          <div className="mt-8">
            <Button href="/">Return home</Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}
