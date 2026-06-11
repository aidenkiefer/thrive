// Groups listing
// Data: groups table where published_at IS NOT NULL
// ISR revalidate: 60s

export const revalidate = 60

export default function GroupsPage() {
  return (
    <div>
      {/* TODO: Category filter (small group, connect group, youth, etc.) */}
      {/* TODO: Group cards — name, schedule, location, leader, signup link */}
      <h1>Groups</h1>
    </div>
  )
}
