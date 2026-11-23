'use client'

import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

/**
 * Replays a short enter animation whenever the route changes, so moving between
 * similar-looking views reads as a change of state. Skipped on the first page load
 * (heroes have their own entrance). The animation is .page-enter in globals.css.
 */
export function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname()
  const firstPath = useRef(pathname)
  const [navigated, setNavigated] = useState(false)
  if (!navigated && pathname !== firstPath.current) setNavigated(true)

  return (
    <div key={pathname} className={`${navigated ? 'page-enter' : ''} ${className}`}>
      {children}
    </div>
  )
}
