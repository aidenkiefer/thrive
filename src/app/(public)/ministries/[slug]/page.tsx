import { Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function MinistryPage({ params }: Props) {
  const { slug } = await params

  return (
    <Section background="light">
      <Container>
        <PageHeader title={slug} eyebrow="Ministry" />
        <p className="mt-6 max-w-prose text-neutral-600">
          Ministry information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
