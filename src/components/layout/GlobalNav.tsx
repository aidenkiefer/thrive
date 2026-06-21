'use client'

import Link from 'next/link'
import { useState } from 'react'

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
              className="text-sm font-medium text-white hover:text-accent-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2 rounded-md"
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
                className="text-base font-medium text-white hover:text-accent-400 transition-colors"
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
