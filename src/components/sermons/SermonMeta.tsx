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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
        {speaker && <span className="font-medium text-neutral-950">{speaker.name}</span>}
        {date && <span>{date}</span>}
        {series && (
          <span className="text-brand-600">{series.title}</span>
        )}
      </div>

      {scriptureReferences && scriptureReferences.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {scriptureReferences.map(ref => (
            <span key={ref} className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-800">
              {ref}
            </span>
          ))}
        </div>
      )}

      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map(topic => (
            <span key={topic} className="inline-flex items-center rounded-full bg-accent-50 px-3 py-0.5 text-xs font-medium text-neutral-700 border border-accent-400">
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
