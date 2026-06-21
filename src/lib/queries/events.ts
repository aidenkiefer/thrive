import { createClient } from '../supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OneTimeEvent {
  id: string
  slug: string
  name: string
  description: string | null
  short_summary: string | null
  category: string | null
  start_datetime: string | null
  end_datetime: string | null
  location: string | null
  venue: string | null
  leader: string | null
  contact_email: string | null
  featured_image_url: string | null
  churchsuite_form_url: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
}

export interface RecurringEvent {
  id: string
  slug: string
  name: string
  description: string | null
  short_summary: string | null
  category: string | null
  recurrence_description: string | null
  typical_time: string | null
  location: string | null
  venue: string | null
  leader: string | null
  contact_email: string | null
  contact_phone: string | null
  featured_image_url: string | null
  gallery_urls: string[] | null
  video_urls: string[] | null
  churchsuite_form_url: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  published_at: string | null
  created_at: string
}

export interface EventOccurrence {
  id: string
  recurring_event_id: string
  start_datetime: string
  end_datetime: string | null
  location: string | null
  notes: string | null
  cancelled: boolean
  created_at: string
  recurring_event: RecurringEvent
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns upcoming one-time events and upcoming occurrences of recurring events.
 * Optionally limited — limit applies separately to each list.
 */
export async function getUpcomingEvents(limit?: number): Promise<{
  oneTime: OneTimeEvent[]
  occurrences: EventOccurrence[]
}> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // One-time events after now, published
  let oneTimeQuery = supabase
    .from('one_time_events')
    .select('*')
    .not('published_at', 'is', null)
    .gt('start_datetime', now)
    .order('start_datetime', { ascending: true })

  if (limit !== undefined) {
    oneTimeQuery = oneTimeQuery.limit(limit)
  }

  // Upcoming occurrences, not cancelled, join published recurring event.
  // No DB-level limit here — the published_at filter runs in JS after fetch
  // to avoid the limit excluding valid published occurrences.
  const occurrencesQuery = supabase
    .from('event_occurrences')
    .select('*, recurring_event:recurring_events(*)')
    .eq('cancelled', false)
    .gt('start_datetime', now)
    .order('start_datetime', { ascending: true })

  const [{ data: oneTimeData, error: oneTimeError }, { data: occurrencesData, error: occurrencesError }] =
    await Promise.all([oneTimeQuery, occurrencesQuery])

  // Filter occurrences to only those whose recurring_event is published, then apply limit
  const allOccurrences = (occurrencesData ?? []) as EventOccurrence[]
  const publishedOccurrences = allOccurrences
    .filter((o) => o.recurring_event && o.recurring_event.published_at !== null)
    .slice(0, limit)

  return {
    oneTime: oneTimeError || !oneTimeData ? [] : (oneTimeData as OneTimeEvent[]),
    occurrences: occurrencesError ? [] : publishedOccurrences,
  }
}

/**
 * Looks up an event by slug — checks one_time_events first, then recurring_events.
 * For recurring events also returns the next upcoming non-cancelled occurrence.
 */
export async function getEventBySlug(slug: string): Promise<{
  event: OneTimeEvent | RecurringEvent | null
  type: 'one_time' | 'recurring' | null
  nextOccurrence: EventOccurrence | null
}> {
  const supabase = await createClient()

  // Try one-time first
  const { data: oneTimeData } = await supabase
    .from('one_time_events')
    .select('*')
    .not('published_at', 'is', null)
    .eq('slug', slug)
    .single()

  if (oneTimeData) {
    return {
      event: oneTimeData as OneTimeEvent,
      type: 'one_time',
      nextOccurrence: null,
    }
  }

  // Try recurring
  const { data: recurringData } = await supabase
    .from('recurring_events')
    .select('*')
    .not('published_at', 'is', null)
    .eq('slug', slug)
    .single()

  if (!recurringData) {
    return { event: null, type: null, nextOccurrence: null }
  }

  const recurring = recurringData as RecurringEvent

  const now = new Date().toISOString()

  const { data: nextOccurrenceData } = await supabase
    .from('event_occurrences')
    .select('*, recurring_event:recurring_events(*)')
    .eq('recurring_event_id', recurring.id)
    .eq('cancelled', false)
    .gt('start_datetime', now)
    .order('start_datetime', { ascending: true })
    .limit(1)
    .single()

  return {
    event: recurring,
    type: 'recurring',
    nextOccurrence: nextOccurrenceData ? (nextOccurrenceData as EventOccurrence) : null,
  }
}
