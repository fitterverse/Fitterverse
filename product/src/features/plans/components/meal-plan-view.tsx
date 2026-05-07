import { format, addDays, parseISO, isThisWeek, isSameDay, startOfWeek } from 'date-fns'
import type { MealPlanItem } from '@/shared/types'
import { MEAL_SLOT_LABELS, MEAL_SLOTS, DAY_SHORT, DAYS_OF_WEEK, type MealSlot, type DayOfWeek } from '@/shared/types'

interface Plan {
  id: string
  title: string
  week_start: string
  status: string
}

interface MealPlanViewProps {
  plan: Plan
  items: MealPlanItem[]
}

function groupByDayAndSlot(items: MealPlanItem[]) {
  const map: Record<number, Record<string, MealPlanItem[]>> = {}
  items.forEach(item => {
    if (!map[item.day_of_week]) map[item.day_of_week] = {}
    if (!map[item.day_of_week][item.meal_slot]) map[item.day_of_week][item.meal_slot] = []
    map[item.day_of_week]![item.meal_slot]!.push(item)
  })
  return map
}

function dayTotals(items: MealPlanItem[]) {
  return items.reduce(
    (acc, item) => ({
      kcal:    acc.kcal    + (item.energy_kcal ?? 0),
      protein: acc.protein + (item.protein_g   ?? 0),
      fat:     acc.fat     + (item.fat_g        ?? 0),
      carbs:   acc.carbs   + (item.carbs_g      ?? 0),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

export function MealPlanView({ plan, items }: MealPlanViewProps) {
  const byDay = groupByDayAndSlot(items)

  const weekStart = parseISO(plan.week_start)
  const now = new Date()
  // ISO day of week: 0=Mon … 6=Sun
  const todayDow = ((now.getDay() + 6) % 7) as DayOfWeek
  const isCurrentWeek = isThisWeek(weekStart, { weekStartsOn: 1 })

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
        const dayItems = byDay[dow]
        const hasItems = dayItems && Object.values(dayItems).some(slot => slot.length > 0)
        if (!hasItems) return null

        const isToday = isCurrentWeek && dow === todayDow
        const dayDate = addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), dow)
        const allItems = Object.values(dayItems).flat()
        const totals = dayTotals(allItems)

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
              </div>
              {totals.kcal > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(totals.kcal)} kcal
                </span>
              )}
            </div>

            {/* Meal slots */}
            <div className="divide-y divide-border">
              {MEAL_SLOTS.map(slot => {
                const slotItems = dayItems[slot]
                if (!slotItems?.length) return null
                const slotKcal = slotItems.reduce((s, i) => s + (i.energy_kcal ?? 0), 0)

                return (
                  <div key={slot} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {MEAL_SLOT_LABELS[slot as MealSlot]}
                      </span>
                      {slotKcal > 0 && (
                        <span className="text-[11px] text-muted-foreground">{Math.round(slotKcal)} kcal</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {slotItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-foreground flex-1 min-w-0 truncate">{item.food_name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{item.quantity_g}g</span>
                            {item.energy_kcal != null && (
                              <span className="text-xs font-medium text-foreground">
                                {Math.round(item.energy_kcal)} kcal
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Slot macro bar */}
                    {slotItems.some(i => i.protein_g || i.carbs_g || i.fat_g) && (
                      <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                        <span className="text-blue-400">P {Math.round(slotItems.reduce((s,i)=>s+(i.protein_g??0),0)*10)/10}g</span>
                        <span className="text-amber-400">C {Math.round(slotItems.reduce((s,i)=>s+(i.carbs_g??0),0)*10)/10}g</span>
                        <span className="text-red-400">F {Math.round(slotItems.reduce((s,i)=>s+(i.fat_g??0),0)*10)/10}g</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Day totals footer */}
            {totals.kcal > 0 && (
              <div className="px-4 py-2 border-t border-border bg-secondary/20 flex gap-4 text-[11px]">
                <span className="font-semibold text-foreground">{Math.round(totals.kcal)} kcal</span>
                <span className="text-blue-400">P {Math.round(totals.protein*10)/10}g</span>
                <span className="text-amber-400">C {Math.round(totals.carbs*10)/10}g</span>
                <span className="text-red-400">F {Math.round(totals.fat*10)/10}g</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
