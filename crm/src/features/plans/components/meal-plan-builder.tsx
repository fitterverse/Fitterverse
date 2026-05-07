'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { saveMealPlanAction, updateMealPlanAction } from '../server/actions'
import { addDays as addD, isBefore, parseISO, startOfDay } from 'date-fns'

// ── Types ────────────────────────────────────────────────────────

type MealSlot = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'

const MEAL_SLOTS: MealSlot[] = [
  'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack',
]

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
  evening_snack: 'Evening Snack',
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface SearchFood {
  id: number
  name: string
  food_group: string | null
  energy_kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
}

interface GridItem {
  _key: string
  food_item_id: number
  food_name: string
  quantity_g: number
  energy_kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
}

type CellKey = string // `${day}-${slot}`
type GridState = Record<CellKey, GridItem[]>

// ── Helpers ──────────────────────────────────────────────────────

function ck(day: number, slot: MealSlot): CellKey { return `${day}-${slot}` }

function scale(per100: number | null, qty: number): number | null {
  if (per100 == null) return null
  return Math.round((per100 * qty) / 100 * 10) / 10
}

function dayTotals(grid: GridState, day: number) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0
  MEAL_SLOTS.forEach(slot => {
    ;(grid[ck(day, slot)] ?? []).forEach(item => {
      kcal    += item.energy_kcal ?? 0
      protein += item.protein_g  ?? 0
      fat     += item.fat_g      ?? 0
      carbs   += item.carbs_g    ?? 0
    })
  })
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
  }
}

// ── Main component ───────────────────────────────────────────────

interface InitialItem {
  day_of_week: number
  meal_slot: string
  food_item_id: number
  food_name: string
  quantity_g: number
  energy_kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
}

interface MealPlanBuilderProps {
  userId: string
  userName: string
  planId?: string
  initialTitle?: string
  initialWeekStart?: string
  initialItems?: InitialItem[]
}

function isPastDay(weekStartStr: string, dayOfWeek: number): boolean {
  const dayDate = addD(parseISO(weekStartStr), dayOfWeek)
  return isBefore(dayDate, startOfDay(new Date()))
}

