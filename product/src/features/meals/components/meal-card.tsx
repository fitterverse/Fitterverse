'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveMeal } from '@/features/meals/server/actions'
import { analyzeMealImage } from '../server/ai-actions'
import { toast } from 'sonner'
import {
  MealType, MealRating, MealLog, MEAL_EMOJIS, MEAL_LABELS, POINTS, RATING_COLORS
} from '@/shared/types'
import { Loader2, ChevronDown, ChevronUp, Camera } from 'lucide-react'

interface MealCardProps {
  mealType: MealType
  calorieLimit: number
  existing?: MealLog | null
  date: string
}

const RATING_OPTIONS: { value: MealRating; label: string; desc: string; emoji: string }[] = [
  { value: 'healthy', label: 'Healthy', desc: 'Good portion, nutritious', emoji: '✅' },
  { value: 'medium', label: 'Medium', desc: 'Okay choice, could be better', emoji: '🟡' },
  { value: 'junk', label: 'Junk', desc: 'Processed, fried, or sugary', emoji: '🔴' },
  { value: 'skipped', label: 'Skipped', desc: 'Fasting — counts as healthy', emoji: '⏭️' },
]

export function MealCard({ mealType, calorieLimit, existing, date }: MealCardProps) {
  const router = useRouter()
  const [rating, setRating] = useState<MealRating | null>(existing?.rating || null)
  const [calories, setCalories] = useState(existing?.calories?.toString() || '')
  const [note, setNote] = useState(existing?.note || '')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [saved, setSaved] = useState(!!existing?.rating)

  const caloriesNum = parseInt(calories) || 0
  const isOvereaten = caloriesNum > calorieLimit && rating === 'healthy' && caloriesNum > 0
  const effectivePoints = rating ? POINTS[rating] : 0

  async function handleSave() {
    if (!rating) {
      toast.error('Please select a rating first')
      return
    }
    setSaving(true)
    const result = await saveMeal({
      meal_type: mealType,
      rating,
      calories: caloriesNum || null,
      note: note.trim() || null,
      date,
    })
    setSaving(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setSaved(true)
      setExpanded(false)
      router.refresh()
      toast.success(`${MEAL_LABELS[mealType]} saved! +${effectivePoints} pts`)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('mealType', mealType)
    formData.append('date', date)

    try {
      const result = await analyzeMealImage(formData)
      if (result.success && result.data) {
        setSaved(true)
        setRating(result.data.rating)
        setCalories(result.data.calories.toString())
        setNote(`AI detected: ${result.data.food_name}`)
        router.refresh()
        toast.success(`AI logged ${result.data.food_name}!`)
      } else {
        toast.error(result.error || "Failed to analyze image")
      }
    } catch (err) {
      toast.error("AI service error. Please log manually.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const color = rating ? RATING_COLORS[rating] : undefined

  return (
    <Card className={`bg-card border transition-all duration-300 ${
      saved ? 'border-opacity-60' : 'border-border'
    }`} style={saved && color ? { borderColor: color + '40' } : {}}>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="w-full flex items-center justify-between p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <span className="text-2xl">{MEAL_EMOJIS[mealType]}</span>
            <div>
              <div className="font-semibold text-sm">{MEAL_LABELS[mealType]}</div>
              {saved && rating ? (
                <div className="text-xs flex items-center gap-1" style={{ color }}>
                  <span>{RATING_OPTIONS.find(r => r.value === rating)?.emoji}</span>
                  <span>{RATING_OPTIONS.find(r => r.value === rating)?.label}</span>
                  {caloriesNum > 0 && <span>· {caloriesNum} kcal</span>}
                  {isOvereaten && <span className="text-red-400">⚠️ Overeaten</span>}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Tap to log manually</div>
              )}
            </div>
          </button>

          {/* AI PHOTO LOG BUTTON */}
          {!saved && (
            <div className="mr-2">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                id={`ai-camera-${mealType}`}
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              <label 
                htmlFor={`ai-camera-${mealType}`}
                className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-full cursor-pointer hover:bg-primary/20 transition-all active:scale-95"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                {isAnalyzing ? 'LOGGING...' : 'PHOTO LOG (10X)'}
              </label>
            </div>
          )}

          <button onClick={() => setExpanded(!expanded)} className="p-1">
            <div className="flex items-center gap-2">
              {saved && rating && (
                <div className="text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
                  {effectivePoints}
                </div>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                {/* Rating buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {RATING_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRating(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        rating === opt.value
                          ? 'border-2'
                          : 'border-border bg-secondary/20 hover:bg-secondary/40'
                      }`}
                      style={rating === opt.value ? {
                        borderColor: RATING_COLORS[opt.value],
                        backgroundColor: RATING_COLORS[opt.value] + '15',
                      } : {}}
                    >
                      <div className="text-base">{opt.emoji}</div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      <div className="text-xs font-bold mt-1" style={{ color: RATING_COLORS[opt.value] }}>
                        +{POINTS[opt.value]} pts
                      </div>
                    </button>
                  ))}
                </div>

                {/* Calories */}
                {rating && rating !== 'skipped' && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Calories (optional) · Limit: {calorieLimit} kcal
                    </label>
                    <Input
                      type="number"
                      placeholder={`e.g. 450`}
                      value={calories}
                      onChange={e => setCalories(e.target.value)}
                      className={`bg-input h-9 ${isOvereaten ? 'border-red-500' : ''}`}
                    />
                    {isOvereaten && (
                      <p className="text-xs text-red-400">⚠️ Over your {calorieLimit} kcal limit — consider this overeaten</p>
                    )}
                  </div>
                )}

                {/* Note */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Note (optional)</label>
                  <Input
                    placeholder="e.g. Dal rice, home cooked"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="bg-input h-9"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving || !rating}
                  className="w-full"
                  size="sm"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                  {saved ? 'Update' : 'Save'} {MEAL_LABELS[mealType]}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
