import Link from 'next/link'
import { SERVICE_TIMES } from '@/lib/constants/service-times'
import { SITE } from '@/components/content/site-info'

const exploreLinks = [
  { label: 'Plan a Visit', href: '/plan-a-visit' },
  { label: 'Watch & Listen', href: '/sermons' },
  { label: 'Events', href: '/events' },
  { label: 'Groups', href: '/groups' },
  { label: 'Kids & Youth', href: '/kids-youth' },
  { label: 'Outreach', href: '/outreach' },
  { label: 'About', href: '/about' },
  { label: 'Give', href: '/give' },
]

const socialLinks = [
  { label: 'YouTube', href: SITE.social.youtube },
  { label: 'Facebook', href: SITE.social.facebook },
  { label: 'Instagram', href: SITE.social.instagram },
]

const headingClass = 'text-sm font-semibold tracking-wide text-accent-400'
const linkClass = 'transition-colors hover:text-white'

export function Footer() {
  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto max-w-content px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="font-display text-2xl font-semibold text-white">
              {SITE.shortName}
            </Link>
            <p className="mt-2 text-sm text-accent-400">{SITE.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              A Vineyard church in Palatine, IL.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services + location */}
          <div>
            <h2 className={headingClass}>Sunday Services</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {/* Single source of truth: src/lib/constants/service-times.ts (owner-confirmed schedule + pause state). */}
              {SERVICE_TIMES.map((service) => (
                <li key={service.name}>
                  <span className="font-medium text-white">{service.time}</span> — {service.name}
                  {service.isPaused && service.pauseNote && (
                    <span className="block text-xs text-white/60">
                      {service.pauseNote}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{SITE.addressLine}</p>
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1 inline-block text-sm text-white/80 underline decoration-white/30 underline-offset-4 ${linkClass}`}
            >
              Get directions
            </a>
          </div>

          {/* Explore */}
          <div>
            <h2 className={headingClass}>Explore</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/80 lg:grid-cols-1">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className={headingClass}>Connect</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <a href={SITE.phoneHref} className={linkClass}>
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className={linkClass}>
                  {SITE.email}
                </a>
              </li>
              <li>
                <Link href="/get-connected" className={linkClass}>
                  Get connected
                </Link>
              </li>
              {/* "Website feedback" link (/feedback) is intentionally hidden until the
                  /api/forms/feedback route from Data PR #15 is merged; the form cannot submit without it. */}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {SITE.shortName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
