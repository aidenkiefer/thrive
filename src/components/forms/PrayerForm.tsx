'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import type { FormResult } from './types'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'invalid'; fieldErrors: Record<string, string> }
  | { kind: 'unavailable' }
  | { kind: 'network' }

const fieldClass =
  'mt-1 w-full rounded-md border border-brand-100 bg-neutral-0 px-4 py-2.5 text-neutral-950 placeholder:text-neutral-600 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'
const labelClass = 'block text-sm font-medium text-neutral-800'
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

export function PrayerForm() {
  const formId = useId()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [request, setRequest] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fieldErrors = status.kind === 'invalid' ? status.fieldErrors : {}
  const errorFor = (field: string) => fieldErrors[field]

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!request.trim()) {
      setStatus({ kind: 'invalid', fieldErrors: { request: 'Please enter your prayer request.' } })
      return
    }
    setStatus({ kind: 'submitting' })

    try {
      const response = await fetch('/api/forms/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), request: request.trim(), website }),
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
        setName('')
        setContact('')
        setRequest('')
        setWebsite('')
        return
      }
      if (response.status === 422 && result?.status === 'invalid') {
        setStatus({ kind: 'invalid', fieldErrors: result.fieldErrors })
        return
      }
      // A missing registry route, rate limit, or delivery failure is never a success.
      setStatus({ kind: 'unavailable' })
    } catch {
      setStatus({ kind: 'network' })
    }
  }

  return (
    <form className="relative space-y-6" onSubmit={onSubmit} noValidate aria-busy={status.kind === 'submitting'}>
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        {status.kind === 'sent' ? (
          <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
            Thanks — your prayer request was sent.
          </p>
        ) : null}
        {status.kind === 'unavailable' ? (
          <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            We couldn&apos;t send your request right now. Please try again in a few minutes.
          </p>
        ) : null}
        {status.kind === 'network' ? (
          <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            We couldn&apos;t reach the server. Check your connection and try again.
          </p>
        ) : null}
        {errorFor('form') ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {errorFor('form')}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${formId}-name`} className={labelClass}>Name <span className="font-normal text-neutral-600">(optional)</span></label>
        <Input id={`${formId}-name`} name="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)}
          aria-invalid={Boolean(errorFor('name'))} aria-describedby={errorFor('name') ? `${formId}-name-error` : undefined} />
        {errorFor('name') ? <p id={`${formId}-name-error`} role="alert" className={errorClass}>{errorFor('name')}</p> : null}
      </div>

      <div>
        <label htmlFor={`${formId}-contact`} className={labelClass}>Email or phone <span className="font-normal text-neutral-600">(optional)</span></label>
        <Input id={`${formId}-contact`} name="contact" type="text" value={contact} onChange={event => setContact(event.target.value)}
          aria-invalid={Boolean(errorFor('contact'))} aria-describedby={errorFor('contact') ? `${formId}-contact-error` : undefined} />
        {errorFor('contact') ? <p id={`${formId}-contact-error`} role="alert" className={errorClass}>{errorFor('contact')}</p> : null}
      </div>

      <div>
        <label htmlFor={`${formId}-request`} className={labelClass}>How can we be praying for you</label>
        <textarea id={`${formId}-request`} name="request" rows={6} required value={request}
          onChange={event => setRequest(event.target.value)} className={fieldClass}
          aria-invalid={Boolean(errorFor('request'))} aria-describedby={errorFor('request') ? `${formId}-request-error` : undefined} />
        {errorFor('request') ? <p id={`${formId}-request-error`} role="alert" className={errorClass}>{errorFor('request')}</p> : null}
      </div>

      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off"
          value={website} onChange={event => setWebsite(event.target.value)} />
      </div>

      <Button type="submit" variant="primary" disabled={status.kind === 'submitting'}>
        {status.kind === 'submitting' ? 'Sending…' : 'Send prayer request'}
      </Button>
    </form>
  )
}
