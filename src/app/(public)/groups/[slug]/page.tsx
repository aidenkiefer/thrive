import { BackLink, Container, PageHeader, Section } from '@/components/ui'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function GroupPage({ params }: Props) {
  const { slug } = await params

  return (
    <Section background="light">
      <Container>
        <BackLink href="/groups">All groups</BackLink>
        <PageHeader title={slug} eyebrow="Group" className="mt-5" />
        <p className="mt-6 max-w-prose text-neutral-600">
          Group information is being prepared.
        </p>
      </Container>
    </Section>
  )
}
