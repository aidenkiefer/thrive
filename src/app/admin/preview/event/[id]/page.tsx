import type { Metadata } from 'next'
import { EventDetail } from '@/components/events/EventDetail'
import { Band, PageHero } from '@/components/content'
import { PreviewBanner } from '../../_components/preview-banner'
import { eventVisibilityNotes, loadEventPreview } from '../../preview-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Event preview',
  robots: { index: false, follow: false },
}

/**
 * Staff-only preview of a one-time event (draft or published). Mirrors the
 * public /events/[slug] layout with the same public components.
 */
export default async function EventPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await loadEventPreview(id)
  const published = Boolean(event.published_at)
  return <div className="space-y-6">
    <PreviewBanner
      published={published}
      editHref={`/admin/events#form-${event.id}`}
      editLabel="Back to the editor"
      liveHref={`/events/${event.slug}`}
      notes={[`Public address once published: /events/${event.slug}`, ...eventVisibilityNotes(event, new Date())]}
    />
    <div className="overflow-hidden rounded-xl border bg-neutral-0" aria-label="Public preview">
      <PageHero eyebrow={event.category || 'Event'} title={event.name} />
      <Band tone="white" prose={false}>
        <EventDetail
          name={event.name}
          description={event.description}
          category={event.category}
          imageUrl={event.featured_image_url}
          location={event.location}
          venue={event.venue}
          churchsuiteFormUrl={event.churchsuite_form_url}
          externalUrl={event.external_url}
          startDatetime={event.start_datetime}
          endDatetime={event.end_datetime}
          recurrenceDescription={null}
          typicalTime={null}
          nextOccurrenceStart={null}
        />
      </Band>
    </div>
  </div>
}
