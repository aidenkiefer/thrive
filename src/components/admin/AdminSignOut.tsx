'use client'

import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function AdminSignOut() {
  const pathname = usePathname()
  if (pathname === '/admin/login') return null
  return <button type="button" onClick={() => signOut({ callbackUrl: '/admin/login' })}
    className="mt-6 rounded border px-3 py-2 text-sm text-neutral-700 hover:bg-white">
    Sign out
  </button>
}
