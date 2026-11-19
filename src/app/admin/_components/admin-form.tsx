'use client'

import { useState, useTransition, type ComponentProps, type FormEvent } from 'react'
import { nextResetState, type ResetState } from '@/lib/admin-form-instance'

type AdminFormProps = Omit<ComponentProps<'form'>, 'action' | 'onSubmit'> & {
  action: (formData: FormData) => Promise<void>
  /** Token from this form's own successful save; a new value remounts only this form. */
  resetToken?: string
}

/**
 * An admin form that keeps what the editor typed when a save is rejected.
 *
 * React 19 resets a `<form action={…}>` after its action runs, so a rejected
 * save (which redirects back with ?error=…) used to come back with the typed
 * values gone. Submitting from onSubmit skips that reset: the values stay in the
 * browser's inputs, and nothing is copied into the URL or any storage.
 *
 * After this form's own successful save the page hands it a new `resetToken`;
 * the form remounts itself with the saved data, or blank for "new". Other forms
 * on the page never see that token, so their unsaved edits survive, and no
 * Referer or URL state is needed. Without JavaScript the form still posts to the same server action.
 */
export function AdminForm({ action, resetToken, children, ...props }: AdminFormProps) {
  const [pending, startTransition] = useTransition()
  // First render adopts the current token (a fresh page load already has saved values).
  const [reset, setReset] = useState<ResetState>({ seen: resetToken, epoch: 0 })
  const next = nextResetState(reset, resetToken)
  if (next !== reset) setReset(next)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      await action(formData)
    })
  }

  return (
    <form key={next.epoch} {...props} action={action} onSubmit={submit} aria-busy={pending}>
      {children}
    </form>
  )
}
