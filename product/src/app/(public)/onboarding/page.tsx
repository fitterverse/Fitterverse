'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveOnboarding } from '@/features/onboarding/server/actions'
import { getProfile } from '@/features/profile/server/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type FormData = {
  full_name: string
  age: string
  weight_kg: string
  height_cm: string
  goal_weight_kg: string
  activity_level: string
  practices_fasting: boolean
  meals_per_day: string
  breakfast_time: string
  lunch_time: string
  dinner_time: string
  calorie_limit_per_meal: string
  dietary_restrictions: string
  diet_goal: string
  biggest_challenge: string
  motivation: string
}

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: '🪑 Sedentary', desc: 'Mostly sitting, desk job' },
  { value: 'light', label: '🚶 Light', desc: 'Light walks, some movement' },
  { value: 'moderate', label: '🏃 Moderate', desc: 'Exercise 3-4x per week' },
  { value: 'active', label: '💪 Active', desc: 'Daily exercise or physical job' },
]

const DIET_GOALS = [
  { value: 'weight_loss', label: '⚖️ Lose Weight' },
  { value: 'muscle_gain', label: '💪 Gain Muscle' },
  { value: 'better_energy', label: '⚡ Better Energy' },
  { value: 'balanced', label: '🌿 Balanced Lifestyle' },
]

const CHALLENGES = [
  { value: 'junk_cravings', label: '🍕 Junk food cravings' },
  { value: 'busy_schedule', label: '⏰ Too busy to cook' },
  { value: 'portion_control', label: '🍽️ Overeating' },
  { value: 'skipping_meals', label: '⏭️ Skipping meals' },
  { value: 'eating_late', label: '🌙 Eating too late' },
  { value: 'social_eating', label: '🎉 Social eating / events' },
]

const DIETARY_OPTIONS = [
  { value: 'none', label: '🍗 No restrictions' },
  { value: 'vegetarian', label: '🥗 Vegetarian' },
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'jain', label: '🙏 Jain' },
  { value: 'gluten_free', label: '🌾 Gluten-free' },
]

