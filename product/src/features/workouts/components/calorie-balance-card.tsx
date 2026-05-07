import { calculateBMR, calculateTDEE } from '@/features/workouts/lib/calorie-math'

interface CalorieBalanceCardProps {
  weight_kg: number | null
  height_cm: number | null
  age: number | null
  activity_level: string | null
  caloriesConsumed: number
  calorisBurned: number
}

function StatRow({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <p className="text-sm font-bold" style={color ? { color } : {}}>
        {value}
      </p>
    </div>
  )
}

export function CalorieBalanceCard({
  weight_kg,
  height_cm,
  age,
  activity_level,
  caloriesConsumed,
  calorisBurned,
}: CalorieBalanceCardProps) {
  const hasProfile = weight_kg && height_cm && age

  if (!hasProfile) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
        Complete your profile (weight, height, age) to see calorie balance.
      </div>
    )
  }

  const bmr = calculateBMR(Number(weight_kg), Number(height_cm), Number(age))
  const tdee = calculateTDEE(bmr, activity_level || 'sedentary')
  const totalBurn = tdee + calorisBurned
  const balance = totalBurn - caloriesConsumed
  const hasConsumedData = caloriesConsumed > 0

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Energy balance (today)
      </p>

      <StatRow
        label="BMR"
        value={`${bmr} kcal`}
        sub="Calories at rest"
      />
      <StatRow
        label="TDEE"
        value={`${tdee} kcal`}
        sub="Including your activity level"
      />
      {calorisBurned > 0 && (
        <StatRow
          label="Workout burn"
          value={`+${calorisBurned} kcal`}
          sub="From logged workouts today"
          color="#22c55e"
        />
      )}
      {hasConsumedData ? (
        <>
          <StatRow
            label="Consumed"
            value={`${caloriesConsumed} kcal`}
            sub="From logged meals today"
          />
          <div className={`mt-3 rounded-xl p-3 text-center ${balance >= 0 ? 'bg-primary/10 border border-primary/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
            <p className="text-xs text-muted-foreground mb-1">
              {balance >= 0 ? 'Calorie deficit' : 'Calorie surplus'}
            </p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-rose-400'}`}>
              {Math.abs(balance)} kcal
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0
                ? 'You\'re burning more than you eat — great for fat loss'
                : 'Eating more than you burn — supports muscle gain'}
            </p>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground pt-2">
          Add calorie counts to your meals to see your full balance.
        </p>
      )}
    </div>
  )
}
