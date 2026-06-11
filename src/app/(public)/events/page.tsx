// Events listing — upcoming recurring + one-time events
// Data: event_occurrences (joined with recurring_events) + one_time_events
//       ordered by start_datetime, where start_datetime >= now()
// ISR revalidate: 60s

export const revalidate = 60

export default function EventsPage() {
  return (
    <div>
      {/* TODO: Calendar or list view toggle */}
      {/* TODO: Upcoming event cards */}
      <h1>Events</h1>
    </div>
  )
}
