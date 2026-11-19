/** E4 public ministry display cases. Values are synthetic, not church content. */
export const ministryDisplayCases = {
  configured: {
    schedule_description: 'Sundays at 8:30 AM',
    churchsuite_form_url: 'https://thrivevineyard.churchsuite.com/forms/example',
  },
  absent: {
    schedule_description: null,
    churchsuite_form_url: null,
  },
  rejected: {
    schedule_description: 'Schedule pending confirmation',
    churchsuite_form_url: 'https://churchsuite.com.evil.example/forms/example',
  },
} as const
