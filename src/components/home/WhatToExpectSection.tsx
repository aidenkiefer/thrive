import { SERVICE_TIMES } from '@/lib/constants/service-times'
import { Band } from '@/components/content/Band'
import { SectionIntro } from '@/components/content/SectionIntro'
import { Button } from '@/components/ui'

/**
 * "What to expect" teaser: the audited five steps, compact.
 * Source: docs/audit/2026-11/pages/plan-a-visit.md ("5 Steps if you're new to Thrive").
 * Step 1 service names/times come from SERVICE_TIMES (pause state is never hardcoded).
 * Step 3 and step 5 wording is the audited copy (step 3 lightly shortened).
 * Not carried forward: any age bands, ID/pickup, parking or visitor-URL claims.
 */
export function WhatToExpectSection() {
  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: 'Pick a service time',
      body: (
        <ul className="space-y-2">
          {SERVICE_TIMES.map((s) => (
            <li key={s.name}>
              <span className="font-medium text-neutral-950">{s.time}</span> {s.name}
              {s.isPaused && s.pauseNote ? (
                <span className="mt-0.5 block text-xs text-neutral-600">{s.pauseNote}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ),
    },
    { title: 'Map it', body: <p>Find directions to Thrive Vineyard on the map below.</p> },
    {
      title: 'Check in your kids',
      // Source: plan-a-visit.md step 3 (shortened)
      body: (
        <p>
          Stop by the children&rsquo;s ministry gate downstairs across from the cafe. Plan to arrive about 10-15
          minutes early.
        </p>
      ),
    },
    {
      title: 'Join the service',
      // Source: plan-a-visit.md step 4 (family worship line)
      body: <p>Our family worship service offers full programming for all ages of kids.</p>,
    },
    {
      title: 'Say, \u201cI\u2019m new!\u201d',
      // Source: plan-a-visit.md step 5 (shortened)
      body: <p>Volunteers at every entrance are ready to help you find your way, and they&rsquo;ll have a gift for you.</p>,
    },
  ]

  return (
    <Band tone="blush" prose={false}>
      <SectionIntro
        eyebrow="What to expect"
        title="5 steps if you're new to Thrive"
        // Source: plan-a-visit.md heading "5 Steps if you're new to Thrive:"
      />
      <ol className="reveal-stagger mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col rounded-2xl bg-neutral-0 p-5 shadow-sm ring-1 ring-black/5"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 font-display text-lg font-semibold text-white"
            >
              {i + 1}
            </span>
            <h3 className="mt-4 font-display text-base font-semibold uppercase tracking-wide text-neutral-950">
              {step.title}
            </h3>
            <div className="mt-2 text-sm leading-relaxed text-neutral-600">{step.body}</div>
          </li>
        ))}
      </ol>
      <div className="mt-10">
        <Button href="/plan-a-visit" variant="primary" className="min-h-11 px-6">
          See the full visitor guide
        </Button>
      </div>
    </Band>
  )
}
