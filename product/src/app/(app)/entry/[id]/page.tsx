import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CircleAlert, Droplets, Sparkles } from 'lucide-react'
import { SECONDARY_NUTRIENT_LABELS } from '@/features/journal/lib/constants'
import { buildEntryDetailInsights } from '@/features/journal/lib/entry-detail'
import { getJournalEntryDetail } from '@/features/journal/server/queries'
import type { JournalSecondaryNutrients } from '@/shared/types'

interface EntryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EntryDetailPage(props: EntryDetailPageProps) {
  const params = await props.params
  const data = await getJournalEntryDetail(params.id)

  if (!data) notFound()

  const detail = buildEntryDetailInsights(data.entry, data.analysis)
  const nutrientRows = buildNutrientRows(data.analysis?.secondary_nutrients ?? {})
  const title = data.analysis?.display_title ?? data.entry.display_title ?? 'Entry detail'
  const summary = data.analysis?.summary_text ?? 'No AI summary is available yet.'
  const loggedAt = new Date(data.entry.logged_at)
  const metaChips = data.entry.entry_type === 'food'
    ? [
        detail.structured.estimatedQuantity,
        detail.coach.confidenceNote ? 'AI estimate' : null,
      ].filter((value): value is string => Boolean(value))
    : [
        detail.structured.durationMinutes ? `${Math.round(detail.structured.durationMinutes)} min` : null,
        detail.structured.intensity ? `${capitalize(detail.structured.intensity)} intensity` : null,
        detail.structured.repsOrSets,
      ].filter((value): value is string => Boolean(value))

  const primaryAdvice = data.entry.entry_type === 'food'
    ? [
        detail.coach.nextBestMeal,
        detail.coach.balanceTip,
        detail.coach.hydrationTip,
      ]
    : [
        detail.coach.recoveryTip,
        detail.coach.fuelTip,
        detail.coach.progressionTip,
      ]

  return (
    <div className="mx-auto max-w-[26.5rem] space-y-3.5 pb-10">
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {data.entry.entry_type === 'food' ? 'Food log' : 'Workout log'}
          </p>
          <h1 className="truncate text-[1.65rem] font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
      </div>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
        {data.entry.raw_input_text ? (
          <p className="truncate text-[0.88rem] text-slate-400">{data.entry.raw_input_text}</p>
        ) : null}

        <div className="mt-3 grid gap-2">
          {metaChips.length ? (
            <div className="flex flex-wrap gap-2">
              {metaChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.76rem] font-medium text-slate-600"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <div className={`grid gap-2 ${data.entry.entry_type === 'food' ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <MetricCard label="Calories" value={data.analysis?.calories ?? 0} suffix="" />
            {data.entry.entry_type === 'food' ? (
              <>
                <MetricCard label="Carbs" value={data.analysis?.carbs_g ?? 0} suffix="g" />
                <MetricCard label="Protein" value={data.analysis?.protein_g ?? 0} suffix="g" />
                <MetricCard label="Fat" value={data.analysis?.fat_g ?? 0} suffix="g" />
              </>
            ) : (
              <>
                <MetricCard
                  label="Duration"
                  value={detail.structured.durationMinutes ?? undefined}
                  suffix={detail.structured.durationMinutes ? 'm' : ''}
                  fallback="—"
                />
                <MetricCard
                  label="Intensity"
                  valueLabel={detail.structured.intensity ? capitalize(detail.structured.intensity) : '—'}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[0.82rem] text-slate-500">
          <span>
            {formatServerTime(loggedAt)}
          </span>
          {detail.coach.confidenceNote ? <span>AI estimate</span> : null}
        </div>
      </section>

      {data.entry.entry_type === 'food' && nutrientRows.length > 0 && (
        <section className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-[1.05rem] font-semibold text-slate-900">Deeper Nutrition</h2>
          </div>

          <div>
            {nutrientRows.map(([key, label, value]) => (
              <div
                key={key}
                className="flex items-center justify-between border-b border-slate-200 px-4 py-3 last:border-b-0"
              >
                <span className="text-[0.92rem] text-slate-700">
                  {label}
                </span>
                <span className="text-[0.92rem] font-medium text-slate-900">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-500" />
          <h2 className="text-[1.05rem] font-semibold text-slate-900">AI Summary</h2>
        </div>
        <p className="mt-2.5 text-[0.94rem] leading-6 text-slate-700">{summary}</p>
      </section>

      <AdviceSection
        icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
        title="What Stands Out"
        items={detail.coach.positiveSignals}
        emptyText="The log has been captured cleanly and is ready to build on."
      />

      <AdviceSection
        icon={<CircleAlert className="h-4 w-4 text-amber-500" />}
        title="Watch For"
        items={detail.coach.watchouts}
        emptyText="Nothing major stands out here. Keep the rest of the day consistent."
      />

      <AdviceSection
        icon={<Droplets className="h-4 w-4 text-sky-500" />}
        title={data.entry.entry_type === 'food' ? 'What To Do Next' : 'Recovery & Next Step'}
        items={primaryAdvice.filter((value): value is string => Boolean(value))}
        emptyText="No extra action is needed beyond staying consistent with the next log."
      />

      {(detail.structured.flags.length > 0 || detail.structured.muscleFocus.length > 0) && (
        <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h2 className="text-[1.05rem] font-semibold text-slate-900">Extra Context</h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {[...detail.structured.flags, ...detail.structured.muscleFocus].map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.76rem] font-medium text-slate-600"
              >
                {humanizeFlag(item)}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AdviceSection({
  icon,
  title,
  items,
  emptyText,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
  emptyText: string
}) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-[1.05rem] font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="mt-2.5 space-y-2">
        {(items.length ? items : [emptyText]).map((item) => (
          <p
            key={item}
            className="rounded-2xl bg-slate-50 px-4 py-3 text-[0.92rem] leading-6 text-slate-700"
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  suffix,
  fallback,
  valueLabel,
}: {
  label: string
  value?: number
  suffix?: string
  fallback?: string
  valueLabel?: string
}) {
  const displayValue = valueLabel
    ? valueLabel
    : typeof value === 'number' && Number.isFinite(value)
      ? `${formatNumber(value)}${suffix ?? ''}`
      : fallback ?? '—'

  return (
    <div className="rounded-[1.15rem] bg-slate-50 px-3 py-2.5">
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-[1.2rem] font-semibold leading-none tracking-tight text-slate-900">
        {displayValue}
      </p>
    </div>
  )
}

function formatNumber(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)
}

function formatValue(key: string, value: number) {
  if (!Number.isFinite(value)) return '—'

  const suffix =
    key.endsWith('_g')
      ? 'g'
      : key.endsWith('_mg')
        ? 'mg'
        : key.endsWith('_iu')
          ? 'IU'
          : ''

  return `${formatNumber(value)}${suffix}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function humanizeFlag(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatServerTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function buildNutrientRows(
  nutrients: JournalSecondaryNutrients
): Array<[string, string, string]> {
  const preferredOrder: Array<keyof JournalSecondaryNutrients> = [
    'fiber_g',
    'sugar_g',
    'added_sugar_g',
    'net_carbs_g',
    'saturated_fat_g',
    'cholesterol_mg',
    'sodium_mg',
    'calcium_mg',
    'iron_mg',
    'potassium_mg',
    'vitamin_a_iu',
    'vitamin_c_mg',
    'vitamin_d_iu',
  ]

  return preferredOrder.map((key) => [
    key,
    SECONDARY_NUTRIENT_LABELS[key] ?? key,
    formatValue(key, Number(nutrients[key] ?? Number.NaN)),
  ])
}
