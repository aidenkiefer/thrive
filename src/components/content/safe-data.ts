import { unstable_rethrow } from 'next/navigation'

/**
 * Run a data fetch for a public page and fall back to an empty value when the
 * backend is unavailable (no Supabase configured, table empty, transient error).
 *
 * Why: during the draft handoff the database may be unseeded or unconfigured on
 * the deployed environment. Pages should still render their designed layout with
 * intentional empty states instead of a 500.
 *
 * Next.js control-flow signals (dynamic rendering, notFound, redirect) are
 * re-thrown so framework behavior is unchanged. Only the error message is logged,
 * never request data.
 */
export async function safely<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (error) {
    unstable_rethrow(error)
    // In production this means missing config or a real outage, so make it loud in the logs.
    const log = process.env.VERCEL_ENV === 'production' ? console.error : console.warn
    log(
      `[public-data] ${label} unavailable; rendering empty state.`,
      error instanceof Error ? error.message : 'unknown error'
    )
    return fallback
  }
}
