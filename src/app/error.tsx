'use client'

import { Button, Container, Heading, Section } from '@/components/ui'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Section background="light">
      <Container>
        <div className="mx-auto max-w-prose py-12 text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-brand-600">
            Something went wrong
          </p>
          <Heading level="h1">Please try again</Heading>
          <p className="mt-4 text-lg text-neutral-600">
            We were unable to load this page.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button href="/" variant="secondary">Return home</Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}
