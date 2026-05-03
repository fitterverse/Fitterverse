# Fitterverse — Application code

This folder will hold the working code (Next.js app + Supabase config + jobs).

It's empty by design — when you open this folder in VS Code, run the bootstrap commands from `08_Product_Tech/MVP_Build_Plan.md` to scaffold a Next.js 14 project here.

## Quick start (Day 1 in VS Code)

```bash
cd app

# Scaffold
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

# Run
pnpm dev
```

## Then

1. Set up `.env.local` with Supabase, Razorpay, AiSensy, PostHog keys
2. Build the landing page first — copy from `../07_Marketing/Landing_Page_Copy.md`
3. Follow `../08_Product_Tech/MVP_Build_Plan.md` sprint by sprint
4. Reference `../08_Product_Tech/Database_Schema.md` for the DB
5. Reference `../08_Product_Tech/User_Flows.md` for what to wire up
6. Reference `../08_Product_Tech/WhatsApp_Integration.md` for AiSensy integration

## Where docs live (for the dev's mental model)

- **Why** we're building this → `../01_Strategy/`
- **What** we're building → `../02_Cohort_Program/`, `../03_Champion_Program/`
- **How users see it** → `../04_Onboarding/`, `../05_WhatsApp_Ops/`, `../07_Marketing/`
- **How code is structured** → this folder + `../08_Product_Tech/`
- **What we measure** → `../09_Metrics/`
- **What we promise legally** → `../10_Legal/`

If anything in the code conflicts with the docs, the docs are the source of truth. Update both, never just code.
