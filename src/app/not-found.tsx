import { Button, Container, Heading, Section } from '@/components/ui'
import { RecoveryLinks } from '@/components/layout/RecoveryLinks'

export default function NotFound() {
  return (
    <Section background="light">
      <Container>
        <div className="mx-auto max-w-prose py-12 text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-brand-600">404</p>
          <Heading level="h1">We could not find that page</Heading>
          <p className="mt-4 text-lg text-neutral-600">
            The page may have moved or the link may be out of date. Here are a few good places to
            start.
          </p>
          <div className="mt-8">
            <Button href="/">Return home</Button>
          </div>
          <RecoveryLinks />
        </div>
      </Container>
    </Section>
  )
}
