import { redirect } from 'next/navigation'
import { newFormInstance, parseFormInstance } from '@/lib/admin-form-instance'
import { isAdminInputError } from '@/lib/admin-validation'

/** `created` is the new record's id after a successful "new" save, so the page can link to its preview. */
export type AdminFeedback = { error?: string; saved?: string; form?: string; instance?: string; created?: string }

const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Runs an admin save and reports the result on the form that submitted it.
 * Validation errors (AdminInputError) go back to the page as ?error=…&form=…;
 * anything else (auth redirects, database failures) propagates unchanged.
 * When `save` returns the id of a record created by the "new" form, the success
 * redirect also carries ?created=<id>. Call it after requireAdmin().
 */
export async function saveWithFeedback(path: string, formKey: string, save: () => Promise<void | string>): Promise<never> {
  let savedId: void | string
  try {
    savedId = await save()
  } catch (error) {
    if (isAdminInputError(error)) {
      // No token: the form is not remounted, so the browser keeps what was typed.
      redirect(`${path}?${new URLSearchParams({ error: error.message, form: formKey })}#form-${formKey}`)
    }
    throw error
  }
  // A fresh token remounts only this form with the saved values (or blank for "new").
  const query = new URLSearchParams({ saved: formKey, fi: newFormInstance() })
  if (formKey === 'new' && typeof savedId === 'string' && RECORD_ID.test(savedId)) query.set('created', savedId)
  redirect(`${path}?${query}#form-${formKey}`)
}

/** Reads feedback from page searchParams (Next 15 passes them as a Promise). */
export async function readFeedback(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<AdminFeedback> {
  const params = await searchParams
  const one = (key: string) => (typeof params[key] === 'string' ? (params[key] as string).slice(0, 500) : undefined)
  const error = one('error')
  const saved = one('saved')
  const created = !error && saved === 'new' ? one('created') : undefined
  return {
    error, saved, form: error ? one('form') : saved, instance: saved ? parseFormInstance(params.fi) : undefined,
    ...(created && RECORD_ID.test(created) ? { created } : {}),
  }
}
