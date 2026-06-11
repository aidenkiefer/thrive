// Individual sermon page
// Data: sermons table, joined with speakers and sermon_series
// ISR revalidate: 60s
// See: docs/05-content-models.md

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function SermonPage({ params }: Props) {
  const { slug } = await params

  return (
    <div>
      {/* TODO: Fetch sermon by slug from Supabase */}
      {/* TODO: Video/audio player */}
      {/* TODO: Scripture references, speaker, series */}
      <h1>Sermon: {slug}</h1>
    </div>
  )
}
