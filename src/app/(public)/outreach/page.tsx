import { Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

export default function OutreachPage() {
  return (
    <Section background="light">
      <Container>
        <PageHeader title="Outreach" />
        <p className="mt-6 max-w-prose text-neutral-600">
          More information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
