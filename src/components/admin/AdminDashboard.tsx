import Link from 'next/link'
import { AdminIcon } from './AdminIcon'
import { adminSectionGroups, type AdminSection } from './admin-sections'

export type SectionCounts = { total: number; drafts: number | null } | null

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Chicago' }).format(new Date()),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function SectionCard({ section, counts }: { section: AdminSection; counts: SectionCounts }) {
  return (
    <Link
      href={section.href}
      className="group relative flex flex-col rounded-2xl bg-neutral-0 p-5 shadow-soft ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-800 group-hover:text-white">
          <AdminIcon name={section.icon} />
        </span>
        {counts?.drafts ? (
          <span className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 ring-1 ring-warning-600/20">
            {counts.drafts} {counts.drafts === 1 ? 'draft' : 'drafts'}
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-brand-900">{section.label}</p>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-neutral-600">{section.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
        <span className="text-neutral-500">
          {counts ? (
            <>
              <span className="font-semibold text-neutral-900">{counts.total}</span> {counts.total === 1 ? 'item' : 'items'}
            </>
          ) : (
            'Open to manage'
          )}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-brand-700">
          Manage
          <AdminIcon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

/** Dashboard body. `counts` is keyed by section href; null means the count could not be loaded. */
export function AdminDashboard({ email, counts }: { email: string; counts: Map<string, SectionCounts> }) {
  const totalDrafts = [...counts.values()].reduce((sum, item) => sum + (item?.drafts ?? 0), 0)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-800 to-brand-700 px-6 py-8 text-white shadow-lift sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[url('/images/brand/thrive-mark.webp')] bg-contain bg-no-repeat opacity-[0.07]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
        <p className="eyebrow text-accent-300">Thrive admin</p>
        <p className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{greeting()}</p>
        <p className="mt-2 max-w-xl text-white/75">
          Signed in as <span className="font-medium text-white">{email}</span>. Everything you publish here appears
          across the website wherever it&rsquo;s relevant.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/announcements"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent-400 px-5 text-sm font-semibold text-brand-950 shadow-sm transition hover:bg-accent-300"
          >
            <AdminIcon name="megaphone" className="h-4 w-4" />
            Post an announcement
          </Link>
          <Link
            href="/admin/events"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
          >
            <AdminIcon name="calendar" className="h-4 w-4" />
            Add an event
          </Link>
        </div>
        {totalDrafts > 0 && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
            {totalDrafts} unpublished {totalDrafts === 1 ? 'draft' : 'drafts'} across the site
          </p>
        )}
      </section>

      <h1 className="sr-only">Dashboard</h1>

      {adminSectionGroups.map((group, index) => (
        <section key={group.label} aria-labelledby={`admin-group-${index}`}>
          <h2 id={`admin-group-${index}`} className="!font-sans !text-xs !font-semibold uppercase tracking-[0.14em] !text-neutral-500">
            {group.label}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.sections.map((section) => (
              <SectionCard key={section.href} section={section} counts={counts.get(section.href) ?? null} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
