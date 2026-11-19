'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type Step = 'email' | 'code'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin-login/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (response.status === 429) {
        setError('Too many requests. Wait a few minutes and try again.')
      } else if (!response.ok) {
        setError('Could not send a code. Try again.')
      } else {
        setStep('code')
        setNotice('If that email is registered for staff access, a code is on its way. It expires soon.')
      }
    } catch {
      setError('Could not send a code. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const code = String(new FormData(event.currentTarget).get('code') ?? '')
    const result = await signIn('staff-code', { email, code, redirect: false })
    setBusy(false)
    if (!result?.ok) {
      setError('That code did not work. Check it, or request a new one.')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  function startOver() {
    setStep('email')
    setError('')
    setNotice('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">Admin Login</h1>
        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <label className="block text-sm font-medium">Staff email
              <input name="email" type="email" autoComplete="username" required value={email}
                onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="rounded bg-brand-800 px-4 py-2 text-white disabled:opacity-50">
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            {notice && <p role="status" className="text-sm text-neutral-700">{notice}</p>}
            <label className="block text-sm font-medium">One-time code
              <input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}"
                required autoFocus className="mt-1 block w-full rounded border p-2 tracking-widest" />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy} className="rounded bg-brand-800 px-4 py-2 text-white disabled:opacity-50">
                {busy ? 'Checking…' : 'Sign in'}
              </button>
              <button type="button" disabled={busy} onClick={() => requestCode()} className="text-sm underline disabled:opacity-50">
                Send a new code
              </button>
              <button type="button" onClick={startOver} className="text-sm underline">Use a different email</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
