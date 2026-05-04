'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'master_coach', label: 'Master Coach' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'sales', label: 'Sales' },
]

export default function NewTeamMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'nutritionist',
    password: '',
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create member')
      toast.success(`${form.full_name} added to the team`)
      router.push('/team')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <Link
        href="/team"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to team
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Add team member</h1>
      <p className="text-gray-500 text-sm mb-8">
        Create a CRM login for a new team member.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-gray-200 p-6">
        <Field label="Full name">
          <input
            required
            placeholder="Priya Sharma"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Work email">
          <input
            type="email"
            required
            placeholder="priya@fitterverse.in"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Role">
          <select
            required
            value={form.role}
            onChange={e => set('role', e.target.value)}
            className="input"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Temporary password">
          <input
            type="password"
            required
            minLength={8}
            placeholder="Min 8 characters"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-400 mt-1">
            Share this with the team member — they can&apos;t change it yet.
          </p>
        </Field>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            {loading ? 'Adding…' : 'Add team member'}
          </button>
          <Link
            href="/team"
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          font-size: 0.875rem;
          background: white;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #22c55e40;
          border-color: #22c55e;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
