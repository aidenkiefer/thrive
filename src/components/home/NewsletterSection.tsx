import { Section, Container, Heading, Button } from '@/components/ui'

export function NewsletterSection() {
  return (
    <Section background="brand">
      <Container>
        <div className="text-center max-w-xl mx-auto">
          <Heading level="h2" className="text-white mb-3">
            Stay Connected
          </Heading>
          <p className="text-white/80 mb-6">
            Get updates on services, events, and community news from Thrive Vineyard.
          </p>
          {/* Mailchimp embed coming in Sprint 02 */}
          <Button href="https://thrivevineyard.com/get-connected/" variant="accent">
            Sign Up for Updates
          </Button>
        </div>
      </Container>
    </Section>
  )
}
