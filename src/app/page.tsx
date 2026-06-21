import {
  getLatestSermon,
  getFeaturedAnnouncement,
  getUpcomingEvents,
  getHighlightedGroups,
  getActiveOutreach,
} from '@/lib/queries'
import { HeroSection } from '@/components/home/HeroSection'
import { ServiceTimesSection } from '@/components/home/ServiceTimesSection'
import { FeaturedAnnouncement } from '@/components/home/FeaturedAnnouncement'
import { UpcomingEventsSection } from '@/components/home/UpcomingEventsSection'
import { LatestSermonSection } from '@/components/home/LatestSermonSection'
import { HubCardsSection } from '@/components/home/HubCardsSection'
import { NewsletterSection } from '@/components/home/NewsletterSection'

export const revalidate = 60

export default async function HomePage() {
  const [latestSermon, announcement, upcomingEvents, groups, outreach] = await Promise.all([
    getLatestSermon(),
    getFeaturedAnnouncement(),
    getUpcomingEvents(4),
    getHighlightedGroups(3),
    getActiveOutreach(2),
  ])

  return (
    <>
      <HeroSection />
      <ServiceTimesSection />
      {announcement && <FeaturedAnnouncement announcement={announcement} />}
      <UpcomingEventsSection
        oneTime={upcomingEvents.oneTime}
        occurrences={upcomingEvents.occurrences}
      />
      <LatestSermonSection sermon={latestSermon} />
      <HubCardsSection groups={groups} outreach={outreach} />
      <NewsletterSection />
    </>
  )
}
