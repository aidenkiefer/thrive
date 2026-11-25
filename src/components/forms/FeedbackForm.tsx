'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import type { FeedbackCategory, FormResult } from './types'

export interface FeedbackFormProps {
  /** Optional site path context (for example `/events`). Must be a path if set. */
  initialPagePath?: string
  className?: string
}

type FieldKey = 'category' | 'message' | 'replyEmail' | 'pagePath' | 'form'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'invalid'; fieldErrors: Record<string, string> }
  | { kind: 'unavailable' }
  | { kind: 'network' }

const fieldClass =
  'mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-neutral-950 shadow-sm placeholder:text-neutral-500 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'
const labelClass = 'block text-sm font-medium text-neutral-800'
const helpClass = 'mt-1 text-sm text-neutral-600'
const errorClass = 'mt-1 text-sm text-red-800'

function readResult(payload: unknown): FormResult | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const status = (payload as { status?: unknown }).status
  if (status === 'sent' || status === 'unavailable') return { status }
  if (status === 'invalid') {
    const fieldErrors = (payload as { fieldErrors?: unknown }).fieldErrors
    if (!fieldErrors || typeof fieldErrors !== 'object' || Array.isArray(fieldErrors)) {
      return { status: 'invalid', fieldErrors: { form: 'Please check the form and try again.' } }
    }
    const cleaned: Record<string, string> = {}
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (typeof value === 'string' && value.trim()) cleaned[key] = value
    }
    return { status: 'invalid', fieldErrors: cleaned }
  }
  return null
}

