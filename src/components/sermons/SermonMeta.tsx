import Link from 'next/link'

interface SermonMetaProps {
  speaker: { name: string; slug: string } | null
  preachedAt: string | null
  series: { title: string; slug: string } | null
  scriptureReferences: string[] | null
  topics: string[] | null
}

export function SermonMeta({ speaker, preachedAt, series, scriptureReferences, topics }: SermonMetaProps) {
  const date = preachedAt
    ? new Date(preachedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600">
        {speaker && <span className="font-medium text-neutral-950">{speaker.name}</span>}
        {date && <span>{date}</span>}
        {series && (
          <Link
            href={`/sermons/series/${series.slug}`}
            className="inline-flex min-h-11 items-center font-medium text-brand-800 underline-offset-4 hover:text-brand-600 hover:underline"
          >
            Series: {series.title}
          </Link>
        )}
      </div>

      {scriptureReferences && scriptureReferences.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Scripture references">
          {scriptureReferences.map(ref => (
            <li key={ref} className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-800">
              {ref}
            </li>
          ))}
        </ul>
      )}

      {topics && topics.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Topics">
          {topics.map(topic => (
            <li key={topic} className="inline-flex items-center rounded-full border border-accent-400 bg-accent-50 px-3 py-1 text-xs font-medium text-neutral-700">
              {topic}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
