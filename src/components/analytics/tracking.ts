// Tracking must never fire on Preview, local dev or tests (it would pollute live
// analytics and ad conversions), so it is enabled only for the Vercel production env.
export function isTrackingEnabled(vercelEnv: string | undefined): boolean {
  return vercelEnv === 'production'
}
