# Tech Stack — v0 and v1

## Philosophy

Keep it boring. Use proven tools. Optimize for shipping cohort 1 in 30 days, not for a clean architecture diagram.

We do not build native mobile in v1. WhatsApp + responsive web is enough for the first 1,000 users. Build native mobile only if there's a clear engagement gap that web can't solve.

---

## v0 stack (cohort 1 — shipping in 30 days)

| Layer | Tool | Why |
|---|---|---|
| Domain | fitterverse.in (already owned) | — |
| Hosting | Vercel | Free tier, push-to-deploy, perfect for Next.js |
| Frontend framework | **Next.js 14 (App Router)** | SSR, fast, owns SEO, big ecosystem |
| Styling | **Tailwind CSS** | Speed of iteration |
| UI components | shadcn/ui | Drop-in, customizable, no lock-in |
| Database | **Supabase (PostgreSQL)** | Postgres + auth + storage in one, generous free tier |
| Auth | Supabase Auth (email + phone OTP) | Built-in |
| File storage | Supabase Storage | Progress photos in private bucket |
| Payments | **Razorpay** | India-native, supports UPI/cards/wallets |
| WhatsApp Business | **AiSensy** (or Interakt as backup) | BSP, supports templates + APIs + automations |
| Email | Resend or AWS SES | Cheap, transactional |
| Forms (v0 only) | Typeform OR custom | Switch to custom by Cohort 2 |
| Admin/coach dashboard (v0) | Retool OR custom Next.js admin | Retool faster, Next.js cleaner long-term |
| Analytics | PostHog (events) + GA4 (page views) + Meta Pixel | Standard stack |
| Error monitoring | Sentry | Free tier sufficient |
| CMS for blog | MDX in repo (v0) → Sanity (v1) | Start simple |

## v1 additions (Cohort 2-3)

| Layer | Tool |
|---|---|
| Background jobs | Inngest or Trigger.dev (for scheduled WhatsApp sends, weekly reports) |
| Search (for blog/champions/SEO) | Algolia or Meilisearch |
| AI layer | OpenAI API or Anthropic Claude API for assessment plan generation, weekly report copy, plate-photo analysis |
| Feature flags | PostHog feature flags |
| Real-time messaging in-app (later) | Supabase Realtime |

## v2 considerations (post-Cohort 6)

- Native mobile (React Native + Expo) only if web engagement metrics warrant
- Wearable integration (Google Fit, Apple HealthKit) for steps/sleep auto-pull
- AI nutrition photo analysis (Claude Vision or GPT-4V)
- Coach assistant LLM (drafts replies, coach approves/edits)

---

## Why these specific choices

- **Next.js + Vercel:** the founder + 1 dev can ship cohort 1 in 3 weeks; SEO is a long-term asset, server rendering matters
- **Supabase over Firebase:** Postgres > Firestore for the relational data we'll have (users, cohorts, check-ins, messages); also avoids Google lock-in
- **AiSensy over WATI:** AiSensy has been more reliable for Indian SMBs in 2025-26; both are BSPs, swap if pricing changes
- **Razorpay over Stripe:** UPI-first, lower friction in India, sub-2% fee
- **Retool admin in v0:** the coach dashboard is the most build-heavy thing; Retool gets us to Day 1 of cohort with a working admin in 2 days vs 2 weeks of custom build

---

## Repo structure (initial)

```
fitterverse/
├── apps/
│   ├── web/                    # Next.js — landing + user dashboard
│   │   ├── app/
│   │   │   ├── (marketing)/    # Public pages: home, /reset, /champions, /blog
│   │   │   ├── (auth)/         # Sign-in / sign-up
│   │   │   ├── (app)/          # Logged-in user dashboard
│   │   │   │   ├── today/      # Today's plan
│   │   │   │   ├── tracker/    # Daily check-in form
│   │   │   │   ├── progress/   # Weekly + cohort progress
│   │   │   │   └── champion/   # Champion submission
│   │   │   └── (admin)/        # Coach + founder dashboard
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   └── jobs/                   # Inngest jobs (later)
├── packages/
│   ├── db/                     # Drizzle ORM + migrations
│   ├── ui/                     # Shared components
│   ├── whatsapp/               # AiSensy wrapper
│   └── lib/                    # Shared utils
├── supabase/                   # Local Supabase config
├── .env.example
├── package.json (pnpm workspaces)
└── README.md
```

We'll start as a single Next.js app and split into monorepo packages only when we hit pain. Don't pre-optimize.

---

## Third-party costs (monthly, at 100 active users)

| Service | Cost |
|---|---|
| Vercel | ₹0 (free tier) → ₹2,000 once we cross limits |
| Supabase | ₹0 → ₹2,000 (Pro tier) |
| AiSensy WhatsApp | ₹2,500 + per-message charges (~₹0.50/msg conversational) |
| Razorpay | ~2% of transaction value, no fixed |
| Resend (email) | ₹0 (free tier good for 3K emails/mo) |
| Sentry, PostHog | ₹0 (free tier) |
| OpenAI / Claude API | ₹3,000 (post-Cohort 1, when we add AI) |
| **Total fixed v0** | **~₹2,500/month** |
| **Total fixed v1** | **~₹10,000/month** |

---

## Security baseline (non-negotiable)

- All passwords via Supabase Auth (bcrypt + secure session)
- Phone OTP for first sign-in
- Photos stored in private bucket, never in public URL
- Health/medical data encrypted at column level (use pgsodium or app-level encryption)
- Coach access scoped to assigned users via Supabase RLS policies
- All API routes have rate limiting (Vercel built-in or Upstash)
- HTTPS only
- WhatsApp opt-in must be explicit at signup
- Audit log of every admin action
- Daily backups of Supabase
