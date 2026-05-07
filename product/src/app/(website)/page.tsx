import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Apple,
  ArrowRight,
  BadgeCheck,
  Clock3,
  Dumbbell,
  Flame,
  RefreshCcw,
  ShieldCheck,
  Target,
  Trophy,
} from 'lucide-react'
import { JsonLd } from '@/features/website/components/json-ld'
import { siteConfig } from '@/features/website/lib/site'

const faqItems = [
  {
    question: 'What makes Fitterverse different from a fitness tracker?',
    answer:
      'Trackers collect data. Fitterverse builds accountability. The difference is that Fitterverse is designed to keep you showing up on the hard days — with a streak system that forgives imperfection, a daily log that takes under 3 minutes, and a coach-side view so someone else can see your patterns too.',
  },
  {
    question: 'What if I miss a day or eat badly?',
    answer:
      'That is exactly what Fitterverse is built for. The streak system gives you a 2-day grace period before a bad stretch resets your progress. One off-plan meal does not end your streak. Two bad days in a row are forgiven. Only the third breaks it — because consistency is not about being perfect.',
  },
  {
    question: 'Do I need to count every calorie?',
    answer:
      'No. Fitterverse uses a 3-second rating system — Healthy, Medium, Junk, or Skipped — so accountability never becomes obsessive. If you want calorie numbers, you can add them and see your daily deficit or surplus. But you never have to.',
  },
  {
    question: 'How does workout accountability work?',
    answer:
      'Log your workout type, intensity, and duration. Fitterverse estimates the calories burned using your body weight and MET values, then shows how that stacks against your daily energy target. The goal is not to make you count — it is to make progress visible.',
  },
  {
    question: 'How is my daily calorie target calculated?',
    answer:
      'Your BMR (Basal Metabolic Rate) is calculated from your height, weight, and age using the Mifflin-St Jeor formula. Your TDEE (Total Daily Energy Expenditure) adjusts that for your activity level. Together, they give you a realistic daily target — not a crash diet number.',
  },
  {
    question: 'Is this only for people trying to lose weight?',
    answer:
      'No. Fitterverse is for anyone who wants to build a consistent health routine — whether the goal is fat loss, muscle gain, better energy, or simply feeling more in control. The accountability system works regardless of what you are working toward.',
  },
] as const

const howItWorks = [
  {
    step: '01',
    title: 'Tell us about your life, not just your goals',
    description:
      'Your onboarding covers your weight, height, activity level, meal timing, biggest challenge, and the real reason you want to change. This is not setup — it is the foundation your accountability is built on.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Show up daily in under 3 minutes',
    description:
      'Rate each meal with one tap. Log a workout in seconds. That is the whole habit. No food diary. No macro math. Just a daily check-in that keeps your streak alive and your patterns visible.',
    icon: Apple,
  },
  {
    step: '03',
    title: 'Watch patterns, not just numbers',
    description:
      'Your streak, calorie balance, and weekly score tell you exactly where you are holding and where you are slipping — before a bad week becomes a bad month. Progress you can see is progress you can change.',
    icon: Flame,
  },
] as const

const problemCards = [
  {
    title: 'You have restarted the same goal more times than you can count',
    description:
      'Every app feels different on day one. By day ten, life takes over and the app just sits there. The restart cycle is not a willpower problem — it is a system problem.',
    icon: RefreshCcw,
  },
  {
    title: 'One bad meal becomes three days off becomes "I\'ll start Monday"',
    description:
      'Without accountability, a small slip snowballs. There is no one to see it. No streak to protect. No gentle nudge that says today still counts. So you wait for a cleaner start that never comes.',
    icon: Clock3,
  },
  {
    title: 'You cannot change patterns you cannot see',
    description:
      'Motivation fades. Visible momentum does not. Most people are one honest weekly review away from a real breakthrough — but they have no log, no score, and no one watching alongside them.',
    icon: Target,
  },
] as const

