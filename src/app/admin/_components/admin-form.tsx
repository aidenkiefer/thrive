'use client'

import { useTransition, type ComponentProps, type FormEvent } from 'react'

type AdminFormProps = Omit<ComponentProps<'form'>, 'action' | 'onSubmit'> & {
  action: (formData: FormData) => Promise<void>
}

/**
 * An admin form that keeps what the editor typed when a save is rejected.
 *
 * React 19 resets a `<form action={…}>` after its action runs, so a rejected
 * save (which redirects back with ?error=…) used to come back with the typed
 * values gone. Submitting from onSubmit skips that reset: the values stay in the
 * browser's inputs, and nothing is copied into the URL or any storage.
 *
 * After a successful save the page gives the form a new `key`
 * (`formInstanceKey`), so it remounts with the saved data, or blank for "new".
 * Without JavaScript the form still posts to the same server action.
 */
export function AdminForm({ action, children, ...props }: AdminFormProps) {
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      await action(formData)
    })
  }

  return (
    <form {...props} action={action} onSubmit={submit} aria-busy={pending}>
      {children}
    </form>
  )
}
