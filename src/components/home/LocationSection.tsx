import { Band } from '@/components/content/Band'
import { MapEmbed } from '@/components/content/MapEmbed'
import { SectionIntro } from '@/components/content/SectionIntro'

/**
 * Location band. Source: SITE (site-info.ts; audit about.md "Location", plan-a-visit.md map iframe).
 */
export function LocationSection() {
  return (
    <Band tone="white" prose={false}>
      <SectionIntro eyebrow="Find us" title="Visit us in Palatine" align="center" />
      <MapEmbed className="mt-10" />
    </Band>
  )
}
