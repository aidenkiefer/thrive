import type { Metadata } from 'next'

import { FeedbackForm } from '@/components/forms/FeedbackForm'
import { requireAdmin } from '@/lib/admin-auth'

export const metadata: Metadata = {
  title: 'Send feedback',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

/** #37: staff entry point for website feedback. Reuses the public form, API and email routing. */
export default async function AdminFeedbackPage() {
  await requireAdmin()
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-3 text-accent-600">Website feedback</p>
        <h1>Send feedback</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          Report a problem or suggest an idea for the website.
        </p>
      </header>
      <section className="max-w-2xl rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
        <FeedbackForm initialPagePath="/admin" />
      </section>
    </div>
  )
}
