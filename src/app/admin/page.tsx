import { requireAdmin } from '@/lib/admin-auth'
import { adminDb } from '@/lib/admin-db'
import { AdminDashboard, type SectionCounts } from '@/components/admin/AdminDashboard'
import { adminSections, type AdminSection } from '@/components/admin/admin-sections'

export const metadata = { title: 'Dashboard' }

type AdminDb = Awaited<ReturnType<typeof adminDb>>

async function countSection(db: AdminDb, section: AdminSection): Promise<SectionCounts> {
  try {
    const totalQuery = db.from(section.table).select('id', { count: 'exact', head: true })
    const draftQuery = section.publishable
      ? db.from(section.table).select('id', { count: 'exact', head: true }).is('published_at', null)
      : null
    const [total, drafts] = await Promise.all([totalQuery, draftQuery])
    if (total.error || drafts?.error) return null
    return { total: total.count ?? 0, drafts: drafts ? (drafts.count ?? 0) : null }
  } catch {
    return null
  }
}

export default async function AdminDashboardPage() {
  const { email } = await requireAdmin()
  const db = await adminDb().catch(() => null)
  const counts = db ? await Promise.all(adminSections.map((section) => countSection(db, section))) : adminSections.map(() => null)
  return <AdminDashboard email={email} counts={new Map(adminSections.map((section, index) => [section.href, counts[index]]))} />
}
