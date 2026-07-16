import { BackLink, Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function OutreachDetailPage({ params }: Props) {
  const { slug } = await params

  return (
    <Section background="light">
      <Container>
        <BackLink href="/outreach">All outreach</BackLink>
        <PageHeader title={slug} eyebrow="Outreach" className="mt-5" />
        <p className="mt-6 max-w-prose text-neutral-600">
          Outreach information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
