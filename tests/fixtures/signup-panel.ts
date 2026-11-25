/**
 * Synthetic signup cases for SignupPanel and the signup-form helpers
 * (src/components/signup/*). Values are not church content: no real Thrive
 * subdomain, no real form id, no invented live URL.
 *
 * `isApprovedFormUrl` (src/lib/form-urls.ts) only approves https hosts under
 * churchsuite.com or Google Forms, so the "live" cases use a generic `sample.`
 * subdomain / a plainly synthetic id. The "demo" cases use an `example.` host
 * or a `demo` sentinel so isDemoFormUrl flags them as development fixtures.
 */
export const signupFormUrls = {
  churchsuiteLive: 'https://sample.churchsuite.com/events/synthetic1234',
  googleLive: 'https://docs.google.com/forms/d/e/SYNTHETICTESTID/viewform',
  googleDemo: 'https://docs.google.com/forms/d/e/thrive-demo-id/viewform',
  churchsuiteDemo: 'https://example.churchsuite.com/forms/synthetic',
  googleEditor: 'https://docs.google.com/forms/d/SYNTHETICTESTID/edit',
  googleResponses: 'https://docs.google.com/forms/d/SYNTHETICTESTID/responses',
  rejected: 'https://churchsuite.com.evil.example/forms/synthetic',
  notAUrl: 'not a url at all',
} as const