const steps = [
  { id: 1, title: "What's your name?", subtitle: "We'll personalize your experience" },
  { id: 2, title: 'Your body stats', subtitle: 'Used to calibrate your goals' },
  { id: 3, title: 'Activity level', subtitle: 'How active are you on most days?' },
  { id: 4, title: 'Your goal', subtitle: "What are you working towards?" },
  { id: 5, title: 'Meal preferences', subtitle: 'Help us understand your routine' },
  { id: 6, title: 'Meal timing', subtitle: 'When do you usually eat?' },
  { id: 7, title: 'Calorie limit', subtitle: 'Per meal target (overeating = not healthy)' },
  { id: 8, title: 'Dietary restrictions', subtitle: "Any foods you don't eat?" },
  { id: 9, title: 'Biggest challenge', subtitle: "What trips you up most?" },
  { id: 10, title: 'Your motivation', subtitle: "What's your WHY? Be specific." },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getProfile().then(profile => {
      if (profile?.onboarding_completed) router.replace('/dashboard')
    })
  }, [])
  const [form, setForm] = useState<FormData>({
    full_name: '',
    age: '',
    weight_kg: '',
    height_cm: '',
    goal_weight_kg: '',
    activity_level: '',
    practices_fasting: false,
    meals_per_day: '3',
    breakfast_time: '08:00',
    lunch_time: '13:00',
    dinner_time: '20:00',
    calorie_limit_per_meal: '650',
    dietary_restrictions: 'none',
    diet_goal: '',
    biggest_challenge: '',
    motivation: '',
  })

  function update(key: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function canProceed() {
    switch (step) {
      case 0: return form.full_name.trim().length > 0
      case 1: return form.age && form.weight_kg && form.height_cm && form.goal_weight_kg
      case 2: return form.activity_level !== ''
      case 3: return form.diet_goal !== ''
      case 4: return form.meals_per_day !== ''
      case 5: return true
      case 6: return true
      case 7: return form.dietary_restrictions !== ''
      case 8: return form.biggest_challenge !== ''
      case 9: return form.motivation.trim().length > 0
      default: return true
    }
  }

  async function handleFinish() {
    setLoading(true)
    try {
      const result = await saveOnboarding({
        full_name: form.full_name,
        age: parseInt(form.age),
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        goal_weight_kg: parseFloat(form.goal_weight_kg),
        activity_level: form.activity_level,
        practices_fasting: form.practices_fasting,
        meals_per_day: parseInt(form.meals_per_day),
        breakfast_time: form.breakfast_time,
        lunch_time: form.lunch_time,
        dinner_time: form.dinner_time,
        calorie_limit_per_meal: parseInt(form.calorie_limit_per_meal) || 650,
        dietary_restrictions: form.dietary_restrictions,
        diet_goal: form.diet_goal,
        biggest_challenge: form.biggest_challenge,
        motivation: form.motivation,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("You're all set! Let's build that streak 🔥")
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // NEXT_REDIRECT means session expired — send to login
      if (msg.includes('NEXT_REDIRECT')) {
        router.push('/login')
      } else {
        toast.error('Something went wrong. Please try again.')
        console.error('[onboarding] handleFinish error:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const isLastStep = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</p>
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl">{steps[step].title}</CardTitle>
                <CardDescription>{steps[step].subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 0: Name */}
                {step === 0 && (
                  <div className="space-y-2">
                    <Label>Your name</Label>
                    <Input
                      placeholder="e.g. Raj"
                      value={form.full_name}
                      onChange={e => update('full_name', e.target.value)}
                      className="bg-input text-lg"
                      autoFocus
                    />
                  </div>
                )}

                {/* Step 1: Body stats */}
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Age</Label>
                      <Input type="number" placeholder="28" value={form.age} onChange={e => update('age', e.target.value)} className="bg-input" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Current Weight (kg)</Label>
                      <Input type="number" placeholder="75" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} className="bg-input" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input type="number" placeholder="175" value={form.height_cm} onChange={e => update('height_cm', e.target.value)} className="bg-input" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Goal Weight (kg)</Label>
                      <Input type="number" placeholder="68" value={form.goal_weight_kg} onChange={e => update('goal_weight_kg', e.target.value)} className="bg-input" />
                    </div>
                  </div>
                )}

                {/* Step 2: Activity level */}
                {step === 2 && (
                  <div className="space-y-2">
                    {ACTIVITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update('activity_level', opt.value)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          form.activity_level === opt.value
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-secondary/30 hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: Goal */}
                {step === 3 && (
                  <div className="grid grid-cols-2 gap-2">
                    {DIET_GOALS.map(goal => (
                      <button
                        key={goal.value}
                        onClick={() => update('diet_goal', goal.value)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          form.diet_goal === goal.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/30 hover:border-primary/50'
                        }`}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 4: Meals per day + fasting */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>How many meals per day?</Label>
                      <div className="flex gap-2">
                        {['2', '3', '4'].map(n => (
                          <button
                            key={n}
                            onClick={() => update('meals_per_day', n)}
                            className={`flex-1 py-3 rounded-lg border text-lg font-bold transition-all ${
                              form.meals_per_day === n
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-secondary/30'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => update('practices_fasting', !form.practices_fasting)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        form.practices_fasting
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-secondary/30'
                      }`}
                    >
                      <div className="font-medium text-sm">🍵 I practice intermittent fasting</div>
                      <div className="text-xs text-muted-foreground">Skipped meals = 3 pts (healthy)</div>
                    </button>
                  </div>
                )}

                {/* Step 5: Meal times */}
                {step === 5 && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-2">🌅 Breakfast time</Label>
                      <Input type="time" value={form.breakfast_time} onChange={e => update('breakfast_time', e.target.value)} className="bg-input" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-2">☀️ Lunch time</Label>
                      <Input type="time" value={form.lunch_time} onChange={e => update('lunch_time', e.target.value)} className="bg-input" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-2">🌙 Dinner time</Label>
                      <Input type="time" value={form.dinner_time} onChange={e => update('dinner_time', e.target.value)} className="bg-input" />
                    </div>
                  </div>
                )}

                {/* Step 6: Calorie limit */}
                {step === 6 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Calorie limit per meal (kcal)</Label>
                      <Input
                        type="number"
                        placeholder="650"
                        value={form.calorie_limit_per_meal}
                        onChange={e => update('calorie_limit_per_meal', e.target.value)}
                        className="bg-input text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Meals over this limit will be flagged as overeaten. Recommended: 600–700 kcal for weight loss.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['500', '600', '650', '700', '800'].map(cal => (
                        <button
                          key={cal}
                          onClick={() => update('calorie_limit_per_meal', cal)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                            form.calorie_limit_per_meal === cal
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-secondary/30'
                          }`}
                        >
                          {cal}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 7: Dietary restrictions */}
                {step === 7 && (
                  <div className="grid grid-cols-1 gap-2">
                    {DIETARY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update('dietary_restrictions', opt.value)}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                          form.dietary_restrictions === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 8: Biggest challenge */}
                {step === 8 && (
                  <div className="grid grid-cols-1 gap-2">
                    {CHALLENGES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => update('biggest_challenge', c.value)}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                          form.biggest_challenge === c.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/30'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 9: Motivation */}
                {step === 9 && (
                  <div className="space-y-2">
                    <Label>Write your WHY</Label>
                    <textarea
                      placeholder='e.g. "I want to have the energy to play with my kids without getting tired..."'
                      value={form.motivation}
                      onChange={e => update('motivation', e.target.value)}
                      className="w-full min-h-[120px] rounded-lg border border-border bg-input p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                    <p className="text-xs text-muted-foreground">This will be shown to you on tough days to keep you going.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 border-border">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {!isLastStep ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading || !canProceed()}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '🚀 '}
              Start Tracking!
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
