/**
 * Ministry display cases for MinistryScheduleSignup
 * (src/components/ministries/MinistryScheduleSignup.tsx). Values are synthetic,
 * not church content: schedule text is plainly labelled and never a real time.
 *
 * The configured form URL keeps a real ChurchSuite hostname family on purpose:
 * isApprovedFormUrl (src/lib/form-urls.ts) only approves https hosts under
 * churchsuite.com (or Google Forms), so an invalid TLD or .example domain would
 * fail the allowlist and defeat the "approved" case. It uses the generic
 * `example` subdomain and an `/example` path, not Thrive's real subdomain or a
 * real form.
 */
export const ministryDisplayCases = {
  configured: {
    schedule_description: 'Synthetic fixture: sample schedule',
    churchsuite_form_url: 'https://example.churchsuite.com/forms/example',
  },
  absent: {
    schedule_description: null,
    churchsuite_form_url: null,
  },
  rejected: {
    schedule_description: 'Synthetic fixture: schedule shown, form rejected',
    churchsuite_form_url: 'https://churchsuite.com.evil.example/forms/example',
  },
} as const
