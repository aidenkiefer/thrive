// Individual event page — works for both recurring_events and one_time_events
// Slug checked against recurring_events first, then one_time_events
// ISR revalidate: 60s

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function EventPage({ params }: Props) {
  const { slug } = await params

  return (
    <div>
      {/* TODO: Fetch from recurring_events or one_time_events by slug */}
      {/* TODO: Next occurrence date(s) from event_occurrences */}
      {/* TODO: ChurchSuite signup button (churchsuite_form_url) */}
      {/* TODO: Description, contact, image */}
      <h1>Event: {slug}</h1>
    </div>
  )
}
