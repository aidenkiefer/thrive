import Link from 'next/link'
import { AdminSignOut } from '@/components/admin/AdminSignOut'

const links = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Announcements', href: '/admin/announcements' },
  { label: 'Sermons', href: '/admin/sermons' },
  { label: 'One-time events', href: '/admin/events' },
  { label: 'Recurring events', href: '/admin/recurring-events' },
  { label: 'Groups', href: '/admin/groups' },
  { label: 'Ministries', href: '/admin/ministries' },
  { label: 'Campaign pages', href: '/admin/landing-pages' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col md:flex-row">
    <aside className="w-full border-b bg-gray-50 p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <Link href="/admin" className="font-display text-lg font-semibold text-brand-900">Thrive Admin</Link>
      <nav aria-label="Admin navigation" className="mt-5 flex flex-wrap gap-2 md:flex-col">
        {links.map(link => <Link key={link.href} href={link.href} className="rounded px-3 py-2 text-sm text-neutral-800 hover:bg-white">{link.label}</Link>)}
      </nav>
      <AdminSignOut />
    </aside>
    <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
  </div>
}
