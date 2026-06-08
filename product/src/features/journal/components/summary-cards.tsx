'use client'

import type { DailyNutritionSummary, NutritionTargets } from '@/shared/types'

interface SummaryCardsProps {
  summary: DailyNutritionSummary
  targets: NutritionTargets
  remainingCalories: number
}

export function SummaryCards({ summary, targets, remainingCalories }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 max-[359px]:grid-cols-1">
      <SummaryCard
        icon="🔥"
        title="Calories"
        rows={[
          { label: 'Food', value: formatInteger(summary.food_calories), detail: 'kcal' },
          { label: 'Exercise', value: formatInteger(summary.exercise_calories), detail: 'burned' },
          { label: 'Remaining', value: formatInteger(remainingCalories), detail: 'left', emphasize: true },
        ]}
      />

      <SummaryCard
        icon="◔"
        iconClassName="text-fuchsia-500"
        title="Macros"
        rows={[
          { label: 'Carbs', value: formatMetric(summary.carbs_g), detail: `of ${formatInteger(targets.carbs_g)}g` },
          { label: 'Protein', value: formatMetric(summary.protein_g), detail: `of ${formatInteger(targets.protein_g)}g` },
          { label: 'Fat', value: formatMetric(summary.fat_g), detail: `of ${formatInteger(targets.fat_g)}g` },
        ]}
      />
    </div>
  )
}

function SummaryCard({
  icon,
  iconClassName,
  title,
  rows,
}: {
  icon: string
  iconClassName?: string
  title: string
  rows: Array<{
    label: string
    value: string
    detail: string
    emphasize?: boolean
  }>
}) {
  return (
    <section className="rounded-[1.65rem] bg-[#eaf0ff] px-4 py-4 shadow-sm ring-1 ring-slate-200/60">
      <div className="flex items-center gap-2">
        <span className={`text-lg ${iconClassName ?? ''}`}>{icon}</span>
        <h2 className="text-[1.2rem] font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/45 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {row.label}
              </p>
              <p className="mt-0.5 text-[0.76rem] text-slate-500">{row.detail}</p>
            </div>
            <p
              className={`shrink-0 text-[1.18rem] leading-none tracking-tight text-slate-900 tabular-nums ${
                row.emphasize ? 'font-semibold' : 'font-medium'
              }`}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function formatInteger(value: number) {
  return Math.round(value).toLocaleString()
}

function formatMetric(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)
}
