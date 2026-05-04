'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const ROLES = ['admin', 'master_coach', 'nutritionist', 'trainer', 'sales'] as const

interface Props {
  id: string
  currentRole: string
  isActive: boolean
}

export function RoleToggle({ id, currentRole, isActive }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(updates: { role?: string; is_active?: boolean }) {
    setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to update')
      }
      toast.success('Updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={loading}
        defaultValue={currentRole}
        onChange={e => update({ role: e.target.value })}
        className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white disabled:opacity-50"
      >
        {ROLES.map(r => (
          <option key={r} value={r}>{r.replace('_', ' ')}</option>
        ))}
      </select>
      <button
        disabled={loading}
        onClick={() => update({ is_active: !isActive })}
        className={`text-xs px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${
          isActive
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-green-200 text-green-600 hover:bg-green-50'
        }`}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}
