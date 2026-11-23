'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'

import { PageTransition } from '@/components/layout/PageTransition'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

import { AdminIcon } from './AdminIcon'
import { adminSectionGroups, type AdminIconName } from './admin-sections'

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: AdminIconName
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 ${
        active
          ? 'bg-white/[0.12] text-white shadow-[inset_2px_0_0_theme(colors.accent.400)]'
          : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <AdminIcon
        name={icon}
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-accent-300' : 'text-white/50 group-hover:text-white/80'}`}
      />
      {label}
    </Link>
  )
}

function SidebarContents({ pathname }: { pathname: string }) {
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <nav aria-label="Admin navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavLink href="/admin" icon="home" label="Dashboard" active={isActive('/admin')} />
        {adminSectionGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.sections.map((section) => (
                <NavLink
                  key={section.href}
                  href={section.href}
                  icon={section.icon}
                  label={section.label}
                  active={isActive(section.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-white/10 px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <AdminIcon name="external" className="h-[18px] w-[18px] text-white/50" />
          View live site
        </a>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <AdminIcon name="logout" className="h-[18px] w-[18px] text-white/50" />
          Sign out
        </button>
      </div>
    </>
  )
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300">
      <Image src="/images/brand/thrive-mark.webp" alt="" width={512} height={512} className="h-9 w-9" priority />
      <span className="leading-tight">
        <span className="block font-display text-base font-semibold text-white">Thrive Vineyard</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-accent-300">Admin</span>
      </span>
    </Link>
  )
}

/** Admin chrome: a navy sidebar on desktop and a top bar with a drawer on small screens. The login page renders bare. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div className="admin-ui min-h-screen bg-neutral-100 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-brand-800 to-brand-900 lg:flex">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 py-5 pl-5 pr-3">
          <Brand />
          <ThemeToggle />
        </div>
        <SidebarContents pathname={pathname} />
      </aside>

      <header className="sticky top-0 z-40 bg-brand-800 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-nav"
              aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
            >
              <AdminIcon name={menuOpen ? 'close' : 'menu'} className="h-6 w-6" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="admin-mobile-nav" className="drawer-in flex max-h-[calc(100vh-4rem)] flex-col border-t border-white/10 bg-brand-900">
            <SidebarContents pathname={pathname} />
          </div>
        )}
      </header>

      <main id="admin-main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageTransition className="mx-auto max-w-5xl">{children}</PageTransition>
      </main>
    </div>
  )
}
