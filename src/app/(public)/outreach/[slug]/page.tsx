// Individual outreach initiative page
// Data: outreach table by slug
// ISR revalidate: 60s

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function OutreachDetailPage({ params }: Props) {
  const { slug } = await params

  return (
    <div>
      {/* TODO: Initiative description, image, dates */}
      {/* TODO: Volunteer signup link (churchsuite_form_url or volunteer_signup_url) */}
      <h1>Outreach: {slug}</h1>
    </div>
  )
}
