import type { Metadata } from 'next'
import { FeaturedAnnouncement } from '@/components/home/FeaturedAnnouncement'
import { PreviewBanner } from '../../_components/preview-banner'
import { announcementVisibilityNotes, loadAnnouncementPreview } from '../../preview-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Announcement preview',
  robots: { index: false, follow: false },
}

/** Staff-only preview of an announcement (draft or published), rendered with the public homepage component. */
export default async function AnnouncementPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await loadAnnouncementPreview(id)
  const published = Boolean(item.published_at)
  return <div className="space-y-6">
    <PreviewBanner
      published={published}
      editHref={`/admin/announcements#form-${item.id}`}
      editLabel="Back to the editor"
      liveHref="/"
      notes={[
        ...announcementVisibilityNotes(item, new Date()),
        'On the homepage it appears just below the service times. If several announcements are featured, only the most recently published one shows.',
      ]}
    />
    <div className="overflow-hidden rounded-xl border bg-neutral-0" aria-label="Public preview">
      <FeaturedAnnouncement announcement={item} />
    </div>
  </div>
}
