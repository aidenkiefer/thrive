export type AdminIconName =
  | 'home'
  | 'megaphone'
  | 'play'
  | 'calendar'
  | 'repeat'
  | 'users'
  | 'heart'
  | 'hands'
  | 'layout'
  | 'id'

export interface AdminSection {
  label: string
  href: string
  icon: AdminIconName
  description: string
  /** Supabase table counted on the dashboard; absent for file-backed tools. */
  table?: string
  /** Table has a published_at column, so drafts can be counted. */
  publishable: boolean
}

export interface AdminSectionGroup {
  label: string
  sections: AdminSection[]
}

export const adminSectionGroups: AdminSectionGroup[] = [
  {
    label: 'Content',
    sections: [
      { label: 'Announcements', href: '/admin/announcements', icon: 'megaphone', description: 'Site notices. The newest featured one leads the homepage.', table: 'announcements', publishable: true },
      { label: 'Sermons', href: '/admin/sermons', icon: 'play', description: 'Weekly messages, each with its speaker and series.', table: 'sermons', publishable: true },
      { label: 'Sermon series', href: '/admin/sermon-series', icon: 'play', description: 'Series that group sermons. Publish one before choosing it on a sermon.', table: 'sermon_series', publishable: true },
      { label: 'Speakers', href: '/admin/speakers', icon: 'id', description: 'Pastors and guest speakers to choose on a sermon.', table: 'speakers', publishable: false },
      { label: 'Media library', href: '/admin/media', icon: 'layout', description: 'Browse church photos, artwork, and brand images.', publishable: false },
      { label: 'Campaign pages', href: '/admin/landing-pages', icon: 'layout', description: 'Standalone landing pages for campaigns.', table: 'landing_pages', publishable: true },
    ],
  },
  {
    label: 'Calendar',
    sections: [
      { label: 'One-time events', href: '/admin/events', icon: 'calendar', description: 'Dated events, each with its own page.', table: 'one_time_events', publishable: true },
      { label: 'Recurring events', href: '/admin/recurring-events', icon: 'repeat', description: 'Regular gatherings and their occurrences.', table: 'recurring_events', publishable: true },
    ],
  },
  {
    label: 'People & ministries',
    sections: [
      { label: 'Groups', href: '/admin/groups', icon: 'users', description: 'Groups people can find and join.', table: 'groups', publishable: true },
      { label: 'Ministries', href: '/admin/ministries', icon: 'heart', description: 'Ministry listings and details.', table: 'ministries', publishable: true },
      { label: 'Outreach', href: '/admin/outreach', icon: 'hands', description: 'Outreach opportunities.', table: 'outreach', publishable: true },
      { label: 'Staff directory', href: '/admin/staff', icon: 'id', description: 'Staff profiles and contact details.', table: 'staff', publishable: false },
    ],
  },
]

export const adminSections: AdminSection[] = adminSectionGroups.flatMap((group) => group.sections)
