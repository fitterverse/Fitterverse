import type { Metadata } from 'next'
import { legalLastUpdated } from '@/features/website/lib/site'

const sections = [
  {
    title: 'Information collected',
    body: 'Fitterverse may collect information you provide directly, including account details such as email address, onboarding responses, meal logs, workout check-ins when enabled, streak history, badges, notes, and product usage necessary to operate the experience.',
  },
  {
    title: 'How information is used',
    body: 'Information is used to authenticate your account, personalize the product, store nutrition and activity records, calculate streaks and progress, improve reliability, and support website and application operations.',
  },
  {
    title: 'Infrastructure and third-party services',
    body: 'Fitterverse relies on third-party infrastructure providers to deliver account access and data storage, including Firebase for authentication-related flows and Supabase-backed storage for product data. Those providers process data according to their own service terms and security controls.',
  },
  {
    title: 'Sharing and disclosure',
    body: 'Fitterverse does not sell personal information. Data may be shared with service providers strictly as needed to run the platform, comply with legal obligations, protect users, or enforce product security and terms.',
  },
  {
    title: 'Retention and security',
    body: 'Information is retained for as long as reasonably necessary to operate the service, maintain product records, resolve disputes, and satisfy legal requirements. Reasonable administrative and technical safeguards are used, but no internet-based system can guarantee absolute security.',
  },
  {
    title: 'Your choices',
    body: 'You can choose what information to submit to the product, and you may stop using the service at any time. Requests related to account data, deletion, or privacy concerns should be directed through official Fitterverse support channels when made available.',
  },
] as const

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'Read how Fitterverse collects, uses, stores, and protects account and product data.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 text-base leading-8 text-foreground/72">
            This policy explains how Fitterverse handles information related to the public website and
            authenticated product experience. Last updated {legalLastUpdated}.
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
