import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-3 text-neutral-600">Manage the content shown across Thrive Vineyard.</p>
      <Link href="/admin/announcements" className="mt-6 inline-block rounded bg-brand-800 px-5 py-3 text-white">
        Manage announcements
      </Link>
    </div>
  )
}
