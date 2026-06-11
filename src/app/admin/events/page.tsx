// Admin — events list (recurring + one-time tabs)
// Data: recurring_events + one_time_events
// Links to /admin/events/new and /admin/events/[id]/edit

export default function AdminEventsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        {/* TODO: Link to /admin/events/new */}
      </div>
      {/* TODO: Tabs — Recurring Events | One-Time Events */}
      {/* TODO: Recurring events table — name, recurrence, next occurrence, status */}
      {/* TODO: One-time events table — name, date, location, status */}
    </div>
  )
}