export function FeedbackForm({ initialPagePath = '', className = '' }: FeedbackFormProps) {
  const formId = useId()
  const [category, setCategory] = useState<FeedbackCategory | ''>('')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [pagePath, setPagePath] = useState(initialPagePath)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const formRef = useRef<HTMLFormElement>(null)

  // The submit button is disabled while sending, which drops keyboard focus to <body>.
  useEffect(() => {
    if (status.kind === 'idle' || status.kind === 'submitting') return
    const form = formRef.current
    if (!form || (document.activeElement && document.activeElement !== document.body)) return
    const invalidField =
      status.kind === 'invalid'
        ? form.querySelector<HTMLElement>('fieldset[aria-describedby] input, [aria-invalid="true"]')
        : null
    ;(invalidField ?? form.querySelector<HTMLElement>('button[type="submit"]'))?.focus()
  }, [status])

  const fieldErrors = status.kind === 'invalid' ? status.fieldErrors : {}
  const errorFor = (key: FieldKey) => fieldErrors[key]
  const describedBy = (key: FieldKey, helpId?: string) => {
    const parts = [errorFor(key) ? `${formId}-${key}-error` : null, helpId].filter(Boolean)
    return parts.length ? parts.join(' ') : undefined
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus({ kind: 'submitting' })

    const body = {
      category,
      message,
      replyEmail: replyEmail.trim() || undefined,
      pagePath: pagePath.trim() || undefined,
      website,
    }

    try {
      const response = await fetch('/api/forms/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })

      let payload: unknown = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      const result = readResult(payload)

      if (response.ok && result?.status === 'sent') {
        setStatus({ kind: 'sent' })
        setCategory('')
        setMessage('')
        setReplyEmail('')
        setPagePath(initialPagePath)
        setWebsite('')
        return
      }

      if (response.status === 422 && result?.status === 'invalid') {
        setStatus({ kind: 'invalid', fieldErrors: result.fieldErrors })
        return
      }

      if (result?.status === 'unavailable' || response.status === 503 || response.status === 429) {
        setStatus({ kind: 'unavailable' })
        return
      }

      // 404 (API not integrated yet), 413, or unexpected payloads stay as errors — never fake success.
      setStatus({ kind: 'unavailable' })
    } catch {
      setStatus({ kind: 'network' })
    }
  }

  return (
    <form
      ref={formRef}
      className={`relative space-y-6 ${className}`}
      onSubmit={onSubmit}
      noValidate
      aria-busy={status.kind === 'submitting'}
    >
      <div
        aria-live="polite"
        aria-atomic="true"
        className="space-y-3"
      >
        {status.kind === 'sent' ? (
          <p role="status" className="rounded-xl border border-success-600/25 bg-success-50 p-3 text-sm text-success-700">
            Thanks — your message was sent.
          </p>
        ) : null}
        {status.kind === 'unavailable' ? (
          <p role="alert" className="rounded-xl border border-warning-600/25 bg-warning-50 p-3 text-sm text-warning-700">
            We couldn&apos;t send that right now. Please try again in a few minutes.
          </p>
        ) : null}
        {status.kind === 'network' ? (
          <p role="alert" className="rounded-xl border border-warning-600/25 bg-warning-50 p-3 text-sm text-warning-700">
            We couldn&apos;t reach the server. Check your connection and try again.
          </p>
        ) : null}
        {errorFor('form') ? (
          <p id={`${formId}-form-error`} role="alert" className="rounded-xl border border-danger-600/25 bg-danger-50 p-3 text-sm text-danger-700">
            {errorFor('form')}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3" aria-describedby={describedBy('category')}>
        <legend className={labelClass}>What are you reporting?</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="radio"
              name="category"
              value="bug"
              checked={category === 'bug'}
              onChange={() => setCategory('bug')}
              className="h-4 w-4 border-brand-100 text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
            Bug or problem
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="radio"
              name="category"
              value="idea"
              checked={category === 'idea'}
              onChange={() => setCategory('idea')}
              className="h-4 w-4 border-brand-100 text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
            Feature idea
          </label>
        </div>
        {errorFor('category') ? (
          <p id={`${formId}-category-error`} role="alert" className={errorClass}>
            {errorFor('category')}
          </p>
        ) : null}
      </fieldset>

      <div>
        <label htmlFor={`${formId}-message`} className={labelClass}>
          Message
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={6}
          required
          value={message}
          onChange={event => setMessage(event.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(errorFor('message'))}
          aria-describedby={describedBy('message', `${formId}-message-help`)}
        />
        <p id={`${formId}-message-help`} className={helpClass}>
          Describe what happened or what you would like to see. Avoid passwords or other private details.
        </p>
        {errorFor('message') ? (
          <p id={`${formId}-message-error`} role="alert" className={errorClass}>
            {errorFor('message')}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${formId}-replyEmail`} className={labelClass}>
          Reply email <span className="font-normal text-neutral-600">(optional)</span>
        </label>
        <Input
          id={`${formId}-replyEmail`}
          name="replyEmail"
          type="email"
          autoComplete="email"
          value={replyEmail}
          onChange={event => setReplyEmail(event.target.value)}
          aria-invalid={Boolean(errorFor('replyEmail'))}
          aria-describedby={describedBy('replyEmail', `${formId}-replyEmail-help`)}
        />
        <p id={`${formId}-replyEmail-help`} className={helpClass}>
          Only if you want a reply. Leave blank to stay anonymous.
        </p>
        {errorFor('replyEmail') ? (
          <p id={`${formId}-replyEmail-error`} role="alert" className={errorClass}>
            {errorFor('replyEmail')}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${formId}-pagePath`} className={labelClass}>
          Page path <span className="font-normal text-neutral-600">(optional)</span>
        </label>
        <Input
          id={`${formId}-pagePath`}
          name="pagePath"
          type="text"
          inputMode="text"
          spellCheck={false}
          placeholder="/events"
          value={pagePath}
          onChange={event => setPagePath(event.target.value)}
          aria-invalid={Boolean(errorFor('pagePath'))}
          aria-describedby={describedBy('pagePath', `${formId}-pagePath-help`)}
        />
        <p id={`${formId}-pagePath-help`} className={helpClass}>
          Site path related to your report, such as /events.
        </p>
        {errorFor('pagePath') ? (
          <p id={`${formId}-pagePath-error`} role="alert" className={errorClass}>
            {errorFor('pagePath')}
          </p>
        ) : null}
      </div>

      {/* Honeypot: leave empty. Hidden from assistive tech and keyboard users. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={event => setWebsite(event.target.value)}
        />
      </div>

      <div>
        <Button type="submit" variant="primary" disabled={status.kind === 'submitting'}>
          {status.kind === 'submitting' ? 'Sending…' : 'Send feedback'}
        </Button>
      </div>
    </form>
  )
}
