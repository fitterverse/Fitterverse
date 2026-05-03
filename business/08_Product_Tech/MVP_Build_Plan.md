# MVP Build Plan — From Empty Repo to Cohort 1 Launch

This is the engineering execution plan. Open this in VS Code and you can start building.

---

## Goal

Ship a working web app + WhatsApp integration + admin dashboard in **30 days** — enough to run Cohort 1 with 30 paid users.

---

## What we're NOT building in v0

- ❌ Native mobile app
- ❌ AI plate analysis
- ❌ Wearable integrations
- ❌ Public Champions Hall of Fame (post-Cohort 1)
- ❌ Subscription billing (cohort-only payment in v0)
- ❌ Referral system (Cohort 2)
- ❌ Public cohort leaderboard
- ❌ Real-time messaging in-app (we use WhatsApp)

Everything else is in scope.

---

## Sprint 1 (Days 1–7) — Foundation + Public Site

**Goal:** fitterverse.in is live with landing page + assessment + payment.

### Day 1
- [ ] Set up Next.js 14 (App Router) + Tailwind + shadcn/ui
- [ ] Set up Vercel deployment
- [ ] Set up Supabase project, env vars
- [ ] Set up GitHub repo, branch protection

### Day 2
- [ ] Build marketing layout (header, footer, hero)
- [ ] Implement landing page from `07_Marketing/Landing_Page_Copy.md`
- [ ] Mobile responsive pass

### Day 3
- [ ] Build assessment form UI (multi-step) from `04_Onboarding/Assessment_Questionnaire.md`
- [ ] Form state management (server-side actions or react-hook-form + zod)
- [ ] Save assessment data to Supabase

### Day 4
- [ ] Razorpay integration: order create endpoint, payment success webhook
- [ ] Payment success → trigger assessment form (if not done) → save record
- [ ] Refund policy + T&C visible on payment screen

### Day 5
- [ ] Build assessment output page from `04_Onboarding/Output_Template.md`
- [ ] Habit personalization logic (rules-based v0)
- [ ] Send output via email + WhatsApp template message

### Day 6
- [ ] AiSensy integration: send template messages (welcome, output, daily reminders)
- [ ] Set up basic WhatsApp message logging in DB
- [ ] Test end-to-end: pay → fill → receive WhatsApp + email

### Day 7
- [ ] Privacy policy page, T&C page, refund policy page
- [ ] Cookie banner
- [ ] Sentry + PostHog wired up
- [ ] First public soft launch — test with 2 friendly users

---

## Sprint 2 (Days 8–14) — User Dashboard + Tracker

**Goal:** Logged-in users can see their plan and submit daily check-ins.

### Day 8
- [ ] Supabase Auth: phone OTP sign-in
- [ ] Sign-in flow: post-payment user gets a magic link to set up account

### Day 9
- [ ] User dashboard layout (`/today`, `/tracker`, `/progress`, `/champion`)
- [ ] `/today` page: today's workout, daily habit checklist, today's nutrition focus

### Day 10
- [ ] Daily check-in form on `/tracker` (fields per `02_Cohort_Program/Habit_Tracker.md`)
- [ ] Submit to Supabase, immediate confirmation
- [ ] Habit score calculation logic (server-side)

### Day 11
- [ ] Photo upload UI (Day 1, mid-cohort, Day 21)
- [ ] Supabase Storage bucket with RLS (private to user)
- [ ] Image compression on upload

### Day 12
- [ ] `/progress` page: 7-day sparkline of habit score, weight trend, waist trend, streaks
- [ ] Use a chart library (recharts or chart.js)

### Day 13
- [ ] `/champion` page (visible Day 18+ of cohort): submission form per `03_Champion_Program/Submission_Template.md`

### Day 14
- [ ] End-to-end testing: full user journey from payment → 21 days of mock data → champion submission
- [ ] Fix bugs

---

## Sprint 3 (Days 15–21) — Admin / Coach Dashboard

**Goal:** Coach can see all their users, write notes, send messages.

### Day 15
- [ ] Admin route protection (role-based: coach, founder)
- [ ] `/admin/cohorts` — list of cohorts, status (upcoming, active, completed)
- [ ] `/admin/cohorts/[id]` — cohort overview (enrolment, completion %, NPS)

