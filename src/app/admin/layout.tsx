// Admin layout — all routes under /admin are protected by middleware.ts (NextAuth)
// Unauthenticated requests redirect to /admin/login

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: AdminSidebar component */}
      {/* Nav items: Dashboard, Sermons, Series, Events, Groups, Announcements, Staff, Landing Pages, Outreach */}
      <aside className="w-64 border-r bg-gray-50">
        {/* Sidebar placeholder */}
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
