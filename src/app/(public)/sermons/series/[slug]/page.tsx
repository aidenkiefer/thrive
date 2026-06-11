// Individual sermon series + its sermons
// Data: sermon_series + sermons where series_id = id
// ISR revalidate: 60s

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params

  return (
    <div>
      {/* TODO: Series header (title, description, thumbnail) */}
      {/* TODO: List of sermons in this series */}
      <h1>Series: {slug}</h1>
    </div>
  )
}
