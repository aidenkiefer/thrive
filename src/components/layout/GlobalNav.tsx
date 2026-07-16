'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const navLinks = [
  { label: 'Plan a Visit', href: '/plan-a-visit' },
  { label: 'Watch & Listen', href: '/sermons' },
  { label: 'Events', href: '/events' },
  { label: 'Groups', href: '/groups' },
  { label: 'Kids & Youth', href: '/kids-youth' },
  { label: 'Outreach', href: '/outreach' },
  { label: 'About', href: '/about' },
  { label: 'Give', href: '/give' },
]

export function GlobalNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null)

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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 bg-brand-800">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-display text-lg font-semibold text-white">
          Thrive Vineyard
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-accent-400'
                  : 'text-white hover:text-accent-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          ref={menuButtonRef}
          className="rounded-md p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-800 border-t border-brand-600">
          <nav className="flex flex-col px-4 py-4 gap-4" aria-label="Mobile navigation">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                ref={link.href === navLinks[0].href ? firstMobileLinkRef : undefined}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-accent-400'
                    : 'text-white hover:text-accent-400'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