export function MealPlanBuilder({ userId, userName, planId, initialTitle, initialWeekStart, initialItems }: MealPlanBuilderProps) {
  const router = useRouter()
  const isEditing = !!planId

  const [weekStart, setWeekStart] = useState<Date>(() =>
    initialWeekStart
      ? parseISO(initialWeekStart)
      : startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 })
  )
  const [title, setTitle] = useState(initialTitle ?? 'Meal Plan')
  const [grid, setGrid] = useState<GridState>(() => {
    if (!initialItems?.length) return {}
    const g: GridState = {}
    initialItems.forEach(item => {
      const key = ck(item.day_of_week, item.meal_slot as MealSlot)
      if (!g[key]) g[key] = []
      g[key]!.push({ _key: `init-${item.food_item_id}-${Math.random()}`, food_item_id: item.food_item_id, food_name: item.food_name, quantity_g: item.quantity_g, energy_kcal: item.energy_kcal, protein_g: item.protein_g, fat_g: item.fat_g, carbs_g: item.carbs_g, fiber_g: item.fiber_g })
    })
    return g
  })
  const [activeCell, setActiveCell] = useState<CellKey | null>(null)
  const [saving, setSaving] = useState<null | 'draft' | 'published'>(null)

  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  function addItem(day: number, slot: MealSlot, food: SearchFood, qty: number) {
    const key = ck(day, slot)
    const item: GridItem = {
      _key: `${Date.now()}-${food.id}`,
      food_item_id: food.id,
      food_name: food.name,
      quantity_g: qty,
      energy_kcal: scale(food.energy_kcal, qty),
      protein_g:   scale(food.protein_g, qty),
      fat_g:       scale(food.fat_g, qty),
      carbs_g:     scale(food.carbs_g, qty),
      fiber_g:     scale(food.fiber_g, qty),
    }
    setGrid(g => ({ ...g, [key]: [...(g[key] ?? []), item] }))
    setActiveCell(null)
  }

  function removeItem(day: number, slot: MealSlot, itemKey: string) {
    const key = ck(day, slot)
    setGrid(g => ({ ...g, [key]: (g[key] ?? []).filter(i => i._key !== itemKey) }))
  }

  async function handleSave(status: 'draft' | 'published') {
    const items: Parameters<typeof saveMealPlanAction>[0]['items'] = []
    for (let day = 0; day < 7; day++) {
      MEAL_SLOTS.forEach(slot => {
        ;(grid[ck(day, slot)] ?? []).forEach((item, idx) => {
          items.push({ day_of_week: day, meal_slot: slot, food_item_id: item.food_item_id, food_name: item.food_name, quantity_g: item.quantity_g, energy_kcal: item.energy_kcal, protein_g: item.protein_g, fat_g: item.fat_g, carbs_g: item.carbs_g, fiber_g: item.fiber_g, display_order: idx })
        })
      })
    }

    const editableDays = Array.from({ length: 7 }, (_, i) => i).filter(d => !isPastDay(weekStartStr, d))

    setSaving(status)
    try {
      if (isEditing && planId) {
        await updateMealPlanAction({ planId, userId, title, weekStart: weekStartStr, status, items, editableDays })
      } else {
        await saveMealPlanAction({ userId, title, weekStart: weekStartStr, status, items })
      }
      toast.success(status === 'published' ? 'Plan published to user!' : 'Draft saved')
      router.push(`/users/${userId}`)
    } catch {
      toast.error('Failed to save plan')
    } finally {
      setSaving(null)
    }
  }

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

        {/* Week navigation — locked in edit mode */}
        <div className="flex items-center gap-2 ml-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
          {!isEditing && (
            <button
              onClick={() => setWeekStart(d => subDays(d, 7))}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
          )}
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          {!isEditing && (
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm bg-white" style={{ minWidth: 960 }}>
          {/* Column headers */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-32 p-3 text-left sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meal</span>
              </th>
              {DAY_SHORT.map((day, i) => {
                const locked = isPastDay(weekStartStr, i)
                return (
                  <th key={day} className={`p-3 text-center min-w-[140px] ${locked ? 'opacity-40' : ''}`}>
                    <div className="text-xs font-semibold text-gray-700">{day}</div>
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                      {format(addDays(weekStart, i), 'MMM d')}
                    </div>
                    {locked && <div className="text-[9px] text-gray-400 mt-0.5">past</div>}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {MEAL_SLOTS.map((slot, slotIdx) => (
              <tr key={slot} className={slotIdx > 0 ? 'border-t border-gray-100' : ''}>
                {/* Row label */}
                <td className="p-3 align-top sticky left-0 bg-white z-10 border-r border-gray-100">
                  <span className="text-xs font-medium text-gray-500 leading-none">
                    {SLOT_LABELS[slot]}
                  </span>
                </td>

                {/* 7 day cells */}
                {Array.from({ length: 7 }, (_, day) => {
                  const key = ck(day, slot)
                  const locked = isPastDay(weekStartStr, day)
                  return (
                    <td key={day} className={`p-1.5 align-top border-l border-gray-100 ${locked ? 'bg-gray-50/60' : ''}`}>
                      <MealCell
                        items={grid[key] ?? []}
                        isActive={activeCell === key}
                        isLocked={locked}
                        onOpen={() => !locked && setActiveCell(activeCell === key ? null : key)}
                        onClose={() => setActiveCell(null)}
                        onAdd={(food, qty) => addItem(day, slot, food, qty)}
                        onRemove={itemKey => removeItem(day, slot, itemKey)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Totals row */}
            <tr className="border-t-2 border-gray-200 bg-slate-50">
              <td className="p-3 sticky left-0 bg-slate-50 z-10 border-r border-gray-200">
                <span className="text-xs font-semibold text-gray-600">Day Total</span>
              </td>
              {Array.from({ length: 7 }, (_, day) => {
                const t = dayTotals(grid, day)
                return (
                  <td key={day} className="p-2 border-l border-gray-200 text-center">
                    {t.kcal > 0 ? (
                      <div>
                        <div className="text-sm font-bold text-gray-800">{t.kcal}</div>
                        <div className="text-[10px] text-gray-400 leading-none">kcal</div>
                        <div className="text-[10px] text-gray-500 mt-1 space-x-1">
                          <span className="text-blue-500">P {t.protein}g</span>
                          <span>·</span>
                          <span className="text-amber-500">C {t.carbs}g</span>
                          <span>·</span>
                          <span className="text-red-400">F {t.fat}g</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
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

// ── MealCell ─────────────────────────────────────────────────────

interface MealCellProps {
  items: GridItem[]
  isActive: boolean
  isLocked: boolean
  onOpen: () => void
  onClose: () => void
  onAdd: (food: SearchFood, qty: number) => void
  onRemove: (itemKey: string) => void
}

function MealCell({ items, isActive, isLocked, onOpen, onClose, onAdd, onRemove }: MealCellProps) {
  return (
    <div className={`min-h-[52px] space-y-1 ${isLocked ? 'opacity-50' : ''}`}>
      {items.map(item => (
        <div
          key={item._key}
          className={`group flex items-start gap-1 border rounded-md px-2 py-1 ${isLocked ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-100'}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-gray-700 leading-tight line-clamp-1">{item.food_name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {item.quantity_g}g
              {item.energy_kcal != null && ` · ${item.energy_kcal} kcal`}
            </p>
          </div>
          {!isLocked && (
            <button
              onClick={() => onRemove(item._key)}
              className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}

      {!isLocked && (
        isActive ? (
          <FoodSearchInline onAdd={onAdd} onCancel={onClose} />
        ) : (
          <button
            onClick={onOpen}
            className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Plus size={10} />
            Add
          </button>
        )
      )}
    </div>
  )
}

// ── FoodSearchInline ─────────────────────────────────────────────

interface FoodSearchInlineProps {
  onAdd: (food: SearchFood, qty: number) => void
  onCancel: () => void
}

function FoodSearchInline({ onAdd, onCancel }: FoodSearchInlineProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchFood[]>([])
  const [selected, setSelected] = useState<SearchFood | null>(null)
  const [qty, setQty] = useState(100)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (selected) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}&limit=6`)
        setResults(await r.json())
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, selected])

  function handleSelect(food: SearchFood) {
    setSelected(food)
    setResults([])
    setQuery(food.name)
  }

  function handleAdd() {
    if (!selected || qty <= 0) return
    onAdd(selected, qty)
  }

  const previewKcal = selected?.energy_kcal != null
    ? Math.round(selected.energy_kcal * qty / 100)
    : null

  return (
    <div className="space-y-1.5 pt-1">
      {/* Search input */}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); if (selected) setSelected(null) }}
          onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
          placeholder="Search food..."
          className="flex-1 text-[11px] border border-gray-300 rounded px-1.5 py-1 outline-none focus:border-blue-400 min-w-0 transition-colors"
        />
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={11} />
        </button>
      </div>

      {/* Dropdown results — inline, not absolute */}
      {(results.length > 0 || (loading && query)) && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {loading && !results.length && (
            <div className="px-3 py-2 text-[11px] text-gray-400 flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Searching...
            </div>
          )}
          {results.map(food => (
            <button
              key={food.id}
              onClick={() => handleSelect(food)}
              className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <p className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-1">{food.name}</p>
              <p className="text-[10px] text-gray-400">
                {food.food_group ?? 'General'}
                {food.energy_kcal != null && ` · ${food.energy_kcal} kcal/100g`}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Quantity input — shows after selecting a food */}
      {selected && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            type="number"
            value={qty}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            className="w-16 text-[11px] border border-gray-300 rounded px-1.5 py-1 outline-none focus:border-blue-400"
            min={1}
            max={2000}
          />
          <span className="text-[10px] text-gray-400">g</span>
          {previewKcal != null && (
            <span className="text-[10px] text-blue-600 font-medium">{previewKcal} kcal</span>
          )}
          <button
            onClick={handleAdd}
            className="ml-auto text-[11px] font-medium bg-blue-500 text-white rounded px-2.5 py-1 hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
