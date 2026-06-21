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
      description:
        'Safe, fun environments for kids and teens to grow in faith from birth through high school.',
      href: '/kids-youth',
    },
    {
      title: 'Groups',
      description:
        groups[0]?.short_summary ??
        'Connect in small groups, prayer gatherings, and community life.',
      href: '/groups',
    },
    {
      title: 'Outreach',
      description:
        outreach[0]?.short_summary ??
        'Serving Palatine and beyond through practical ministry and community care.',
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
