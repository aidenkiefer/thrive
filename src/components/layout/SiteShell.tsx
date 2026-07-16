'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'
import { GlobalNav } from './GlobalNav'

interface SiteShellProps {
  children: React.ReactNode
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    return <main id="main-content" className="min-h-screen">{children}</main>
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-neutral-0 px-4 py-2 font-medium text-brand-800 shadow-sm focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <GlobalNav />
      <main id="main-content" className="min-h-screen" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  )
}
