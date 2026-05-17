import { Bell, Dumbbell, Flame, MessageSquare, Utensils } from 'lucide-react'

export const NOTIFICATION_CATEGORIES = [
  {
    key: 'meal_reminders' as const,
    icon: Utensils,
    label: 'Meal Reminders',
    description: 'Gentle nudges at breakfast, lunch, and dinner to log what you ate.',
    deepLink: '/diet',
  },
  {
    key: 'workout_reminders' as const,
    icon: Dumbbell,
    label: 'Workout Reminders',
    description: 'An evening prompt to log your session before the day closes.',
    deepLink: '/workout',
  },
  {
    key: 'motivation_quotes' as const,
    icon: MessageSquare,
    label: 'Motivation',
    description: 'A short, practical quote each morning — no fluff.',
    deepLink: '/dashboard',
  },
  {
    key: 'streak_alerts' as const,
    icon: Flame,
    label: 'Streak Alerts',
    description: 'An evening alert if your streak is at risk. Never lose one silently.',
    deepLink: '/dashboard',
  },
] as const

export type NotificationCategoryKey = (typeof NOTIFICATION_CATEGORIES)[number]['key']

export const INTENSITY_LEVELS = [
  {
    key: 'light' as const,
    label: 'Light',
    sublabel: '1 per day',
    description: 'One evening check-in. Good when habits are still forming.',
    slots: ['evening'],
  },
  {
    key: 'standard' as const,
    label: 'Standard',
    sublabel: '2–3 per day',
    description: 'Morning motivation + midday + evening. Recommended starting point.',
    slots: ['morning', 'lunch', 'evening'],
  },
  {
    key: 'active' as const,
    label: 'Active',
    sublabel: 'Full schedule',
    description: 'All four daily slots. Dial back whenever the habit feels natural.',
    slots: ['morning', 'lunch', 'workout', 'evening'],
  },
] as const

export type IntensityKey = (typeof INTENSITY_LEVELS)[number]['key']

// Cron slot → which intensities receive it
export const SLOT_INTENSITIES: Record<string, IntensityKey[]> = {
  morning: ['standard', 'active'],
  lunch:   ['standard', 'active'],
  workout: ['active'],
  evening: ['light', 'standard', 'active'],
}

// Motivational quotes — rotated by day-of-year so each day is different
export const MOTIVATION_QUOTES = [
  "Small wins add up. Log today, even if it wasn't perfect.",
  'The version of you who shows up on hard days is the one that actually changes.',
  'One good meal doesn\'t make you healthy. One bad meal doesn\'t make you unhealthy. Patterns do.',
  'Your streak is a record of decisions. Keep adding to it.',
  'Consistency beats intensity. Every time.',
  'Progress lives in the ordinary days, not the perfect ones.',
  'The habit doesn\'t care how you feel today. Just show up.',
  "You've already started. That's harder than most people manage.",
  'What you do today is still here tomorrow.',
  "You don't need more motivation. You need a shorter path to action.",
  'A 20-minute workout beats a zero. Always.',
  'Your future self is built by your current self\'s boring daily choices.',
  "The goal isn't a perfect week. It's a good enough today.",
  'Logging a bad day is still logging. Awareness is the first win.',
  'Health is not a project. It\'s a direction.',
  'You have permission to eat simply and still count it as a win.',
  'Momentum is built one ordinary day at a time.',
  "The people who change aren't more motivated. They just have better systems.",
  "Skipping once is a decision. Skipping twice is a pattern. You decide which.",
  'Even a 10-minute walk moves the needle. Do it.',
  "Today's log is tomorrow's data. Make it useful.",
  'Done is better than perfect, especially with workouts.',
  "You're not starting over. You're starting again. Different thing.",
  "Eat the food. Move the body. Log the day. That's the whole system.",
  'A consistent routine compounds in ways a perfect week never does.',
  "Your streak doesn't measure perfection. It measures commitment.",
  'Most transformations happen between Monday and Friday, not in a 30-day challenge.',
  "The easiest workout to skip is the one you haven't scheduled yet.",
  "You don't have to be extreme to make progress. You just have to be consistent.",
  'Trust the compound effect. Log today anyway.',
  "Discipline is just doing the thing even when the mood isn't there.",
  'The body keeps score. So does the streak counter.',
  'A bad week followed by a good one is still progress.',
  "It doesn't need to be Instagram-worthy food. It needs to be logged.",
  'Recovery is part of training. Rest without guilt.',
  "Your calories don't care what day of the week it is.",
  'Every habit you build today is one less decision tomorrow.',
  "Progress isn't always visible. Keep going anyway.",
  'Show up for the ordinary days. That\'s where transformation actually happens.',
  "The gap between who you are and who you want to be is closed one day at a time.",
]

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  )
  return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length]
}

// Notification message templates per slot/type
export const NOTIFICATION_TEMPLATES = {
  morning: {
    title: 'Good morning 👋',
    body: (quote: string) => quote,
    url: '/dashboard',
  },
  lunch: {
    title: 'Lunch check-in 🍽️',
    body: () => "Don't forget to log lunch. Takes 30 seconds.",
    url: '/diet',
  },
  workout: {
    title: 'Workout time 💪',
    body: () => 'Did you move today? Log your session before you wind down.',
    url: '/workout',
  },
  evening_streak: {
    title: (streak: number) => `${streak}-day streak on the line 🔥`,
    body: () => 'Log today before midnight to keep it alive.',
    url: '/diet',
  },
  evening_default: {
    title: "Evening check-in 🌙",
    body: () => "How did today go? Log your meals and keep the streak going.",
    url: '/diet',
  },
} as const
