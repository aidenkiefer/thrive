// Individual group page
// Data: groups table by slug
// ISR revalidate: 60s

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function GroupPage({ params }: Props) {
  const { slug } = await params

  return (
    <div>
      {/* TODO: Group header (name, image, category) */}
      {/* TODO: Meeting schedule, location, leader, contact */}
      {/* TODO: ChurchSuite signup button */}
      {/* TODO: is_open badge */}
      <h1>Group: {slug}</h1>
    </div>
  )
}
