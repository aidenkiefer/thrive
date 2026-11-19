import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { formInstanceFromReferer, newFormInstance, parseFormInstance } from '@/lib/admin-form-instance'
import { isAdminInputError } from '@/lib/admin-validation'

export type AdminFeedback = { error?: string; saved?: string; form?: string; instance?: string }

/**
 * Runs an admin save and reports the result on the form that submitted it.
 * Validation errors (AdminInputError) go back to the page as ?error=…&form=…;
 * anything else (auth redirects, database failures) propagates unchanged.
 * Call it after requireAdmin().
 */
export async function saveWithFeedback(path: string, formKey: string, save: () => Promise<void>): Promise<never> {
  try {
    await save()
  } catch (error) {
    if (isAdminInputError(error)) {
      // Carry the current instance token so the form keeps its React key (and typed input).
      const instance = formInstanceFromReferer((await headers()).get('referer'))
      const params = new URLSearchParams({ error: error.message, form: formKey })
      if (instance) params.set('fi', instance)
      redirect(`${path}?${params}#form-${formKey}`)
    }
    throw error
  }
  // A fresh token remounts the form with the saved values (or blank for "new").
  redirect(`${path}?${new URLSearchParams({ saved: formKey, fi: newFormInstance() })}#form-${formKey}`)
}

/** Reads feedback from page searchParams (Next 15 passes them as a Promise). */
export async function readFeedback(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<AdminFeedback> {
  const params = await searchParams
  const one = (key: string) => (typeof params[key] === 'string' ? (params[key] as string).slice(0, 500) : undefined)
  const error = one('error')
  const saved = one('saved')
  return { error, saved, form: error ? one('form') : saved, instance: parseFormInstance(params.fi) }
}
