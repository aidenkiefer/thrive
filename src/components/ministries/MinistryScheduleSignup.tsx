import { isApprovedFormUrl } from '@/lib/form-urls'

/**
 * Public ministry schedule + hosted signup embed.
 *
 * Props keep the C2 source field names so Ops can spread
 * `ministryDisplayCases.{configured,absent,rejected}` from
 * `tests/fixtures/ministry-display.ts` without remapping.
 */
export type MinistryScheduleSignupProps = {
  /** Ministry name used in the iframe accessible title. */
  name: string
  schedule_description: string | null
  churchsuite_form_url: string | null
}

export function MinistryScheduleSignup({
  name,
  schedule_description,
  churchsuite_form_url,
}: MinistryScheduleSignupProps) {
  const schedule =
    typeof schedule_description === 'string' && schedule_description.trim()
      ? schedule_description.trim()
      : null
  const approvedFormUrl = isApprovedFormUrl(churchsuite_form_url)
    ? churchsuite_form_url
    : null

  return (
    <div className="mt-6 border-t border-neutral-200 pt-5">
      <h3 className="font-display text-lg font-semibold text-neutral-950">
        Schedule &amp; signup
      </h3>

      {schedule ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {schedule}
        </p>
      ) : null}

      {approvedFormUrl ? (
        <div className="mt-4 overflow-hidden rounded-md border border-neutral-200 bg-neutral-0">
          <iframe
            src={approvedFormUrl}
            title={`${name} signup form`}
            className="h-[32rem] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Signup details are coming soon.
        </p>
      )}
    </div>
  )
}
