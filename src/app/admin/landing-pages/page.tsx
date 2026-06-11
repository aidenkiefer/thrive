// Admin — landing pages for Google Ads campaigns
// Each landing page gets a root-level URL: /[slug]
// Warn on reserved slugs (sermons, events, groups, etc.)

export default function AdminLandingPagesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        {/* TODO: Link to /admin/landing-pages/new */}
      </div>
      {/* TODO: Table — title, slug, linked entity, published */}
      {/* TODO: Warning badge if slug is near a reserved name */}
      {/* TODO: Copy URL button for Google Ads */}
    </div>
  )
}
