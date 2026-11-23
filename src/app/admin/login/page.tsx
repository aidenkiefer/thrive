'use client'

import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
    try {
      const result = await signIn('staff-code', { email, code, redirect: false })
      if (result?.ok) {
        router.push('/admin')
        router.refresh()
        return
      }
      setError('That code did not work. Check it, or request a new one.')
    } catch {
      setError('Could not check the code. Try again.')
    } finally {
      setBusy(false)
    }
  }

  function startOver() {
    setStep('email')
    setError('')
    setNotice('')
  }

  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-neutral-300 bg-neutral-0 px-3.5 py-3 text-[15px] text-neutral-950 shadow-sm transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15'
  const primaryClass =
    'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25 disabled:cursor-not-allowed disabled:opacity-60'
  const linkClass =
    'text-sm font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-900 disabled:opacity-50'

  return (
    <main id="main-content" className="relative grid min-h-screen bg-neutral-100 lg:grid-cols-[1.05fr_1fr]">
      <ThemeToggle tone="onLight" className="absolute right-4 top-4 z-10" />
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/images/brand/thrive-mark.webp"
          alt=""
          width={512}
          height={512}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 h-[30rem] w-[30rem] opacity-[0.06]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <Image
          src="/images/brand/thrive-wordmark-white.webp"
          alt="Thrive Vineyard Church"
          width={1411}
          height={202}
          priority
          className="relative h-auto w-72"
        />
        <div className="relative max-w-md">
          <p className="eyebrow text-accent-300">Staff admin</p>
          <p className="mt-4 font-display text-4xl font-semibold leading-tight">
            One place for every event, group, and announcement.
          </p>
          <p className="mt-4 text-white/70">Spirit Filled. Down to Earth.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Image
            src="/images/brand/thrive-wordmark-navy.webp"
            alt="Thrive Vineyard Church"
            width={1411}
            height={202}
            priority
            className="mx-auto mb-10 h-auto w-60 dark:hidden lg:hidden"
          />
          <Image
            src="/images/brand/thrive-wordmark-white.webp"
            alt="Thrive Vineyard Church"
            width={1411}
            height={202}
            priority
            className="mx-auto mb-10 hidden h-auto w-60 dark:block lg:!hidden"
          />
          <div className="rounded-3xl bg-neutral-0 p-7 shadow-lift ring-1 ring-neutral-200 sm:p-8">
            <h1 className="font-display text-2xl font-semibold text-brand-900">
              {step === 'email' ? 'Sign in to admin' : 'Check your email'}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-600">
              {step === 'email'
                ? 'We’ll email you a one-time code. No password needed.'
                : `Enter the code we sent to ${email}.`}
            </p>
            {step === 'email' ? (
              <form onSubmit={requestCode} className="mt-6 space-y-5">
                <label className="block text-sm font-medium text-neutral-800">Staff email
                  <input name="email" type="email" autoComplete="username" required value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="you@thrivevineyard.com" className={inputClass} />
                </label>
                {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700">{error}</p>}
                <button type="submit" disabled={busy} className={primaryClass}>
                  {busy ? 'Sending…' : 'Email me a code'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="mt-6 space-y-5">
                {notice && <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{notice}</p>}
                <label className="block text-sm font-medium text-neutral-800">One-time code
                  <input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}"
                    required autoFocus className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`} />
                </label>
                {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700">{error}</p>}
                <button type="submit" disabled={busy} className={primaryClass}>
                  {busy ? 'Checking…' : 'Sign in'}
                </button>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button type="button" disabled={busy} onClick={() => requestCode()} className={linkClass}>
                    Send a new code
                  </button>
                  <button type="button" onClick={startOver} className={linkClass}>Use a different email</button>
                </div>
              </form>
            )}
          </div>
          <p className="mt-8 text-center text-xs text-neutral-500">
            <Link href="/" className="font-medium text-neutral-600 hover:text-brand-800">← Back to thrivevineyard.com</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
