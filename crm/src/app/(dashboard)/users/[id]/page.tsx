import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Flame, Award, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const RATING_COLORS: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  junk: 'bg-red-100 text-red-600',
  skipped: 'bg-gray-100 text-gray-500',
}

const MEAL_POINTS: Record<string, number> = {
  healthy: 3,
  medium: 2,
  junk: 1,
  skipped: 3,
}

async function getUserDetail(id: string) {
  const supabase = createClient()

  const [
    { data: profile },
    { data: streak },
    { data: badges },
    { data: recentMeals },
    { data: dailyScores },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', id).single(),
    supabase.from('user_badges').select('badge_slug, earned_at').eq('user_id', id),
    supabase
      .from('meal_logs')
      .select('date, meal_type, rating, note, points')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('daily_scores')
      .select('date, total_points, is_streak_day')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .limit(14),
  ])

  return { profile, streak, badges, recentMeals, dailyScores }
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile, streak, badges, recentMeals, dailyScores } = await getUserDetail(id)

  if (!profile) notFound()

  const groupedMeals = (recentMeals ?? []).reduce<Record<string, typeof recentMeals>>((acc, meal) => {
    if (!meal) return acc
    const d = meal.date
    if (!acc[d]) acc[d] = []
    acc[d]!.push(meal)
    return acc
  }, {})

  return (
    <div className="p-8">
      <Link
        href="/users"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Unnamed User'}</h1>
          <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
          <p className="text-gray-400 text-xs mt-1">
            Joined {format(new Date(profile.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          profile.onboarding_completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {profile.onboarding_completed ? 'Onboarded' : 'Not onboarded'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="space-y-4">
          {/* Streak card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-orange-400" />
              <h3 className="font-semibold text-gray-800 text-sm">Streak</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{streak?.current_streak ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">current days</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Best: <span className="font-medium text-gray-800">{streak?.longest_streak ?? 0} days</span>
              </p>
            </div>
          </div>

          {/* Profile details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Profile</h3>
            <dl className="space-y-2">
              {[
                ['Goal', profile.diet_goal],
                ['Age', profile.age ? `${profile.age} yrs` : null],
                ['Weight', profile.weight_kg ? `${profile.weight_kg} kg` : null],
                ['Height', profile.height_cm ? `${profile.height_cm} cm` : null],
                ['Activity', profile.activity_level],
              ].map(([label, val]) => val ? (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-xs font-medium text-gray-700 capitalize">{val as string}</dd>
                </div>
              ) : null)}
            </dl>
          </div>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-yellow-500" />
                <h3 className="font-semibold text-gray-800 text-sm">Badges</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <span key={b.badge_slug} className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full font-medium">
                    {b.badge_slug.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col — meal history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Daily scores */}
          {dailyScores && dailyScores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-blue-400" />
                <h3 className="font-semibold text-gray-800 text-sm">Last 14 Days</h3>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {dailyScores.map(day => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.total_points}pts`}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                      day.is_streak_day
                        ? 'bg-green-500 text-white'
                        : day.total_points >= 3
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {day.total_points}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Green = streak day (≥6 pts). Each box = 1 day.</p>
            </div>
          )}

          {/* Meal log */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Recent Meals</h3>
            {Object.keys(groupedMeals).length === 0 ? (
              <p className="text-sm text-gray-400">No meals logged yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedMeals).slice(0, 7).map(([date, meals]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      {format(new Date(date), 'EEE, MMM d')}
                    </p>
                    <div className="space-y-1.5">
                      {meals?.map(meal => (
                        <div key={meal.meal_type} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-16 capitalize">{meal.meal_type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RATING_COLORS[meal.rating ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                            {meal.rating}
                          </span>
                          <span className="text-xs text-gray-400">{MEAL_POINTS[meal.rating ?? ''] ?? 0} pts</span>
                          {meal.note && (
                            <span className="text-xs text-gray-400 truncate max-w-[160px]">{meal.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
