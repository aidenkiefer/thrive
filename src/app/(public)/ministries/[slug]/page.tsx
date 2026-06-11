// Ministry landing page
// Data: ministries table by slug
// ISR revalidate: 60s

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function MinistryPage({ params }: Props) {
  const { slug } = await params

  return (
    <div>
      {/* TODO: Ministry name, description, leader, contact */}
      {/* TODO: Related events or groups */}
      <h1>Ministry: {slug}</h1>
    </div>
  )
}
