import { requireAdmin } from '@/lib/admin-auth'
import { getMediaAssets } from '@/lib/media/catalog'
import { MediaLibrary } from '@/components/admin/MediaLibrary'

export const metadata = { title: 'Media library' }
export const dynamic = 'force-dynamic'

export default async function MediaLibraryPage() {
  await requireAdmin()
  const assets = await getMediaAssets()
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-3 text-accent-600">Photo library</p>
        <h1>Media library</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">Browse the church photos, artwork and brand images available for the website. Select an image to take a closer look.</p>
        <p className="mt-3 text-sm text-neutral-600">{assets.length} images · Viewing only</p>
      </header>
      <MediaLibrary assets={assets} />
    </div>
  )
}