const accountabilityCards = [
  {
    title: 'Streaks that forgive real life',
    description:
      'The streak system gives you a 2-day grace period. One rough day does not end your run. Accountability without the shame spiral.',
    icon: Flame,
  },
  {
    title: 'Meal check-in in one tap',
    description:
      'Healthy, Medium, Junk, or Skipped. Three meals, three seconds each. Logging is frictionless so the habit actually sticks.',
    icon: Apple,
  },
  {
    title: 'Workout accountability with calorie math',
    description:
      'Log the session, see the burn. Your BMR, TDEE, and daily calorie balance in one place — so you always know where you stand.',
    icon: Dumbbell,
  },
  {
    title: 'Progress that tells you the truth',
    description:
      'Score history, streak trends, and a month at a glance. Not vanity charts — honest signals about where your habits are holding.',
    icon: Trophy,
  },
  {
    title: 'Coach visibility built in',
    description:
      'Your accountability partner or coach can see your streaks, meal patterns, and daily scores — because accountability works better when someone else can see it too.',
    icon: BadgeCheck,
  },
  {
    title: 'Built for the messy middle, not the perfect week',
    description:
      'Fitterverse is designed for the Thursday night when you are tired and tempted to skip. That is the moment the system is built around.',
    icon: ShieldCheck,
  },
] as const

const trustCards = [
  {
    title: 'We are not trying to be another app you quit',
    description:
      'Every design decision in Fitterverse is aimed at reducing the moment you stop showing up. Friction down. Forgiveness up. One small daily action as the whole ask.',
    icon: ShieldCheck,
  },
  {
    title: 'Your data is yours and no one else\'s',
    description:
      'Your meals, workouts, and streaks are tied to your account and never shared or sold. This is a personal accountability space, not a data platform.',
    icon: BadgeCheck,
  },
  {
    title: 'An accountability partner, not a miracle promise',
    description:
      'We will not tell you to eat 1,200 calories or train six days a week. We will help you show up more consistently for the habits you already know matter.',
    icon: Target,
  },
] as const

export const metadata: Metadata = {
  title: 'Your Accountability Partner for Diet and Workout Consistency | Fitterverse',
  description:
    'Fitterverse is not a fitness tracker. It is an accountability partner that helps you build consistent eating and workout habits — one meal, one session, one honest day at a time.',
  alternates: {
    canonical: '/',
  },
  keywords: [
    'fitness accountability partner',
    'diet accountability app',
    'workout consistency app',
    'healthy habit builder',
    'meal logging accountability',
    'calorie deficit tracker',
    'BMR calculator app',
    'workout streak app',
    'health habit tracker India',
    'TDEE calculator free',
  ],
  openGraph: {
    title: 'Fitterverse — Accountability Partner for Diet and Workout Habits',
    description:
      'Not a tracker. An accountability partner. Build consistent eating and workout habits one day at a time — with streaks, calorie balance, and coach visibility.',
    url: '/',
  },
}

const primaryLinkClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'

const secondaryLinkClassName =
  'inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-white/18 hover:bg-white/10'

