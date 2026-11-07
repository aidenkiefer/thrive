import Link from 'next/link'
import { Container, PageHeader, Section } from '@/components/ui'
import { getGroups } from '@/lib/queries/groups'

export const revalidate = 60

export default async function GroupsPage() {
  const groups = await getGroups()
  return <Section background="light"><Container>
    <PageHeader title="Groups" />
    {groups.length === 0 ? <p className="mt-6 text-neutral-600">No groups are listed right now.</p> :
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{groups.map(group =>
        <Link key={group.id} href={`/groups/${group.slug}`} className="rounded-lg border bg-white p-5 hover:shadow-sm">
          <h2 className="font-display text-xl font-semibold">{group.name}</h2>
          {group.short_summary && <p className="mt-2 text-sm text-neutral-600">{group.short_summary}</p>}
          {group.meeting_schedule && <p className="mt-3 text-sm">{group.meeting_schedule}</p>}
        </Link>)}</div>}
  </Container></Section>
}
