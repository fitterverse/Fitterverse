'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LockKeyhole, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(63,209,122,0.16),_transparent_32%),linear-gradient(180deg,#f7fbf8_0%,#eef3ef_100%)] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/92 p-8 shadow-[0_30px_80px_rgba(26,31,28,0.14)] backdrop-blur">
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B0F0D]">
              <svg viewBox="0 0 120 120" width="26" height="26" aria-hidden="true">
                <circle cx="60" cy="60" r="40" fill="none" stroke="#3FD17A" strokeWidth="8" strokeOpacity="0.35" />
                <circle cx="88.28" cy="31.72" r="10" fill="#3FD17A" />
                <path d="M42 28 H86 V46 H58 V56 H80 V74 H58 V92 H42 Z" fill="#3FD17A" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-gray-400">Internal CRM</p>
              <h1 className="text-3xl font-bold text-gray-900">Fitterverse</h1>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Sign in with your team email and password to access member operations and the new social planner.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Email">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="team@fitterverse.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </Field>

          <Field label="Password">
            <div className="relative">
              <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B0F0D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#151b18] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-[#3FD17A]/18 bg-[#3FD17A]/8 px-4 py-3 text-xs text-gray-600">
          Team accounts are created by an admin from the CRM Team section.
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}