### Day 16
- [ ] `/admin/users` — list of all users in current cohort, with risk-tier color
- [ ] User card: name, day-count, last check-in, habit score, notes
- [ ] Filter: red, yellow, green, gold

### Day 17
- [ ] `/admin/users/[id]` — single user detail page
- [ ] All check-ins, photos (with permission), tracker timeline, message history
- [ ] Coach notes field

### Day 18
- [ ] WhatsApp send-from-dashboard (coach can DM via dashboard, message saved to log)
- [ ] Quick-reply templates from `05_WhatsApp_Ops/Daily_Message_Templates.md`

### Day 19
- [ ] Weekly report generation:
  - Auto-fill from tracker
  - Coach adds 2-line note
  - Trigger send Sunday 7 PM
- [ ] Champion judging UI (Day 22+ in real cohort)

### Day 20
- [ ] Founder dashboard: cohort-level KPIs, revenue, refund queue, escalation log
- [ ] Refund handling endpoint (Razorpay refund API)

### Day 21
- [ ] Internal QA pass with founder + coach
- [ ] Fix bugs
- [ ] Soft launch internal: 5 friends-and-family pay and onboard

---

## Sprint 4 (Days 22–30) — Polish + Cohort 1 Launch

**Goal:** Ship Cohort 1.

### Day 22–23
- [ ] Pre-launch ads live (per `07_Marketing/Ad_Creative_Briefs.md`)
- [ ] Landing page A/B test (3 hooks)
- [ ] Form completion analytics

### Day 24–25
- [ ] Daily auto-message scheduling (Inngest or Vercel Cron)
- [ ] Recovery sequence triggers (1-day-miss, 2-day-miss, 3-day-miss)

### Day 26–27
- [ ] Founder + coach do dry run with 3 mock users for full Day-1 experience
- [ ] Fix any onboarding friction discovered

### Day 28
- [ ] Open enrolment formally (target: 30 seats)
- [ ] Daily monitoring of conversion funnel

### Day 29
- [ ] Final 48-hour push: emails to assessment-starters, retargeting ads
- [ ] Cohort group set up on WhatsApp

### Day 30
- [ ] Cohort 1 Day 1 launch
- [ ] Founder + coach on standby all day

---

## Critical engineering decisions to lock in Day 1

1. **Single Next.js app, not monorepo (yet)** — split when pain shows up
2. **Drizzle ORM** for type-safe DB queries (Prisma is fine too — pick one and move on)
3. **Server actions for mutations** (Next.js App Router native pattern)
4. **No serverless function timeouts** > 10s — push long jobs to Inngest
5. **All WhatsApp send/receive logged to `whatsapp_messages` table** — even when we use AiSensy
6. **All admin actions logged to `audit_log` table** — always
7. **No public pages cached longer than 1 hour** — cohort dates change

---

## What to set up in VS Code on Day 1

```bash
# Clone or init
gh repo create fitterverse --private
cd fitterverse

# Next.js 14
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Core deps
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add drizzle-orm postgres
pnpm add zod react-hook-form @hookform/resolvers
pnpm add razorpay
pnpm add @sentry/nextjs posthog-js
pnpm add date-fns lucide-react

# Dev deps
pnpm add -D drizzle-kit @types/node

# shadcn/ui
pnpm dlx shadcn-ui@latest init

# Initial folder structure (use what's in Tech_Stack.md)
```

Then connect:
- Supabase URL + anon key + service key in `.env`
- Razorpay key + secret in `.env`
- AiSensy API key in `.env`
- Vercel deployment to GitHub main branch

You can run `pnpm dev` and start on the landing page in the same hour.

---

## Owners (suggested)

- Founder: product decisions, cohort ops, content, ads, sales
- 1 dev (you or hired): full-stack Next.js + Supabase
- 1 coach: cohort delivery
- 1 designer (part-time): logo, landing visuals, reels templates

If solo: prioritize the 4 sprints above. Cohort 1 of 30 users is doable solo if you sacrifice ad polish for product readiness.