export default async function WebsiteHomePage() {
  const faqJsonLd = {
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              name: siteConfig.name,
              url: siteConfig.url,
              description: siteConfig.description,
            },
            {
              '@type': 'WebSite',
              name: siteConfig.name,
              url: siteConfig.url,
            },
            faqJsonLd,
          ],
        }}
      />

      {/* ── Hero ── */}
      <section className="px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-12">
          <div className="space-y-6 sm:space-y-8">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary/90 sm:text-xs sm:tracking-[0.22em]">
              <Flame className="h-3.5 w-3.5 shrink-0" />
              Accountability partner · not a tracker
            </div>

            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem]">
                The accountability partner your health habits have been missing.
              </h1>
              <p className="max-w-xl text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
                You already know what to eat and when to move. The gap is follow-through. Fitterverse holds you accountable — one meal, one workout, one honest day at a time — so good habits finally stick.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={`${primaryLinkClassName} w-full sm:w-auto`}>
                Start your streak today
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={`${secondaryLinkClassName} w-full sm:w-auto`}>
                Login to your account
              </Link>
            </div>

            <p className="text-sm leading-6 text-foreground/52">
              Free to start. No credit card. No perfect week required.
            </p>
          </div>

          {/* Mock accountability preview */}
          <div className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] lg:block">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Your accountability today</p>
                  <p className="text-xs text-foreground/50">Thursday — day 14 of your streak</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/25 px-3 py-1.5">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">14 days</span>
                </div>
              </div>

              {/* Score */}
              <div className="rounded-2xl border border-white/8 bg-background/55 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-foreground/60">Today's score</span>
                  <span className="text-xs font-semibold text-primary">6 of 9 pts — streak safe ✓</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Breakfast', tag: 'Healthy', color: '#22c55e' },
                    { label: 'Lunch', tag: 'Medium', color: '#f59e0b' },
                    { label: 'Dinner', tag: 'Log now', color: undefined },
                  ].map(item => (
                    <div
                      key={item.label}
                      className={`rounded-xl px-2 py-3 text-center ${item.color ? 'border border-white/8 bg-white/[0.05]' : 'border border-dashed border-white/10'}`}
                    >
                      <p className="text-[10px] text-foreground/55">{item.label}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: item.color ?? 'rgba(255,255,255,0.3)' }}>{item.tag}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout + balance */}
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-background/55 p-4">
                  <p className="text-[10px] text-foreground/55 uppercase tracking-wide">Workout</p>
                  <p className="text-sm font-semibold text-foreground mt-1.5">🏃 Running</p>
                  <p className="text-xs text-primary font-semibold mt-1">~280 kcal burned</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
                  <p className="text-[10px] text-foreground/55 uppercase tracking-wide">Deficit</p>
                  <p className="text-2xl font-bold text-primary mt-1">740</p>
                  <p className="text-[10px] text-foreground/55">kcal today</p>
                </div>
              </div>

              <p className="text-center text-xs text-foreground/42 italic">
                "You showed up 14 days in a row. Log dinner to keep it going."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Honest positioning bar ── */}
      <section className="border-y border-white/6 bg-white/[0.015] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: 'Accountability', label: 'not just data logging' },
            { value: 'Habit-first', label: 'built for real, messy life' },
            { value: 'Under 3 min', label: 'to complete your daily check-in' },
            { value: 'Free', label: 'to start — no perfect streak required' },
          ].map(item => (
            <div key={item.label} className="text-center px-2">
              <p className="text-sm font-bold text-foreground sm:text-base">{item.value}</p>
              <p className="text-xs text-foreground/50 mt-0.5 leading-snug">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The real problem ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
              The real problem
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              You do not have a knowledge problem. You have a consistency problem.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/68">
              You have read the articles. You know about protein, sleep, and avoiding sugar. None of that is the gap. The gap is what happens on Tuesday at 9pm when you are tired and the plan falls apart.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {problemCards.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.18)] sm:rounded-[1.75rem] sm:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground sm:text-xl leading-snug">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/65">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How Fitterverse holds you accountable ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
              How it works
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Accountability in three honest steps.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/68">
              No complicated onboarding. No daily meal plans to follow. Just a system that makes showing up easier than not showing up.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {howItWorks.map(item => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 sm:p-7">
                  <div className="absolute right-6 top-6 text-5xl font-black text-white/[0.05] select-none">
                    {item.step}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-foreground leading-snug">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/65">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How we hold you accountable (the system) ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_minmax(0,1fr)] lg:items-start">
            <div className="max-w-lg lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
                The system
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Everything is designed to keep you showing up — especially on the hard days.
              </h2>
              <p className="mt-4 text-base leading-8 text-foreground/68">
                Fitterverse is not a feature list. It is a set of decisions made specifically to close the gap between intention and action, day after day.
              </p>
              <Link href="/signup" className={`${primaryLinkClassName} mt-6 w-full sm:w-auto`}>
                Start building your streak
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4">
              {accountabilityCards.map(card => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="grid gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 sm:rounded-[1.75rem] sm:p-6 md:grid-cols-[48px_minmax(0,1fr)] md:items-start"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-foreground/65">{card.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/8 bg-[linear-gradient(135deg,_rgba(34,197,94,0.08),_rgba(255,255,255,0.02)_45%,_rgba(250,204,21,0.05))] p-6 sm:rounded-[2rem] sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/82">
              What we believe
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Consistency is the result. Accountability is the method.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/68">
              Most fit, healthy people do not have more willpower. They have better systems and someone or something that holds them to it. That is the only thing Fitterverse is trying to be.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {trustCards.map(card => {
              const Icon = card.icon
              return (
                <div key={card.title} className="rounded-[1.5rem] border border-white/10 bg-background/45 p-5 sm:rounded-[1.75rem] sm:p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/65">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
              Questions
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Things people ask before they start.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {faqItems.map(item => (
              <div
                key={item.question}
                className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 sm:rounded-[1.75rem] sm:p-6"
              >
                <h3 className="text-base font-semibold text-foreground sm:text-lg leading-snug">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground/65">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-10 lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
              One meal at a time
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Your streak starts the moment you log your next meal.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/68">
              Not next Monday. Not after you get your diet perfect first. Right now, with whatever you just ate. That is how accountability actually works — it starts messy and gets cleaner over time.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link href="/signup" className={`${primaryLinkClassName} w-full sm:w-auto`}>
              Start free — no credit card
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={`${secondaryLinkClassName} w-full sm:w-auto`}>
              Login
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
