import { Section, Container, Heading, Card } from '@/components/ui'

interface Group {
  slug: string
  name: string
  short_summary: string | null
}

interface Outreach {
  slug: string
  name: string
  short_summary: string | null
}

export function HubCardsSection({
  groups,
  outreach,
}: {
  groups: Group[]
  outreach: Outreach[]
}) {
  const hubs = [
    {
      title: 'Kids & Youth',
      description: 'More information is being prepared.',
      href: '/kids-youth',
    },
    {
      title: 'Groups',
      description:
        groups[0]?.short_summary ??
        'Group information is being prepared.',
      href: '/groups',
    },
    {
      title: 'Outreach',
      description:
        outreach[0]?.short_summary ??
        'Outreach information is being prepared.',
      href: '/outreach',
    },
  ]

  return (
    <Section background="light">
      <Container>
        <Heading level="h2" className="text-center mb-8">
          Get Involved
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hubs.map((hub) => (
            <Card
              key={hub.href}
              title={hub.title}
              description={hub.description}
              href={hub.href}
              footer={
                <span className="inline-flex w-full items-center justify-center rounded-md border border-brand-800 px-5 py-2.5 text-sm font-medium text-brand-800">
                  Learn More
                </span>
              }
            />
          ))}
        </div>
      </Container>
    </Section>
  )
}
