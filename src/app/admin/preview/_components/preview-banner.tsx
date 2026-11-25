import Link from 'next/link'

/**
 * Sits above an admin preview so nobody mistakes it for the live page.
 * Drafts say "Preview — not published"; published records say so and link to the live page.
 */
export function PreviewBanner({ published, editHref, editLabel, liveHref, notes = [] }: {
  published: boolean
  editHref: string
  editLabel: string
  liveHref?: string
  notes?: string[]
}) {
  return (
    <div role="note" aria-label="Preview status" className="rounded-xl border-2 border-dashed border-accent-400 bg-accent-50 p-4 text-sm text-neutral-800">
      <p className="text-base font-semibold text-neutral-950">
        {published ? 'Preview — this is published' : 'Preview — not published'}
      </p>
      <p className="mt-1">
        {published
          ? 'This is how the record looks on the public site right now.'
          : 'Only signed-in staff can see this. The public will see it like this once you publish it.'}
      </p>
      {notes.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{notes.map(note => <li key={note}>{note}</li>)}</ul>}
      <p className="mt-3 flex flex-wrap gap-3">
        <Link href={editHref} className="inline-flex min-h-10 items-center rounded bg-brand-800 px-4 py-2 font-medium text-white">{editLabel}</Link>
        {published && liveHref && <Link href={liveHref} className="inline-flex min-h-10 items-center rounded border px-4 py-2 font-medium">View live page</Link>}
      </p>
    </div>
  )
}
