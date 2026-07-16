import { Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

export default function TeamPage() {
  return (
    <Section background="light">
      <Container>
        <PageHeader title="Our Team" />
        <p className="mt-6 max-w-prose text-neutral-600">
          Team information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
