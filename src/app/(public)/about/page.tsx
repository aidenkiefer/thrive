import { Container, PageHeader, Section } from '@/components/ui'

export default function AboutPage() {
  return (
    <Section background="light">
      <Container>
        <PageHeader title="About Thrive Vineyard" />
        <p className="mt-6 max-w-prose text-neutral-600">
          More information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
