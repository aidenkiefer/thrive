import { redirect } from 'next/navigation'
import { isAdminInputError } from '@/lib/admin-validation'

export type AdminFeedback = { error?: string; saved?: string; form?: string }

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
      redirect(`${path}?${new URLSearchParams({ error: error.message, form: formKey })}#form-${formKey}`)
    }
    throw error
  }
  redirect(`${path}?${new URLSearchParams({ saved: formKey })}#form-${formKey}`)
}

/** Reads feedback from page searchParams (Next 15 passes them as a Promise). */
export async function readFeedback(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<AdminFeedback> {
  const params = await searchParams
  const one = (key: string) => (typeof params[key] === 'string' ? (params[key] as string).slice(0, 500) : undefined)
  const error = one('error')
  const saved = one('saved')
  return { error, saved, form: error ? one('form') : saved }
}
