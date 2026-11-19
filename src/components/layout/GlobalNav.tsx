'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const navLinks = [
  { label: 'Watch & Listen', href: '/sermons' },
  { label: 'Events', href: '/events' },
  { label: 'Groups', href: '/groups' },
  { label: 'Kids & Youth', href: '/kids-youth' },
  { label: 'Outreach', href: '/outreach' },
  { label: 'About', href: '/about' },
  { label: 'Get Connected', href: '/get-connected' },
]

const visitLink = { label: 'Plan a Visit', href: '/plan-a-visit' }
const giveLink = { label: 'Give', href: '/give' }

export function GlobalNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstMobileLinkRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  // If the window is widened past the mobile breakpoint, close the drawer so the scroll lock is released.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setMobileOpen(false)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (href: string) =>
    `relative inline-flex min-h-11 items-center rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent-400 after:transition-transform after:duration-300 motion-reduce:after:transition-none ${
      isActive(href)
        ? 'text-accent-400 after:scale-x-100'
        : 'text-white/90 after:scale-x-0 hover:text-white hover:after:scale-x-100'
    }`

  return (
    <header
      className={`sticky top-0 z-50 bg-brand-800 transition-shadow ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        {/* Wordmark */}
        <Link href="/" className="flex shrink-0 flex-col leading-none">
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            Thrive Vineyard
          </span>
          <span className="mt-1 hidden text-[11px] font-medium tracking-wide text-accent-400 sm:block">
            Spirit Filled. Down to Earth.
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={linkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={giveLink.href}
            aria-current={isActive(giveLink.href) ? 'page' : undefined}
            className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white press hover:bg-white/10"
          >
            {giveLink.label}
          </Link>
          <Link
            href={visitLink.href}
            aria-current={isActive(visitLink.href) ? 'page' : undefined}
            className="rounded-md bg-accent-400 px-4 py-2 text-sm font-medium text-neutral-950 press hover:brightness-95"
          >
            {visitLink.label}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          ref={menuButtonRef}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-white lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {mobileOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="drawer-in max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-brand-800 lg:hidden"
        >
          <nav className="flex flex-col px-4 py-4" aria-label="Mobile navigation">
            <Link
              href={visitLink.href}
              ref={firstMobileLinkRef}
              aria-current={isActive(visitLink.href) ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex min-h-11 items-center justify-center rounded-md bg-accent-400 px-4 text-base font-medium text-neutral-950"
            >
              {visitLink.label}
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`flex min-h-12 items-center border-b border-white/10 text-base font-medium transition-colors ${
                  isActive(link.href) ? 'text-accent-400' : 'text-white hover:text-accent-400'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={giveLink.href}
              aria-current={isActive(giveLink.href) ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex min-h-11 items-center justify-center rounded-md border border-white/30 px-4 text-base font-medium text-white"
            >
              {giveLink.label}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
