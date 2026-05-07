'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { saveWorkoutPlanAction } from '../server/actions'

// ── Types ────────────────────────────────────────────────────────

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface ExerciseDraft {
  _key: string
  exercise_name: string
  sets: string
  reps: string
  duration_minutes: string
  rest_seconds: string
  notes: string
}

interface DayDraft {
  label: string
  is_rest_day: boolean
  exercises: ExerciseDraft[]
}

function emptyDay(): DayDraft {
  return { label: '', is_rest_day: false, exercises: [] }
}

function emptyExercise(): ExerciseDraft {
  return { _key: String(Date.now() + Math.random()), exercise_name: '', sets: '', reps: '', duration_minutes: '', rest_seconds: '', notes: '' }
}

// ── Component ────────────────────────────────────────────────────

interface WorkoutPlanBuilderProps {
  userId: string
  userName: string
}

export function WorkoutPlanBuilder({ userId, userName }: WorkoutPlanBuilderProps) {
  const router = useRouter()

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 })
  )
  const [title, setTitle]   = useState('Workout Plan')
  const [days, setDays]     = useState<DayDraft[]>(() => Array.from({ length: 7 }, emptyDay))
  const [saving, setSaving] = useState<null | 'draft' | 'published'>(null)

  // ── Day helpers ──────────────────────────────────────────────

  function updateDay(idx: number, patch: Partial<DayDraft>) {
    setDays(ds => ds.map((d, i) => i === idx ? { ...d, ...patch } : d))
  }

  function addExercise(dayIdx: number) {
    setDays(ds => ds.map((d, i) =>
      i === dayIdx ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d
    ))
  }

  function updateExercise(dayIdx: number, exKey: string, patch: Partial<ExerciseDraft>) {
    setDays(ds => ds.map((d, i) =>
      i === dayIdx
        ? { ...d, exercises: d.exercises.map(e => e._key === exKey ? { ...e, ...patch } : e) }
        : d
    ))
  }

  function removeExercise(dayIdx: number, exKey: string) {
    setDays(ds => ds.map((d, i) =>
      i === dayIdx ? { ...d, exercises: d.exercises.filter(e => e._key !== exKey) } : d
    ))
  }

  // ── Save ─────────────────────────────────────────────────────

  async function handleSave(status: 'draft' | 'published') {
    setSaving(status)
    try {
      await saveWorkoutPlanAction({
        userId,
        title,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        status,
        days: days.map((d, i) => ({
          day_of_week: i,
          label: d.label.trim(),
          is_rest_day: d.is_rest_day,
          exercises: d.exercises
            .filter(e => e.exercise_name.trim())
            .map((e, order) => ({
              exercise_name: e.exercise_name.trim(),
              sets:              e.sets             ? parseInt(e.sets)             : null,
              reps:              e.reps.trim()      || null,
              duration_minutes:  e.duration_minutes ? parseInt(e.duration_minutes) : null,
              rest_seconds:      e.rest_seconds     ? parseInt(e.rest_seconds)     : null,
              notes:             e.notes.trim()     || null,
              display_order: order,
            })),
        })),
      })
      toast.success(status === 'published' ? 'Workout plan published!' : 'Draft saved')
      router.push(`/users/${userId}`)
    } catch {
      toast.error('Failed to save plan')
    } finally {
      setSaving(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-b-2 border-gray-200 focus:border-blue-400 outline-none px-1 py-0.5 min-w-[200px] transition-colors"
          placeholder="Plan title"
        />
        <p className="text-sm text-gray-400">for {userName}</p>

        <div className="flex items-center gap-2 ml-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
          <button onClick={() => setWeekStart(d => subDays(d, 7))} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* 7 day cards */}
      <div className="space-y-3">
        {days.map((day, idx) => (
          <DayCard
            key={idx}
            dayIndex={idx}
            dayShort={DAY_SHORT[idx]!}
            dayFull={DAY_FULL[idx]!}
            date={format(addDays(weekStart, idx), 'MMM d')}
            day={day}
            onUpdate={patch => updateDay(idx, patch)}
            onAddExercise={() => addExercise(idx)}
            onUpdateExercise={(key, patch) => updateExercise(idx, key, patch)}
            onRemoveExercise={key => removeExercise(idx, key)}
          />
        ))}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => handleSave('draft')}
          disabled={!!saving}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
        >
          {saving === 'draft' && <Loader2 size={13} className="animate-spin" />}
          Save Draft
        </button>
        <button
          onClick={() => handleSave('published')}
          disabled={!!saving}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors font-medium"
        >
          {saving === 'published' && <Loader2 size={13} className="animate-spin" />}
          Publish to User
        </button>
      </div>
    </div>
  )
}

// ── DayCard ──────────────────────────────────────────────────────

