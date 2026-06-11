// Admin — announcements list
// Announcements have expires_at and is_homepage_feature flags

export default function AdminAnnouncementsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {/* TODO: Link to /admin/announcements/new */}
      </div>
      {/* TODO: Table — title, homepage feature (Y/N), expires_at, published */}
      {/* TODO: Highlight expired announcements */}
    </div>
  )
}
