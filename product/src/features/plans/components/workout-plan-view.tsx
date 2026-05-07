import { format, addDays, parseISO, isThisWeek, startOfWeek } from 'date-fns'
import type { WorkoutPlanDay, WorkoutPlanExercise } from '@/shared/types'
import { DAY_SHORT, DAYS_OF_WEEK, type DayOfWeek } from '@/shared/types'

interface Plan {
  id: string
  title: string
  week_start: string
  status: string
}

type DayWithExercises = WorkoutPlanDay & { exercises: WorkoutPlanExercise[] }

interface WorkoutPlanViewProps {
  plan: Plan
  days: DayWithExercises[]
}

export function WorkoutPlanView({ plan, days }: WorkoutPlanViewProps) {
  const weekStart = parseISO(plan.week_start)
  const now = new Date()
  const todayDow = ((now.getDay() + 6) % 7) as DayOfWeek
  const isCurrentWeek = isThisWeek(weekStart, { weekStartsOn: 1 })

  const byDow: Record<number, DayWithExercises> = {}
  days.forEach(d => { byDow[d.day_of_week] = d })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm">{plan.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              {isCurrentWeek && <span className="ml-2 text-primary font-medium">· This week</span>}
            </p>
          </div>
          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Days */}
      {DAYS_OF_WEEK.map(dow => {
        const day = byDow[dow]
        if (!day) return null

        const isToday = isCurrentWeek && dow === todayDow
        const dayDate = addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), dow)

        return (
          <div
            key={dow}
            className={`bg-card border rounded-xl overflow-hidden ${
              isToday ? 'border-primary/40' : 'border-border'
            }`}
          >
            {/* Day header */}
            <div className={`px-4 py-2.5 flex items-center justify-between ${
              isToday ? 'bg-primary/8' : 'bg-card'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {DAY_SHORT[dow]}
                </span>
                <span className="text-xs text-muted-foreground">{format(dayDate, 'MMM d')}</span>
                {isToday && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">Today</span>}
                {day.label && <span className="text-xs text-muted-foreground">· {day.label}</span>}
              </div>
              {day.is_rest_day && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  Rest day
                </span>
              )}
            </div>

            {/* Exercises */}
            {!day.is_rest_day && (
              <div className="px-4 py-3 space-y-3">
                {day.exercises.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No exercises assigned</p>
                ) : (
                  day.exercises.map((ex, i) => (
                    <div key={ex.id} className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-5 shrink-0 pt-0.5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{ex.exercise_name}</p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {ex.sets && (
                            <span className="text-[11px] text-muted-foreground">
                              <span className="text-foreground font-medium">{ex.sets}</span> sets
                            </span>
                          )}
                          {ex.reps && (
                            <span className="text-[11px] text-muted-foreground">
                              <span className="text-foreground font-medium">{ex.reps}</span> reps
                            </span>
                          )}
                          {ex.duration_minutes && (
                            <span className="text-[11px] text-muted-foreground">
                              <span className="text-foreground font-medium">{ex.duration_minutes}</span> min
                            </span>
                          )}
                          {ex.rest_seconds && (
                            <span className="text-[11px] text-muted-foreground">
                              {ex.rest_seconds}s rest
                            </span>
                          )}
                        </div>
                        {ex.notes && (
                          <p className="text-[11px] text-muted-foreground mt-1 italic">{ex.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {day.is_rest_day && (
              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground">Recovery, stretching, or light walking — no structured training today.</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
