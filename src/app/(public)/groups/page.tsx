import { Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

export default function GroupsPage() {
  return (
    <Section background="light">
      <Container>
        <PageHeader title="Groups" />
        <p className="mt-6 max-w-prose text-neutral-600">
          Group information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
