import { MEAL_SLOTS, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS, type MealSlot } from '@/shared/types'
import type { MealPlanItem } from '@/shared/types'

interface TodayPlanSnippetProps {
  items: MealPlanItem[]   // pre-filtered: only today's day_of_week items
}

export function TodayPlanSnippet({ items }: TodayPlanSnippetProps) {
  if (!items.length) return null

  const bySlot: Record<string, MealPlanItem[]> = {}
  items.forEach(item => {
    if (!bySlot[item.meal_slot]) bySlot[item.meal_slot] = []
    bySlot[item.meal_slot]!.push(item)
  })

  const totalKcal = Math.round(items.reduce((s, i) => s + (i.energy_kcal ?? 0), 0))
  const totalProtein = Math.round(items.reduce((s, i) => s + (i.protein_g ?? 0), 0) * 10) / 10

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Today's Plan</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {totalKcal > 0 && <span><span className="text-foreground font-semibold">{totalKcal}</span> kcal</span>}
          {totalProtein > 0 && <span><span className="text-blue-400 font-semibold">{totalProtein}g</span> protein</span>}
        </div>
      </div>

      {/* Meal slots */}
      <div className="divide-y divide-primary/8">
        {MEAL_SLOTS.map(slot => {
          const slotItems = bySlot[slot as MealSlot]
          if (!slotItems?.length) return null
          const slotKcal = Math.round(slotItems.reduce((s, i) => s + (i.energy_kcal ?? 0), 0))

          return (
            <div key={slot} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-base shrink-0 mt-0.5">{MEAL_SLOT_EMOJIS[slot as MealSlot]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {MEAL_SLOT_LABELS[slot as MealSlot]}
                  </span>
                  {slotKcal > 0 && (
                    <span className="text-[10px] text-muted-foreground shrink-0">{slotKcal} kcal</span>
                  )}
                </div>
                <p className="text-sm text-foreground mt-0.5 leading-snug">
                  {slotItems.map(i => `${i.food_name} ${i.quantity_g}g`).join(' · ')}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
