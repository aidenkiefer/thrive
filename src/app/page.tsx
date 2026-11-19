import {
  getLatestSermon,
  getFeaturedAnnouncement,
  getUpcomingEvents,
  getHighlightedGroups,
  getActiveOutreach,
} from '@/lib/queries'
import { safely } from '@/components/content/safe-data'
import { HeroSection } from '@/components/home/HeroSection'
import { ServiceTimesSection } from '@/components/home/ServiceTimesSection'
import { FeaturedAnnouncement } from '@/components/home/FeaturedAnnouncement'
import { WelcomeSection } from '@/components/home/WelcomeSection'
import { WhatToExpectSection } from '@/components/home/WhatToExpectSection'
import { UpcomingEventsSection } from '@/components/home/UpcomingEventsSection'
import { LatestSermonSection } from '@/components/home/LatestSermonSection'
import { PastorsSection } from '@/components/home/PastorsSection'
import { HubCardsSection } from '@/components/home/HubCardsSection'
import { NewsletterSection } from '@/components/home/NewsletterSection'
import { LocationSection } from '@/components/home/LocationSection'

export const revalidate = 60

export default async function HomePage() {
  // Each query falls back to an empty value so a missing/empty database renders the
  // designed empty states instead of a 500.
  const [latestSermon, announcement, upcomingEvents, groups, outreach] = await Promise.all([
    safely('home: latest sermon', () => getLatestSermon(), null),
    safely('home: featured announcement', () => getFeaturedAnnouncement(), null),
    safely('home: upcoming events', () => getUpcomingEvents(4), { oneTime: [], occurrences: [] }),
    safely('home: highlighted groups', () => getHighlightedGroups(3), []),
    safely('home: active outreach', () => getActiveOutreach(2), []),
  ])

  return (
    <>
      <HeroSection />
      <ServiceTimesSection />
      {announcement && <FeaturedAnnouncement announcement={announcement} />}
      <WelcomeSection />
      <WhatToExpectSection />
      <UpcomingEventsSection
        oneTime={upcomingEvents.oneTime}
        occurrences={upcomingEvents.occurrences}
      />
      <LatestSermonSection sermon={latestSermon} />
      <PastorsSection />
      <HubCardsSection groups={groups} outreach={outreach} />
      <NewsletterSection />
      <LocationSection />
    </>
  )
}
