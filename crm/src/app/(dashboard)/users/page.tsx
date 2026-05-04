import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Flame, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface SearchParams { q?: string }

async function getUsers(q?: string) {
  const supabase = createClient()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, created_at, onboarding_completed')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: profiles } = await query

  if (!profiles?.length) return []

  const ids = profiles.map(p => p.id)
  const { data: streaks } = await supabase
    .from('user_streaks')
    .select('user_id, current_streak, last_updated')
    .in('user_id', ids)

  const streakMap = Object.fromEntries((streaks ?? []).map(s => [s.user_id, s]))

  return profiles.map(p => ({
    ...p,
    streak: streakMap[p.id] ?? null,
  }))
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q } = await searchParams
  const users = await getUsers(q)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} members</p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Streak</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Active</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Onboarded</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{user.full_name || '—'}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{user.email}</p>
                </td>
                <td className="px-5 py-4">
                  {user.streak?.current_streak ? (
                    <div className="flex items-center gap-1">
                      <Flame size={14} className="text-orange-400" />
                      <span className="font-medium text-gray-800">{user.streak.current_streak}d</span>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-500">
                  {user.streak?.last_updated
                    ? format(new Date(user.streak.last_updated), 'MMM d, yyyy')
                    : '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.onboarding_completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.onboarding_completed ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/users/${user.id}`}
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
