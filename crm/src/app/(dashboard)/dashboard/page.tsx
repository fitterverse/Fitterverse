import { getSession } from '@/server/session'
import { getDashboardStats } from '@/features/dashboard/server/queries'
import { Users, Flame, UtensilsCrossed, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  const stats = await getDashboardStats()
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {session!.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users size={20} className="text-blue-500" />}
          label="Total Users"
          value={stats.totalUsers}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-green-500" />}
          label="Active Today"
          value={stats.activeToday}
          bg="bg-green-50"
        />
        <StatCard
          icon={<UtensilsCrossed size={20} className="text-purple-500" />}
          label="Total Meals Logged"
          value={stats.totalMeals}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<Flame size={20} className="text-orange-500" />}
          label="Users Active Today"
          value={`${stats.totalUsers > 0 ? Math.round((stats.activeToday / stats.totalUsers) * 100) : 0}%`}
          bg="bg-orange-50"
        />
      </div>

      {/* Top streaks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Top Streaks Today</h2>
        {stats.topStreaks.length === 0 ? (
          <p className="text-sm text-gray-400">No streak data yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.topStreaks.map((row, i) => (
              <div key={row.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-600 font-mono">{row.user_id.slice(0, 8)}…</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-sm font-semibold text-gray-800">{row.current_streak} days</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  bg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
