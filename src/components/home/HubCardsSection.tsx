import { Band } from '@/components/content/Band'
import { CardGrid, InfoCard } from '@/components/content/CardGrid'
import { SectionIntro } from '@/components/content/SectionIntro'

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

/**
 * Get involved hub.
 * Sources:
 *  - Kids: docs/audit/2026-11/pages/kids-youth.md ("We partner with parents, creating safe places...")
 *  - Groups / Outreach: short_summary of the highlighted canonical record when present,
 *    otherwise neutral navigational copy (no invented facts).
 *  - Give: docs/audit/2026-11/pages/give.md ("Time, Talent, Treasure")
 * Photos: audited catalog keys kidsReading, prayer, water, worship.
 */
export function HubCardsSection({
  groups,
  outreach,
}: {
  groups: Group[]
  outreach: Outreach[]
}) {
  return (
    <Band tone="light" prose={false}>
      <SectionIntro eyebrow="Get involved" title="Find your place at Thrive" align="center" />
      <CardGrid columns={4}>
        <InfoCard title="Kids & Youth" photo="kidsReading" href="/kids-youth" linkLabel="Explore Kids & Youth">
          <p>
            We partner with parents, creating safe places where kids can grow in their faith and encounter Jesus.
          </p>
        </InfoCard>
        <InfoCard title="Groups" photo="prayer" href="/groups" linkLabel="Find a group">
          <p>{groups[0]?.short_summary ?? 'Find a group at Thrive Vineyard.'}</p>
        </InfoCard>
        <InfoCard title="Outreach" photo="water" href="/outreach" linkLabel="See outreach">
          <p>{outreach[0]?.short_summary ?? 'Learn about outreach at Thrive Vineyard.'}</p>
        </InfoCard>
        <InfoCard title="Give" photo="worship" href="/give" linkLabel="Ways to give">
          <p>Time, Talent, Treasure</p>
        </InfoCard>
      </CardGrid>
    </Band>
  )
}
