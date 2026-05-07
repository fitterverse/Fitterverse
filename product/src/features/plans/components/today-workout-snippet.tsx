import type { WorkoutPlanDay, WorkoutPlanExercise } from '@/shared/types'

type DayWithExercises = WorkoutPlanDay & { exercises: WorkoutPlanExercise[] }

interface TodayWorkoutSnippetProps {
  day: DayWithExercises
}

export function TodayWorkoutSnippet({ day }: TodayWorkoutSnippetProps) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/10">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
          Today's Workout
        </span>
        {day.label && (
          <span className="text-xs font-medium text-foreground/70">{day.label}</span>
        )}
      </div>

      {day.is_rest_day ? (
        <div className="px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">😴</span>
          <div>
            <p className="text-sm font-medium text-foreground">Rest Day</p>
            <p className="text-xs text-muted-foreground mt-0.5">Light walking, stretching, or full recovery.</p>
          </div>
        </div>
      ) : day.exercises.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-sm text-muted-foreground">No exercises assigned for today.</p>
        </div>
      ) : (
        <div className="divide-y divide-primary/8">
          {day.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-xs text-muted-foreground w-5 shrink-0 pt-0.5 font-medium">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ex.exercise_name}</p>
                {(ex.sets || ex.reps || ex.duration_minutes) && (
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {ex.sets && ex.reps && (
                      <span className="text-[11px] text-muted-foreground">
                        {ex.sets} × {ex.reps}
                      </span>
                    )}
                    {ex.sets && !ex.reps && (
                      <span className="text-[11px] text-muted-foreground">{ex.sets} sets</span>
                    )}
                    {!ex.sets && ex.reps && (
                      <span className="text-[11px] text-muted-foreground">{ex.reps}</span>
                    )}
                    {ex.duration_minutes && (
                      <span className="text-[11px] text-muted-foreground">{ex.duration_minutes} min</span>
                    )}
                    {ex.rest_seconds && (
                      <span className="text-[11px] text-muted-foreground/60">{ex.rest_seconds}s rest</span>
                    )}
                  </div>
                )}
                {ex.notes && (
                  <p className="text-[11px] text-muted-foreground italic mt-0.5">{ex.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
