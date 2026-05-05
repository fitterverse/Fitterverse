import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Apple,
  ArrowRight,
  BadgeCheck,
  Clock3,
  Flame,
  ShieldCheck,
  Target,
  Trophy,
} from 'lucide-react'
import { JsonLd } from '@/features/website/components/json-ld'
import { siteConfig } from '@/features/website/lib/site'

const problemCards = [
  {
    title: 'Good intentions collapse when work and fatigue take over',
    description:
      'Busy schedules break both food decisions and workout plans long before motivation fully runs out.',
    icon: Clock3,
  },
  {
    title: 'One missed workout or off-plan meal becomes a full reset',
    description:
      'Without accountability, a small slip quickly turns into the familiar "I will restart Monday" spiral.',
    icon: Flame,
  },
  {
    title: 'You cannot improve what you do not review clearly',
    description:
      'Most people do not need more health content. They need a simple record of what actually happened this week.',
    icon: Target,
  },
] as const

const systemCards = [
  {
    title: 'Start with a real-life baseline',
    description:
      'Capture your routine, goals, blockers, and daily constraints so accountability fits the life you already live.',
    icon: BadgeCheck,
  },
  {
    title: 'Build a nutrition loop that is fast enough to keep',
    description:
      'Quick food logging and visible streaks make diet accountability practical instead of obsessive.',
    icon: Apple,
  },
  {
    title: 'Extend accountability into training and recovery',
    description:
      'Fitterverse is expanding beyond food so workouts, movement, and recovery can live inside the same consistency system.',
    icon: Flame,
  },
  {
    title: 'Keep progress visible for both users and coaches',
    description:
      'Streaks, trends, and coach-side visibility make it easier to spot drift early and get back on course.',
    icon: Trophy,
  },
] as const

const trustCards = [
  {
    title: 'Accountability over complexity',
    description:
      'The goal is not to drown users in data. It is to help them show up for food, workouts, and recovery more consistently.',
    icon: ShieldCheck,
  },
  {
    title: 'Private, account-based tracking',
    description:
      'Logs, onboarding details, streaks, and future training check-ins stay tied to the authenticated account experience.',
    icon: BadgeCheck,
  },
  {
    title: 'Built as a health routine partner, not a miracle promise',
    description:
      'Fitterverse supports execution and reflection. It does not promise shortcuts or replace professional medical care.',
    icon: Target,
  },
] as const

const proofPoints = [
  { label: 'Nutrition live now', value: 'Logging, streaks, progress' },
  { label: 'Workout layer next', value: 'Training consistency inside the same system' },
] as const

export const metadata: Metadata = {
  title: 'Accountability for healthier diet and workout consistency',
  description:
    'Fitterverse is building a habit-first accountability partner for healthier eating, more consistent workouts, and routines that survive real life.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Fitterverse',
    description:
      'A habit-first accountability partner for healthier eating, stronger workout consistency, and calmer follow-through.',
    url: '/',
  },
}

const primaryLinkClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'

const secondaryLinkClassName =
  'inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-white/18 hover:bg-white/10'

export default async function WebsiteHomePage() {
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
          ],
        }}
      />

      <section className="px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-10">
          <div className="space-y-5 sm:space-y-7">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary/90 sm:text-xs sm:tracking-[0.22em]">
              <Flame className="h-3.5 w-3.5" />
              Problem. System. Trust.
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl lg:text-[4rem]">
                Accountability for diet and workouts.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-foreground/74 sm:text-lg sm:leading-8">
                Build healthier eating and more consistent training without relying on motivation alone.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={`${primaryLinkClassName} w-full sm:w-auto`}>
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={`${secondaryLinkClassName} w-full sm:w-auto`}>
                Login to existing account
              </Link>
            </div>

            <p className="text-sm leading-6 text-foreground/58 sm:leading-7">
              Give it 7 focused days and you&apos;ll already feel more consistent and more in control.
            </p>

            <div className="hidden gap-3 lg:grid lg:grid-cols-2">
              {proofPoints.map(point => (
                <div
                  key={point.label}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                    {point.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/72">{point.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] lg:block">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Daily accountability</p>
                  <p className="text-sm text-foreground/55">Food, workouts, recovery</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-white/8 bg-background/55 p-4">
                  <div className="flex items-center justify-between text-sm text-foreground/72">
                    <span>Today</span>
                    <span>2 of 3 in motion</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {['Food', 'Workout', 'Recovery'].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-2xl px-3 py-4 text-center text-sm font-medium ${
                          index < 2
                            ? 'border border-primary/25 bg-primary/12 text-foreground'
                            : 'border border-white/8 bg-white/[0.03] text-foreground/58'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                      Streak status
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">14 days</p>
                    <p className="mt-2 text-sm leading-6 text-foreground/65">
                      Daily feedback that keeps momentum alive.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                      Why it works
                    </p>
                    <p className="mt-3 text-sm leading-6 text-foreground/70">
                      Less guilt. More follow-through. One visible rhythm.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
              The problem
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The accountability gap is bigger than one meal or one workout.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/70">
              Most people do not need more advice. They need a tighter loop between what they planned,
              what they did, and what happens next.
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
                  <h3 className="mt-4 text-lg font-semibold text-foreground sm:mt-5 sm:text-xl">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_minmax(0,1fr)] lg:items-start">
            <div className="max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
                The solution
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                A daily system that rewards showing up before it demands perfection.
              </h2>
              <p className="mt-4 text-base leading-8 text-foreground/70">
                Fitterverse is designed to shrink friction at the moment most health routines fail:
                when you are busy, inconsistent, tired, or tempted to reset the entire plan.
              </p>
            </div>

            <div className="grid gap-4">
              {systemCards.map((card, index) => {
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
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                          Step {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">{card.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-foreground/68">{card.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/8 bg-[linear-gradient(135deg,_rgba(34,197,94,0.10),_rgba(255,255,255,0.03)_42%,_rgba(250,204,21,0.06))] p-6 sm:rounded-[2rem] sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/82">
              Trust angle
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built to be believable, usable, and safe to come back to tomorrow.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/70">
              The product value is simple: help people notice, record, and improve the behaviors that
              shape their week: food decisions, training consistency, sleep, and recovery.
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
                  <h3 className="mt-4 text-lg font-semibold text-foreground sm:mt-5 sm:text-xl">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
              Ready to start
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Create the system before you ask yourself to create the discipline.
            </h2>
            <p className="mt-4 text-base leading-8 text-foreground/70">
              Fitterverse is built for people who want healthier eating and more consistent workouts to
              feel calmer, clearer, and easier to repeat.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={`${primaryLinkClassName} w-full sm:w-auto`}>
              Create your account
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
