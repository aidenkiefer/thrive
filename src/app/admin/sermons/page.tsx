// Admin — sermon list
// Data: sermons table joined with speakers and sermon_series, ordered by preached_at DESC
// Links to /admin/sermons/new and /admin/sermons/[id]/edit

export default function AdminSermonsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sermons</h1>
        {/* TODO: Link to /admin/sermons/new */}
      </div>
      {/* TODO: Table of sermons — title, speaker, series, date, published status */}
      {/* TODO: Edit / unpublish actions per row */}
    </div>
  )
}
