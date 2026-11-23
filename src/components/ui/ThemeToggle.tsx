'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/theme/preferences'

type ThemeToggleTone = 'onDark' | 'onLight'

const toneClasses: Record<ThemeToggleTone, string> = {
  onDark: 'text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-accent-300',
  onLight:
    'bg-neutral-0/90 text-brand-800 shadow-soft ring-1 ring-neutral-200 backdrop-blur hover:bg-neutral-0 focus-visible:ring-brand-600',
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

/** Light/dark switch. Follows the system setting until the visitor picks one. */
export function ThemeToggle({ tone = 'onDark', className = '' }: { tone?: ThemeToggleTone; className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(event: MediaQueryListEvent) {
      try { if (localStorage.getItem(THEME_STORAGE_KEY)) return } catch {}
      applyTheme(event.matches)
      setDark(event.matches)
    }
    query.addEventListener('change', onSystemChange)
    return () => { query.removeEventListener('change', onSystemChange); observer.disconnect() }
  }, [])

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const next = !document.documentElement.classList.contains('dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light')
    } catch {}

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next)
      setDark(next)
      return
    }

    // Reveal the new theme as a circle growing from the button.
    const x = event.clientX || window.innerWidth / 2
    const y = event.clientY || 0
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(() => {
      applyTheme(next)
      setDark(next)
    })
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark ?? undefined}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${toneClasses[tone]} ${className}`}
    >
      {/* Both icons render; CSS picks one, so the server markup never mismatches the stored theme. */}
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="dark:hidden">
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
      </svg>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="hidden dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  )
}
