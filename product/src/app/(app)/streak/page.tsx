import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { getStreakPageData } from '@/features/journal/server/queries'

export default async function StreakPage() {
  const data = await getStreakPageData()
  const scoreMap = new Map(data.weekScores.map((score) => [score.date, score]))

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-5xl font-semibold text-slate-900">Streak</h1>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-center text-[2rem] font-medium text-slate-900">Logged Days</h2>

        <div className="mt-8 grid grid-cols-2 divide-x divide-slate-200">
          <Metric value={data.streak.current_streak} label="Current Streak" />
          <Metric value={data.streak.longest_streak} label="Longest Streak" />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-center text-[2rem] font-medium text-slate-900">Current Week</h2>

        <div className="mt-8 grid grid-cols-7 gap-2 text-center">
          {data.weekDates.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const score = scoreMap.get(key)
            const isToday = key === format(new Date(), 'yyyy-MM-dd')

            return (
              <div key={key} className="space-y-3">
                <p className="text-lg text-slate-400">{format(day, 'EEE')}</p>
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl font-medium ${
                    isToday
                      ? 'border-slate-300 text-slate-900'
                      : score?.is_streak_day
                        ? 'border-transparent bg-emerald-50 text-slate-900'
                        : 'border-transparent text-slate-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        <div className="my-8 h-px bg-slate-200" />

        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <Metric value={data.caloriesUnderBudget} label="Calories Under Budget" accent />
          <Metric value={data.averageCalories} label="Average Calories" />
        </div>

        <div className="my-8 h-px bg-slate-200" />

        <div className="text-center">
          <p className="text-6xl font-medium text-slate-900">
            {Math.round(Number(data.profile?.weight_kg ?? 0)) || '—'} kg
          </p>
          <p className="mt-3 text-[1.7rem] text-slate-700">Current Weight</p>
        </div>
      </section>
    </div>
  )
}

function Metric({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent?: boolean
}) {
  return (
    <div className="px-6 text-center">
      <p className={`text-7xl font-medium ${accent ? 'text-emerald-500' : 'text-slate-900'}`}>{value}</p>
      <p className="mt-4 text-[1.7rem] leading-tight text-slate-700">{label}</p>
    </div>
  )
}
