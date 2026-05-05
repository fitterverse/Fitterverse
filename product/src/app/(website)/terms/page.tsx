import type { Metadata } from 'next'
import { legalLastUpdated } from '@/features/website/lib/site'

const sections = [
  {
    title: 'Using Fitterverse',
    body: 'Fitterverse is a digital product for diet accountability, workout consistency, habit tracking, streaks, badges, progress review, and related coaching or CRM workflows as the platform evolves. By using the service, you agree to use it lawfully and in a way that does not interfere with the platform or other users.',
  },
  {
    title: 'Accounts and access',
    body: 'You are responsible for the account information you use to access Fitterverse and for activities that occur under your account. Keep your login credentials secure and notify the team promptly if you believe your account has been compromised.',
  },
  {
    title: 'Health information and responsibility',
    body: 'Fitterverse is designed to support self-tracking and habit building across food, activity, and routine consistency. It does not provide medical diagnosis, treatment, or emergency support. Any nutrition, workout, or health decisions you make remain your responsibility, and professional advice should be used when appropriate.',
  },
  {
    title: 'Content you provide',
    body: 'Meal logs, workout check-ins when enabled, notes, onboarding answers, and other information you add to the product remain your responsibility. You should not upload unlawful, abusive, or harmful content or use the service in a way that could damage infrastructure, security, or availability.',
  },
  {
    title: 'Availability and product changes',
    body: 'Fitterverse may evolve over time. Features may be updated, improved, replaced, or removed as the product changes. While the team aims for reliable service, uninterrupted access cannot be guaranteed.',
  },
  {
    title: 'Limitation of liability',
    body: 'To the maximum extent permitted by law, Fitterverse is provided on an as-is and as-available basis. The service is intended to support accountability and reflection, and the team is not liable for health outcomes, indirect losses, or decisions made solely in reliance on the product.',
  },
] as const

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'Read the terms governing access to and use of the Fitterverse website and product.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Terms of Use
          </h1>
          <p className="mt-5 text-base leading-8 text-foreground/72">
            These terms govern access to and use of the Fitterverse website and product experience.
            Last updated {legalLastUpdated}.
          </p>
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/8 bg-white/[0.03] p-7 sm:p-8">
          <div className="article-prose">
            {sections.map(section => (
              <div key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
