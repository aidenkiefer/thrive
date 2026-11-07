'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'), password: form.get('password'), redirect: false,
    })
    setBusy(false)
    if (!result?.ok) {
      setError('Sign-in failed. Check your email and password.')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">Admin Login</h1>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Email
            <input name="email" type="email" autoComplete="username" required className="mt-1 block w-full rounded border p-2" />
          </label>
          <label className="block text-sm font-medium">Password
            <input name="password" type="password" autoComplete="current-password" required className="mt-1 block w-full rounded border p-2" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="rounded bg-brand-800 px-4 py-2 text-white disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