interface DayCardProps {
  dayIndex: number
  dayShort: string
  dayFull: string
  date: string
  day: DayDraft
  onUpdate: (patch: Partial<DayDraft>) => void
  onAddExercise: () => void
  onUpdateExercise: (key: string, patch: Partial<ExerciseDraft>) => void
  onRemoveExercise: (key: string) => void
}

function DayCard({ dayShort, date, day, onUpdate, onAddExercise, onUpdateExercise, onRemoveExercise }: DayCardProps) {
  return (
    <div className={`rounded-xl border ${day.is_rest_day ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'}`}>
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="w-12 shrink-0">
          <div className="text-sm font-bold text-gray-800">{dayShort}</div>
          <div className="text-[10px] text-gray-400">{date}</div>
        </div>

        <input
          type="text"
          value={day.label}
          onChange={e => onUpdate({ label: e.target.value })}
          placeholder={day.is_rest_day ? 'Rest day' : 'e.g. Push Day, Leg Day…'}
          disabled={day.is_rest_day}
          className="flex-1 text-sm border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none px-1 py-0.5 bg-transparent transition-colors placeholder:text-gray-300 disabled:text-gray-400"
        />

        <button
          onClick={() => onUpdate({ is_rest_day: !day.is_rest_day, exercises: day.is_rest_day ? day.exercises : [] })}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            day.is_rest_day
              ? 'bg-slate-200 text-slate-600 border-slate-300'
              : 'border-gray-200 text-gray-400 hover:border-slate-300 hover:text-slate-600'
          }`}
        >
          <Moon size={11} />
          Rest
        </button>
      </div>

      {/* Exercises */}
      {!day.is_rest_day && (
        <div className="p-3 space-y-2">
          {day.exercises.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No exercises yet</p>
          )}

          {day.exercises.map((ex, exIdx) => (
            <ExerciseRow
              key={ex._key}
              ex={ex}
              index={exIdx}
              onChange={patch => onUpdateExercise(ex._key, patch)}
              onRemove={() => onRemoveExercise(ex._key)}
            />
          ))}

          <button
            onClick={onAddExercise}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors px-1 mt-1"
          >
            <Plus size={12} /> Add exercise
          </button>
        </div>
      )}
    </div>
  )
}

// ── ExerciseRow ──────────────────────────────────────────────────

interface ExerciseRowProps {
  ex: ExerciseDraft
  index: number
  onChange: (patch: Partial<ExerciseDraft>) => void
  onRemove: () => void
}

function ExerciseRow({ ex, index, onChange, onRemove }: ExerciseRowProps) {
  return (
    <div className="group grid grid-cols-[1.5rem_1fr_auto] gap-2 items-start bg-gray-50 rounded-lg px-3 py-2.5">
      {/* Index */}
      <span className="text-xs text-gray-400 pt-0.5 font-medium">{index + 1}.</span>

      {/* Fields */}
      <div className="space-y-1.5">
        {/* Exercise name */}
        <input
          type="text"
          value={ex.exercise_name}
          onChange={e => onChange({ exercise_name: e.target.value })}
          placeholder="Exercise name (e.g. Barbell squat)"
          className="w-full text-sm font-medium bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none px-0.5 py-0.5 placeholder:text-gray-300 transition-colors"
        />

        {/* Sets / Reps / Rest row */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1 text-xs">
            <span className="text-gray-400 w-6">Sets</span>
            <input
              type="number"
              value={ex.sets}
              onChange={e => onChange({ sets: e.target.value })}
              placeholder="3"
              min={1}
              className="w-10 text-xs border-b border-gray-200 focus:border-blue-400 outline-none text-center bg-transparent transition-colors"
            />
          </label>
          <label className="flex items-center gap-1 text-xs">
            <span className="text-gray-400 w-7">Reps</span>
            <input
              type="text"
              value={ex.reps}
              onChange={e => onChange({ reps: e.target.value })}
              placeholder="8-12"
              className="w-14 text-xs border-b border-gray-200 focus:border-blue-400 outline-none bg-transparent transition-colors"
            />
          </label>
          <label className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Rest</span>
            <input
              type="number"
              value={ex.rest_seconds}
              onChange={e => onChange({ rest_seconds: e.target.value })}
              placeholder="60"
              min={0}
              className="w-10 text-xs border-b border-gray-200 focus:border-blue-400 outline-none text-center bg-transparent transition-colors"
            />
            <span className="text-gray-400">s</span>
          </label>
          <label className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Min</span>
            <input
              type="number"
              value={ex.duration_minutes}
              onChange={e => onChange({ duration_minutes: e.target.value })}
              placeholder="—"
              min={1}
              className="w-10 text-xs border-b border-gray-200 focus:border-blue-400 outline-none text-center bg-transparent transition-colors"
            />
          </label>
        </div>

        {/* Notes */}
        <input
          type="text"
          value={ex.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Notes (optional)"
          className="w-full text-xs text-gray-400 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none px-0.5 py-0.5 placeholder:text-gray-200 transition-colors"
        />
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}
