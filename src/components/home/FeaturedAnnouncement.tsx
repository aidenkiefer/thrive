import { Section, Container, Heading, Button } from '@/components/ui'

interface Announcement {
  title: string
  body: string | null
  cta_text: string | null
  cta_url: string | null
}

export function FeaturedAnnouncement({ announcement }: { announcement: Announcement }) {
  return (
    <Section background="accent">
      <Container>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <Heading level="h3">{announcement.title}</Heading>
            {announcement.body && (
              <p className="mt-2 text-neutral-600">{announcement.body}</p>
            )}
          </div>
          {announcement.cta_text && announcement.cta_url && (
            <Button href={announcement.cta_url} variant="primary">
              {announcement.cta_text}
            </Button>
          )}
        </div>
      </Container>
    </Section>
  )
}
