import Link from 'next/link'
import { Container, PageHeader, Section } from '@/components/ui'
import { getOutreachItems } from '@/lib/queries/outreach'

export const revalidate = 60

export default async function OutreachPage() {
  const items = await getOutreachItems()
  return <Section background="light"><Container>
    <PageHeader title="Outreach" />
    {items.length === 0 ? <p className="mt-6 text-neutral-600">No outreach initiatives are listed right now.</p> :
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item =>
        <Link key={item.id} href={`/outreach/${item.slug}`} className="rounded-lg border bg-white p-5 hover:shadow-sm">
          <h2 className="font-display text-xl font-semibold">{item.name}</h2>
          {item.short_summary && <p className="mt-2 text-sm text-neutral-600">{item.short_summary}</p>}
          {item.is_ongoing && <p className="mt-3 text-xs font-medium uppercase tracking-wide">Ongoing</p>}
        </Link>)}</div>}
  </Container></Section>
}
