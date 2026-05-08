# Fitterverse — Complete Architecture & Codebase Guide

> **Who this is for:** Anyone — coder or not — who wants to understand exactly how Fitterverse is built, what every single file does, how data moves through the system, and how to rebuild everything from scratch if needed.
>
> **How to read this:** Start with sections 1–4 for the big picture. Then jump to section 6 or 7 for the specific app you care about. Use the Table of Contents to navigate.

---

## Table of Contents

1. [What is Fitterverse?](#1-what-is-fitterverse)
2. [The Two Apps — Big Picture](#2-the-two-apps--big-picture)
3. [Repository Folder Structure](#3-repository-folder-structure)
4. [Tech Stack — Every Tool Explained](#4-tech-stack--every-tool-explained)
5. [The Database — Supabase](#5-the-database--supabase)
6. [Consumer App — product/](#6-consumer-app--product)
7. [CRM App — crm/](#7-crm-app--crm)
8. [How Authentication Works](#8-how-authentication-works)
9. [How Data Flows — Step by Step](#9-how-data-flows--step-by-step)
10. [Deployment & Hosting](#10-deployment--hosting)
11. [Environment Variables & Secrets](#11-environment-variables--secrets)
12. [Running Locally](#12-running-locally)
13. [Key Design Decisions](#13-key-design-decisions)
14. [Known Gotchas & Critical Notes](#14-known-gotchas--critical-notes)
15. [Git Workflow & Deployment Process](#15-git-workflow--deployment-process)
16. [Full Dependency Reference](#16-full-dependency-reference)
17. [Complete SQL Schemas](#17-complete-sql-schemas)

---

## 1. What is Fitterverse?

Fitterverse is a **habit-based nutrition and fitness accountability app** for busy Indian professionals. The core product is the **21-Day Reset** — a cohort programme where users pay ₹999 to track their meals and workouts daily for 21 days and build sustainable healthy habits.

**The product in one sentence:** Users log what they ate (Healthy / Medium / Junk / Skipped), track their workouts, earn points (max 9/day), and build a daily streak. A streak requires ≥6 points per day. The app gives a 2-day grace period before breaking a streak, so one bad day doesn't ruin progress.

**The two sides of the product:**

| Side | Who uses it | URL |
|---|---|---|
| Consumer App | Users (people tracking meals + workouts) | fitterverse.in |
| CRM | Internal team (admin, coaches, nutritionists, trainers) | crm.fitterverse.in |

These are **two completely separate websites** that share the same database. They don't call each other — they both read and write to the same Supabase database independently.

---

## 2. The Two Apps — Big Picture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                           │
│                                                                  │
│   fitterverse.in                │   crm.fitterverse.in           │
│   (Consumer App)                │   (CRM)                        │
│                                 │                                │
│   - Login / Signup              │   - Team login (Supabase auth) │
│   - Onboarding quiz (once)      │   - Dashboard stats overview   │
│   - Log meals daily             │   - All users list + search    │
│   - Log workouts                │   - Individual user deep-dive  │
│   - View assigned meal plan     │   - Create meal plans          │
│   - View assigned workout plan  │   - Create workout plans       │
│   - Earn badges / streaks       │   - Edit plans (today+future)  │
│   - View progress & history     │   - Manage team members/roles  │
└──────────────┬──────────────────┴──────────────┬─────────────────┘
               │                                 │
               │ reads/writes                    │ reads/writes
               │ (service role key)              │ (service role key)
               ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                          │
│    Hosted cloud database — single source of truth for all data   │
│                                                                  │
│   Consumer tables:         CRM table:       Shared tables:       │
│   - profiles               - crm_users      - meal_plans         │
│   - meal_logs                               - meal_plan_items    │
│   - daily_scores                            - workout_plans      │
│   - user_streaks                            - workout_plan_days  │
│   - user_badges                             - workout_plan_exs   │
│   - workout_logs                            - food_items (IFCT)  │
└──────────────────────────────────────────────────────────────────┘
               │
               │ user identity only (not data storage)
               ▼
┌────────────────────────────┐
│      FIREBASE AUTH         │
│   (consumer app only)      │
│   - Email + password login │
│   - Google sign-in         │
│   - Issues Firebase UIDs   │
└────────────────────────────┘
```

**Key insight:** The CRM does NOT use Firebase Auth. CRM accounts are stored in the `crm_users` table in Supabase with hashed passwords. Consumer users and CRM team members are completely separate identity systems.

---

## 3. Repository Folder Structure

```
Fitterverse/                         ← Root of the git repo (github.com/fitterverse/Fitterverse)
│
├── ARCHITECTURE.md                  ← THIS FILE — complete guide to the codebase
├── AGENTS.md                        ← Instructions for AI coding assistants
├── CLAUDE.md                        ← References AGENTS.md
├── README.md                        ← Brief project description
│
├── business/                        ← Non-technical docs. NEVER deployed, never code.
│   ├── 01_Strategy/                 ← Market positioning, 90-day roadmap
│   ├── 02_Cohort_Program/           ← 21-Day Reset playbook, nutrition framework
│   ├── 03_Champion_Program/         ← Competition rules, judging criteria
│   ├── 04_Onboarding/               ← Assessment question bank
│   ├── 05_WhatsApp_Ops/             ← Message templates for coaches
│   ├── 08_Product_Tech/             ← Technical planning docs, DB schema drafts
│   ├── 09_Metrics/                  ← KPI tracking spreadsheets
│   └── 10_Legal/                    ← Terms, disclaimers
│
├── product/                         ← Consumer app (fitterverse.in)
│   ├── apphosting.yaml              ← Firebase App Hosting config (runtime + secrets)
│   ├── firebase.json                ← Firebase project + hosting config
│   ├── next.config.ts               ← Next.js framework config (Turbopack root anchor)
│   ├── package.json                 ← All app dependencies
│   ├── pnpm-lock.yaml               ← Exact pinned versions of every package installed
│   ├── pnpm-workspace.yaml          ← *** CRITICAL: marks this folder as standalone workspace ***
│   ├── components.json              ← shadcn/ui component configuration
│   ├── postcss.config.mjs           ← PostCSS config required for Tailwind CSS
│   ├── tsconfig.json                ← TypeScript compiler settings
│   ├── .env.local                   ← Local dev secrets (git-ignored, NOT committed)
│   ├── .env.local.example           ← Template showing which env vars are needed
│   ├── supabase/
│   │   ├── schema.sql               ← Original 5-table consumer schema
│   │   └── migrations/
│   │       ├── 002_add_food_items.sql   ← IFCT 2017 food_items table (+ GIN index)
│   │       └── 003_add_plan_tables.sql  ← 5 plan tables (meal/workout plans + items)
│   └── src/
│       ├── app/                     ← Pages (URL routes) and API routes
│       │   ├── layout.tsx           ← Root HTML shell: fonts, dark theme, toast container
│       │   ├── globals.css          ← Design tokens (colors, spacing) via CSS variables
│       │   ├── robots.ts            ← robots.txt generation (allow all)
│       │   ├── sitemap.ts           ← XML sitemap generation (SEO)
│       │   ├── (public)/            ← Route group: no auth required
│       │   │   ├── login/page.tsx   ← Login form (email + Google sign-in)
│       │   │   ├── signup/page.tsx  ← New account creation form
│       │   │   └── onboarding/page.tsx ← 10-step health profile quiz (once per user)
│       │   ├── (app)/               ← Route group: ALL pages inside require login
│       │   │   ├── layout.tsx       ← Auth gate + onboarding check + BottomNav wrapper
│       │   │   ├── dashboard/page.tsx  ← Today's meal tracking (legacy name, still /dashboard)
│       │   │   ├── diet/page.tsx    ← Diet page: today's plan snippet + log + full week view
│       │   │   ├── workout/page.tsx ← Workout page: today's plan + logger + full week view
│       │   │   ├── history/page.tsx ← Monthly calendar + last 7 days meals
│       │   │   ├── progress/page.tsx   ← Stats + charts + workout history
│       │   │   └── badges/page.tsx  ← Badge collection (earned + locked)
│       │   ├── (website)/           ← Route group: public marketing site
│       │   │   ├── layout.tsx       ← Marketing site wrapper (header + footer)
│       │   │   ├── page.tsx         ← Homepage / landing page
│       │   │   ├── blog/
│       │   │   │   ├── page.tsx     ← Blog index (lists all posts)
│       │   │   │   └── [slug]/page.tsx ← Individual blog post (Markdown rendered)
│       │   │   ├── privacy-policy/page.tsx
│       │   │   └── terms/page.tsx
│       │   └── api/
│       │       └── auth/
│       │           └── session/
│       │               └── route.ts ← POST (create session) + DELETE (sign out)
│       ├── components/
│       │   ├── expandable-section.tsx  ← Client toggle: shows/hides children on tap
│       │   └── ui/                  ← shadcn/ui components (copied into codebase)
│       │       ├── button.tsx, input.tsx, label.tsx, card.tsx
│       │       ├── badge.tsx, progress.tsx, select.tsx
│       │       ├── separator.tsx, textarea.tsx, sonner.tsx
│       ├── content/
│       │   └── blog/                ← Markdown files for blog posts
│       ├── features/                ← Feature-sliced code (server + client per domain)
│       │   ├── auth/
│       │   │   ├── client/firebase.ts      ← Firebase app init + auth + Google provider
│       │   │   └── server/session.ts       ← (legacy location, now at src/server/session.ts)
│       │   ├── badges/
│       │   │   ├── components/badge-card.tsx
│       │   │   └── server/queries.ts
│       │   ├── dashboard/
│       │   │   ├── components/score-ring.tsx
│       │   │   └── server/queries.ts       ← getTodayData()
│       │   ├── history/
│       │   │   └── server/queries.ts       ← getHistoryData(days)
│       │   ├── meals/
│       │   │   ├── components/meal-card.tsx
│       │   │   └── server/actions.ts       ← saveMeal(), recomputeDailyScore(), updateStreak()
│       │   ├── navigation/
│       │   │   └── components/bottom-nav.tsx
│       │   ├── onboarding/
│       │   │   └── server/actions.ts       ← saveOnboarding()
│       │   ├── plans/                      ← Assigned plan display (consumer-side)
│       │   │   ├── components/
│       │   │   │   ├── meal-plan-view.tsx      ← Full 7-day meal plan grid
│       │   │   │   ├── today-plan-snippet.tsx  ← Compact today-only meal plan card
│       │   │   │   ├── workout-plan-view.tsx   ← Full 7-day workout plan
│       │   │   │   └── today-workout-snippet.tsx ← Compact today-only workout card
│       │   │   └── server/queries.ts           ← getActiveMealPlan(), getActiveWorkoutPlan()
│       │   ├── profile/
│       │   │   └── server/queries.ts
│       │   ├── progress/
│       │   │   └── components/progress-charts.tsx
│       │   ├── streaks/
│       │   │   ├── components/streak-display.tsx
│       │   │   └── lib/streak.ts           ← calculateNewStreak(), getBadgesToAward()
│       │   ├── website/
│       │   │   ├── components/             ← blog-markdown.tsx, json-ld.tsx, site-header.tsx, site-footer.tsx
│       │   │   └── lib/                    ← blog.ts (reads .md files), site.ts (metadata)
│       │   └── workouts/                   ← Workout logging feature
│       │       ├── components/
│       │       │   ├── workout-logger.tsx      ← Log a workout session (exercise type + duration)
│       │       │   ├── workout-list.tsx        ← List of logged workout sessions
│       │       │   ├── today-workout-card.tsx  ← Today's workout summary card
│       │       │   └── calorie-balance-card.tsx ← BMR/TDEE/calorie balance display
│       │       ├── lib/calorie-math.ts         ← MET-based calorie burn calculation + BMR/TDEE
│       │       └── server/
│       │           ├── actions.ts          ← logWorkout(), deleteWorkout()
│       │           └── queries.ts          ← getTodayWorkouts(), getWorkoutHistory(), getTodayCaloriesConsumed()
│       ├── proxy.ts                 ← Middleware (Next.js 16 convention, replaces middleware.ts)
│       ├── server/
│       │   ├── session.ts           ← Create / read / delete __fv_session JWT cookie
│       │   └── supabase/
│       │       └── server.ts        ← Supabase client with service role key (server only)
│       └── shared/
│           ├── lib/utils.ts         ← cn() class-merge utility
│           └── types/
│               ├── index.ts         ← All base types + POINTS map + BADGE_DEFINITIONS + workout types
│               └── plans.ts         ← Plan types: MealPlan, MealPlanItem, WorkoutPlan, WorkoutPlanDay,
│                                       WorkoutPlanExercise, FoodItem, DayOfWeek, MealSlot, PlanStatus
│                                       + display helpers: DAY_LABELS, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS
│                                       + scaleMacros() utility
│
└── crm/                             ← CRM app (crm.fitterverse.in)
    ├── apphosting.yaml              ← Firebase App Hosting config for CRM
    ├── firebase.json                ← Firebase project config
    ├── next.config.ts               ← *** Has turbopack.root + outputFileTracingRoot anchors ***
    ├── package.json                 ← CRM-specific dependencies (leaner than consumer app)
    ├── pnpm-lock.yaml               ← Exact pinned versions
    ├── pnpm-workspace.yaml          ← *** CRITICAL: marks crm/ as standalone workspace ***
    ├── postcss.config.mjs           ← PostCSS config for Tailwind
    ├── tsconfig.json                ← TypeScript settings (scoped to src/ only)
    └── src/
        ├── app/
        │   ├── layout.tsx           ← Root HTML: noindex meta, Toaster (top-right)
        │   ├── globals.css          ← Light-mode styling (whites, grays, green accents)
        │   ├── page.tsx             ← Root "/" — redirects based on session
        │   ├── login/page.tsx       ← Split-screen login: branded left + form right
        │   ├── (dashboard)/         ← Route group: ALL pages inside require login
        │   │   ├── layout.tsx       ← Auth gate + Sidebar wrapper for all CRM pages
        │   │   ├── dashboard/page.tsx      ← Stats overview (user counts, top streaks)
        │   │   ├── users/
        │   │   │   ├── page.tsx            ← Searchable user table
        │   │   │   └── [id]/
        │   │   │       ├── page.tsx        ← User deep-dive + plan list
        │   │   │       ├── meal-plan/
        │   │   │       │   ├── new/page.tsx       ← Create new meal plan
        │   │   │       │   └── [planId]/page.tsx  ← Edit existing meal plan
        │   │   │       └── workout-plan/
        │   │   │           ├── new/page.tsx       ← Create new workout plan
        │   │   │           └── [planId]/page.tsx  ← Edit existing workout plan
        │   │   └── team/
        │   │       ├── page.tsx            ← Team member list + inline role editor
        │   │       └── new/page.tsx        ← Add new team member form
        │   └── api/
        │       ├── auth/
        │       │   ├── login/route.ts      ← POST: verify CRM login, issue session cookie
        │       │   └── logout/route.ts     ← POST: delete session cookie
        │       ├── foods/
        │       │   └── search/route.ts     ← GET /api/foods/search?q=...&limit=8
        │       └── team/route.ts           ← GET/POST/PATCH crm_users (admin only)
        ├── features/
        │   ├── auth/
        │   │   └── server/password.ts      ← hashPassword() + verifyPassword() using scrypt
        │   ├── dashboard/
        │   │   └── server/queries.ts       ← CRM dashboard stats queries
        │   ├── navigation/
        │   │   └── components/sidebar.tsx  ← Left nav: logo, links (role-filtered), user + logout
        │   ├── plans/                      ← Plan builder (CRM side — create/edit plans)
        │   │   ├── components/
        │   │   │   ├── meal-plan-builder.tsx    ← 7×6 grid builder (Mon–Sun × 6 meal slots)
        │   │   │   └── workout-plan-builder.tsx ← 7 day card builder with exercise rows
        │   │   └── server/
        │   │       ├── actions.ts          ← saveMealPlanAction, updateMealPlanAction,
        │   │       │                          saveWorkoutPlanAction, updateWorkoutPlanAction
        │   │       └── queries.ts          ← getMealPlanWithItems, getWorkoutPlanWithDays,
        │   │                                  getUserMealPlans, getUserWorkoutPlans
        │   ├── team/
        │   │   ├── components/role-toggle.tsx   ← Inline role editor client component
        │   │   └── server/queries.ts
        │   └── users/
        │       └── server/queries.ts            ← getUserDetail() (profile + streak + badges + meals)
        └── server/
            ├── session.ts           ← Create / read / delete __crm_session JWT cookie
            └── supabase.ts          ← Single Supabase client with service role key
```

---

## 4. Tech Stack — Every Tool Explained

Think of building a website like building a house. Each tool is a different trade or material.

---

### Next.js 16 — The Main Framework
**Plain English:** The skeleton of the house. Handles routing, page rendering, and backend logic all in one project.

**What it does:**
- **Routing:** Every folder in `src/app/` becomes a URL. `src/app/(app)/diet/page.tsx` → `yoursite.com/diet`.
- **Route Groups:** Folders wrapped in `(parentheses)` don't appear in the URL — they're used to share layouts. `(app)/` = logged-in app pages. `(public)/` = login/signup. `(website)/` = marketing site.
- **App Router:** The newer routing system (since Next.js 13). Pages live in `src/app/`, not `src/pages/`.
- **Server Components:** Pages that fetch data are rendered on the server (faster first load, better SEO, secure — DB keys never reach the browser).
- **Client Components:** Interactive parts (forms, buttons with state) are marked `'use client'` and run in the browser.
- **Server Actions:** Functions marked `'use server'` that can be called directly from React components — no separate API server needed.
- **API Routes:** `route.ts` files act as REST API endpoints when you need traditional HTTP calls (used for auth and food search).

**Version note:** We use Next.js 16 with Turbopack (the new, faster bundler that replaces Webpack).

---

### TypeScript — The Language
**Plain English:** JavaScript with labels on every variable and function. Catches mistakes before they become bugs.

If a function expects a number and you pass a text string, TypeScript warns you immediately at code-writing time. Files end in `.ts` (logic) or `.tsx` (UI with HTML-like JSX).

---

### Tailwind CSS v4 — Styling
**Plain English:** A huge set of LEGO pieces for styling. Instead of writing separate CSS files, you add class names directly to elements.

`className="text-green-500 font-bold rounded-xl p-4"` → green text, bold, rounded corners, padding.

**Version 4 change:** The config lives entirely in `globals.css` (not a `tailwind.config.ts` file). CSS custom properties define the design tokens.

---

### shadcn/ui — Pre-built UI Components (consumer app only)
**Plain English:** Ready-made, styled building blocks you don't have to create from scratch.

Buttons, inputs, cards, dropdowns — all pre-designed. Crucially, these are **copied into your codebase** (inside `src/components/ui/`), not locked in a black-box library. So you can modify them freely.

---

### Supabase — The Database
**Plain English:** A cloud-hosted database with a nice web dashboard. Like a giant, always-on spreadsheet that both apps read and write to.

Technically it's PostgreSQL — the most popular open-source database in the world. Supabase adds a friendly dashboard, auto-generated REST API, and easy JavaScript integration.

**Project URL:** `https://wwzabsfwfojsizexptxe.supabase.co`

**How we connect:** The `@supabase/supabase-js` JavaScript library. All writes and sensitive reads use the **service role key** on the server — this key bypasses Row Level Security and has full access. It is never sent to the browser.

---

### Firebase Auth — User Identity (consumer app only)
**Plain English:** Google's login service. Manages passwords, Google sign-in, and password resets so we don't have to build any of that ourselves.

When a user logs in, Firebase validates their credentials and returns a **UID** — a unique string like `"Ua3mK9j2pNxY..."`. This UID becomes the user's ID everywhere in Supabase (the `id` column in `profiles`, the `user_id` column in all other tables).

**Why Firebase instead of Supabase Auth:** Firebase has excellent, battle-tested Google sign-in. The consumer app needs Google sign-in to remove friction at signup.

---

### jose — JWT Session Tokens
**Plain English:** A library that creates and verifies cryptographically signed tokens ("wristbands") that prove who you are.

After login, the server creates a JWT (JSON Web Token) containing your user ID, signs it with a secret key, and stores it in a cookie. Every subsequent request, the server reads the cookie and verifies it. If valid — you're in. If tampered with or expired — you're out.

**Cookies used:**
- `__fv_session` — consumer app, 14 days, signed with `SESSION_SECRET`
- `__crm_session` — CRM, 14 days, signed with `CRM_SESSION_SECRET`

Both are `httpOnly` (JavaScript in the browser cannot read them — only the server can) and `secure` in production (only sent over HTTPS).

---

### Node.js Crypto (scrypt) — CRM Password Hashing
**Plain English:** Built into Node.js (no extra library). Scrambles passwords so even if someone steals the database, they can't read the real passwords.

Process:
1. When creating a CRM account: generate a random 16-byte salt → run scrypt on `password + salt` → store `"salt:hash"` in the database.
2. When verifying login: split `"salt:hash"` → run scrypt on the entered password + the stored salt → compare hashes using `timingSafeEqual` (prevents timing attacks).

---

### Framer Motion — Animations (consumer app)
**Plain English:** Makes things slide and fade smoothly instead of jumping.

Powers the animated step transitions in the onboarding quiz. Each question slides in from the right, previous question slides out to the left.

---

### Recharts — Charts (consumer app)
**Plain English:** Draws charts in the browser.

Powers the bar chart on the Progress page showing daily scores. Must be a client component because chart libraries need the browser's DOM to draw.

---

### Sonner — Toast Notifications
**Plain English:** Those small popup messages that appear and disappear — "Breakfast saved! +3 pts" or "Plan published to user!".

Used in both apps. Consumer app: `Toaster position="top-center"`. CRM: `Toaster position="top-right"`.

---

### date-fns — Date Utilities
**Plain English:** A toolbox for working with dates. Formats them, compares them, adds/subtracts days, checks if a date is in the current week.

Key usages:
- `format(new Date(), 'yyyy-MM-dd')` → `"2026-05-08"`
- `isBefore(dayDate, startOfDay(new Date()))` → detect past days (for plan locking)
- `isThisWeek(parseISO(plan.week_start), { weekStartsOn: 1 })` → is this plan for the current week?
- `((date.getDay() + 6) % 7)` → convert JS Sunday=0 to ISO Monday=0

---

### Lucide React — Icons
**Plain English:** A library of 1000+ clean, consistent SVG icons. Used as React components: `<Flame size={20} />`, `<Users />`, `<ArrowLeft />`, `<Moon />`, `<ChevronLeft />`.

---

### Firebase App Hosting — Deployment Platform
**Plain English:** Google's service that takes our code from GitHub, builds it, and serves it to users worldwide.

Automatically redeploys whenever code is pushed to the `main` branch. Manual rollouts can also be triggered via `firebase apphosting:rollouts:create`.

**Two separate backends:**
- `fitterverse-app` → builds from `product/` → serves `fitterverse.in`
- `fitterverse-crm` → builds from `crm/` → serves `crm.fitterverse.in`

---

### pnpm — Package Manager
**Plain English:** The tool that installs JavaScript libraries. Like an app store for code packages.

Faster and more disk-efficient than the standard `npm`. Reads `package.json` and installs everything into `node_modules/`. The `pnpm-lock.yaml` file pins exact versions so every machine gets identical installs.

---

### System Font Stack — Typography (consumer app)
**Plain English:** Defines the fonts used in the app without depending on a build-time network fetch.

The consumer app uses a **system sans-serif stack** for primary UI text and a **system monospace stack** for code-like text. These are provided via CSS variables in `src/app/globals.css`, which keeps local builds deterministic and avoids external font fetch failures.

---

## 5. The Database — Supabase

All data lives in one Supabase project (`wwzabsfwfojsizexptxe.supabase.co`). Both apps connect using the same service role key.

**Row Level Security:** All tables have RLS enabled as a safety net. However, all actual DB operations use the service role key (which bypasses RLS). RLS rules are not explicitly written — the service role bypasses them anyway. The exception is `food_items` which has a public read policy for completeness.

**Total tables: 12**
- 5 consumer tables (profiles, meal_logs, daily_scores, user_streaks, user_badges)
- 1 workout logging table (workout_logs)
- 1 CRM team table (crm_users)
- 1 food database table (food_items)
- 4 plan tables (meal_plans, meal_plan_items, workout_plans, workout_plan_days, workout_plan_exercises)

---

### Table 1: `profiles`
One row per registered consumer user. Created on first login.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | text | (required) | Firebase UID — the user's permanent identifier |
| `email` | text | null | Email address |
| `full_name` | text | null | e.g. "Priya Sharma" |
| `age` | integer | null | e.g. 28 |
| `weight_kg` | decimal(5,2) | null | e.g. 68.50 |
| `height_cm` | decimal(5,1) | null | e.g. 162.0 |
| `goal_weight_kg` | decimal(5,2) | null | e.g. 60.00 |
| `activity_level` | text | null | One of: `sedentary` / `light` / `moderate` / `active` |
| `practices_fasting` | boolean | false | Does this user fast? |
| `meals_per_day` | integer | 3 | How many meals they eat |
| `breakfast_time` | text | null | e.g. "08:00" |
| `lunch_time` | text | null | e.g. "13:00" |
| `dinner_time` | text | null | e.g. "20:00" |
| `calorie_limit_per_meal` | integer | 650 | Target calories per meal |
| `dietary_restrictions` | text | null | e.g. "vegetarian", "vegan", "jain", "none" |
| `diet_goal` | text | null | e.g. "weight_loss", "better_energy", "gain_muscle" |
| `biggest_challenge` | text | null | e.g. "junk_cravings", "portion_control" |
| `motivation` | text | null | Free-text from onboarding |
| `onboarding_completed` | boolean | false | Has the user finished the 10-question quiz? |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

---

### Table 2: `meal_logs`
One row per meal per day per user. Maximum 3 rows per user per day.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Auto-generated unique ID |
| `user_id` | text | (required) | Firebase UID |
| `date` | date | (required) | e.g. `2026-05-04` (always YYYY-MM-DD string) |
| `meal_type` | text | (required) | One of: `breakfast` / `lunch` / `dinner` |
| `rating` | text | null | One of: `healthy` / `medium` / `junk` / `skipped` |
| `calories` | integer | null | Optional, user-entered |
| `note` | text | null | Optional free text |
| `points` | integer | null | Stored at save time: healthy=3, medium=2, junk=1, skipped=3 |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Unique constraint:** `(user_id, date, meal_type)` — only one breakfast per user per day. If breakfast is logged twice, it **upserts** (updates the existing row).

---

### Table 3: `daily_scores`
One row per user per day — the computed total for that day.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | |
| `user_id` | text | (required) | Firebase UID |
| `date` | date | (required) | e.g. `2026-05-04` |
| `total_points` | integer | 0 | Sum of all meal points for the day (0–9) |
| `meals_logged` | integer | 0 | How many meals were logged (0–3) |
| `is_streak_day` | boolean | false | `total_points >= 6` |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Unique constraint:** `(user_id, date)` — one row per day. Recomputed every time any meal is saved.

---

### Table 4: `user_streaks`
One row per user — their current streak state.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `user_id` | text | (PRIMARY KEY) | Firebase UID |
| `current_streak` | integer | 0 | e.g. 7 (days in current streak) |
| `longest_streak` | integer | 0 | All-time personal best |
| `consecutive_bad_days` | integer | 0 | Bad days in a row (0–2 before streak breaks on 3rd) |
| `last_updated` | date | null | Last date streak was calculated |
| `streak_start_date` | date | null | When the current streak started |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Streak rules:**
- **Good day:** `total_points >= 6` → streak increments by 1, `consecutive_bad_days` resets to 0
- **Bad day:** `total_points < 6` → `consecutive_bad_days` increments by 1
- **Streak breaks:** when `consecutive_bad_days >= 3` → `current_streak` resets to 0
- **Grace period:** 2 bad days allowed before breaking on the 3rd
- **Skipped/Fasting:** counts as 3 points — fasting is never penalised
- **Idempotent:** If `last_updated == today`, streak is not recalculated

---

### Table 5: `user_badges`
One row per badge earned per user.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | |
| `user_id` | text | (required) | Firebase UID |
| `badge_slug` | text | (required) | e.g. "streak_7", "first_meal" |
| `earned_at` | timestamptz | now() | When awarded |

**Unique constraint:** `(user_id, badge_slug)` — can't earn the same badge twice.

**All 9 badges:**

| Slug | Name | How to earn |
|---|---|---|
| `first_meal` | First Bite | Log your very first meal |
| `perfect_day` | Perfect Day | Score 9/9 in one day |
| `streak_1` | Getting Started | 1-day streak |
| `streak_3` | Three-peat | 3-day streak |
| `streak_7` | One Full Week | 7-day streak |
| `streak_21` | 21-Day Warrior | 21-day streak |
| `streak_90` | Quarter Master | 90-day streak |
| `streak_180` | Half Year Hero | 180-day streak |
| `streak_365` | Legend | 365-day streak |

---

### Table 6: `workout_logs`
One row per workout session logged by a consumer user.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | |
| `user_id` | text | (required) | Firebase UID |
| `date` | date | (required) | YYYY-MM-DD |
| `exercise_type` | text | (required) | e.g. "running", "cycling", "yoga", "strength" |
| `duration_minutes` | integer | (required) | How long the session lasted |
| `calories_burned` | integer | null | MET-estimated calories burned |
| `notes` | text | null | Optional free text |
| `created_at` | timestamptz | now() | |

**MET-based calorie calculation:** `calories_burned = MET × weight_kg × (duration_minutes / 60)`. MET values are defined in `features/workouts/lib/calorie-math.ts`.

---

### Table 7: `crm_users`
CRM team member accounts. Completely separate from consumer users.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | |
| `email` | text UNIQUE | (required) | e.g. "priya@fitterverse.in" |
| `password_hash` | text | (required) | Format: `"salt:hash"` (scrypt) |
| `full_name` | text | (required) | e.g. "Priya Sharma" |
| `role` | text | `nutritionist` | One of: `admin` / `master_coach` / `nutritionist` / `trainer` / `sales` |
| `is_active` | boolean | true | Can they log in? Deactivate without deleting. |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Seeded admin:** `fitterverse.in@gmail.com` / `Fitterverse@123` (hash stored, not plaintext).

---

### Table 8: `food_items`
542 foods from the **IFCT 2017 (Indian Food Composition Tables)** published by the National Institute of Nutrition, Hyderabad. Seeded once using `product/scripts/seed-food-items.ts`.

| Column | Type | What it stores |
|---|---|---|
| `id` | serial (auto int) | Auto-incrementing integer ID |
| `code` | text UNIQUE | IFCT food code (e.g. "A001") |
| `name` | text | Food name in English (e.g. "Wheat flour, atta") |
| `scientific` | text | Scientific name |
| `lang_names` | text | Names in other Indian languages |
| `food_group` | text | e.g. "Cereals and millets" |
| `energy_kcal` | numeric(8,2) | Per 100g |
| `water_g` | numeric(8,2) | Per 100g |
| `protein_g` | numeric(8,2) | Per 100g |
| `fat_g` | numeric(8,2) | Per 100g |
| `carbs_g` | numeric(8,2) | Per 100g |
| `fiber_g` | numeric(8,2) | Per 100g |
| `sugar_g` | numeric(8,2) | Per 100g |
| `sat_fat_g` | numeric(8,2) | Per 100g |
| `cholesterol_mg` | numeric(8,2) | Per 100g |
| `vit_c_mg` | numeric(8,3) | Per 100g |
| `vit_a_mcg` | numeric(8,3) | Per 100g (retinol) |
| `thiamine_mg` | numeric(8,4) | Per 100g |
| `riboflavin_mg` | numeric(8,4) | Per 100g |
| `niacin_mg` | numeric(8,3) | Per 100g |
| `vit_b6_mg` | numeric(8,4) | Per 100g |
| `folate_mcg` | numeric(8,2) | Per 100g |
| `beta_carotene_mcg` | numeric(8,2) | Per 100g |
| `calcium_mg` | numeric(8,2) | Per 100g |
| `iron_mg` | numeric(8,3) | Per 100g |
| `magnesium_mg` | numeric(8,2) | Per 100g |
| `phosphorus_mg` | numeric(8,2) | Per 100g |
| `potassium_mg` | numeric(8,2) | Per 100g |
| `sodium_mg` | numeric(8,2) | Per 100g |
| `zinc_mg` | numeric(8,3) | Per 100g |

**GIN index** on `to_tsvector('english', name)` for full-text search. **Important note:** IFCT 2017 uses raw ingredients, not prepared dishes. Search "wheat flour atta" not "roti" — nutritionists should search ingredient names.

**Food search API:** `GET /api/foods/search?q=chicken&limit=8` in the CRM returns id/name/food_group/energy_kcal/protein_g/fat_g/carbs_g/fiber_g. Used by the meal plan builder autocomplete.

---

### Table 9: `meal_plans`
One plan per user per week, created by CRM nutritionists/admins.

| Column | Type | What it stores |
|---|---|---|
| `id` | uuid | Plan ID |
| `user_id` | text | Firebase UID of the consumer user this plan is for |
| `created_by` | text | Firebase UID of the CRM user who created it |
| `title` | text | e.g. "Week 3 — Weight Loss Plan" |
| `week_start` | date | The Monday of the target week (e.g. `2026-05-06`) |
| `status` | text | `draft` / `published` / `archived` |
| `notes` | text | Optional admin notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**How the consumer sees it:** The most recent `published` plan for a user is fetched by `getActiveMealPlan()`. Only shown on the consumer app if `isThisWeek(parseISO(plan.week_start), { weekStartsOn: 1 })` is true.

---

### Table 10: `meal_plan_items`
One row per food per meal slot per day within a meal plan.

| Column | Type | What it stores |
|---|---|---|
| `id` | uuid | |
| `meal_plan_id` | uuid FK → meal_plans | |
| `day_of_week` | integer (0–6) | 0=Monday, 6=Sunday (ISO week) |
| `meal_slot` | text | One of: `breakfast` / `morning_snack` / `lunch` / `afternoon_snack` / `dinner` / `evening_snack` |
| `food_item_id` | integer FK → food_items | Reference to IFCT food (nullable if food was manually named) |
| `food_name` | text | Denormalized name — survives if food_items row is ever edited |
| `quantity_g` | numeric | Serving size in grams |
| `energy_kcal` | numeric | Pre-computed: `food.energy_kcal × quantity_g / 100` |
| `protein_g` | numeric | Pre-computed at save time |
| `fat_g` | numeric | Pre-computed at save time |
| `carbs_g` | numeric | Pre-computed at save time |
| `fiber_g` | numeric | Pre-computed at save time |
| `display_order` | integer | Order within a slot |

**Why macros are denormalized:** Nutrition values should reflect what the plan said at creation time. If the IFCT data is ever corrected, historical plans remain accurate.

---

### Table 11: `workout_plans`
Same structure as `meal_plans` but for workout programming.

| Column | Type | What it stores |
|---|---|---|
| `id` | uuid | |
| `user_id` | text | Firebase UID |
| `created_by` | text | CRM user UID |
| `title` | text | e.g. "Strength + Cardio — May Week 2" |
| `week_start` | date | Monday of target week |
| `status` | text | `draft` / `published` / `archived` |
| `notes` | text | |

---

### Table 12: `workout_plan_days`
One row per day in a workout plan (7 rows per plan).

| Column | Type | What it stores |
|---|---|---|
| `id` | uuid | |
| `workout_plan_id` | uuid FK → workout_plans | |
| `day_of_week` | integer (0–6) | 0=Monday |
| `label` | text | e.g. "Push Day", "Active Recovery" |
| `is_rest_day` | boolean | If true, no exercises — just a rest marker |
| `display_order` | integer | Same as day_of_week |

**Unique constraint:** `(workout_plan_id, day_of_week)` — one row per day per plan.

### Table 13: `workout_plan_exercises`
One row per exercise within a day.

| Column | Type | What it stores |
|---|---|---|
| `id` | uuid | |
| `workout_plan_day_id` | uuid FK → workout_plan_days | |
| `exercise_name` | text | e.g. "Barbell Squat" |
| `sets` | integer | e.g. 4 |
| `reps` | text | Free text: "8-12", "AMRAP", "30s" — allows ranges and descriptors |
| `duration_minutes` | integer | For cardio/timed exercises |
| `rest_seconds` | integer | Rest between sets in seconds |
| `notes` | text | Coaching cues e.g. "Keep chest up, controlled descent" |
| `display_order` | integer | Order within the day |

**Why `reps` is text:** Reps can be ranges ("8-12"), max effort ("AMRAP"), time-based ("30s"), or percentage-based ("70% 1RM"). Using a number would lose this information.

---

## 6. Consumer App — `product/`

### Root Files

#### `product/next.config.ts`
```ts
turbopack: { root: path.resolve(__dirname) }
```
Anchors Turbopack's workspace root to the `product/` directory. Without this, during Cloud Build, Turbopack might traverse up to the repo root.

#### `product/pnpm-workspace.yaml`
```yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```
Marks `product/` as its own pnpm workspace. Also ignores packages that require native binary compilation (avoids Cloud Build failures).

---

### `src/app/layout.tsx` — Root HTML Layout

Wraps every single page. Sets up:
- **System font stack** via CSS variable `--font-sans`
- **Monospace font stack** via `--font-geist-mono`
- **Dark theme** — `<html>` has `class="dark"` hardcoded
- **SEO metadata** — title + description
- **Toaster** — Sonner, `top-center`, `richColors`

---

### `src/app/(public)/` — Unauthenticated Pages

#### `login/page.tsx` — Login
**Type:** Client component. Firebase `signInWithEmailAndPassword` or `signInWithPopup` (Google). On success, calls `POST /api/auth/session` which creates the `__fv_session` cookie. Redirects to `/dashboard` or `/onboarding` based on `onboarding_completed`.

#### `signup/page.tsx` — Signup
Same structure, uses `createUserWithEmailAndPassword`. Always redirects to `/onboarding`.

#### `onboarding/page.tsx` — 10-Step Quiz
Animated (Framer Motion slide transitions). Collects: name/age, weight/height/goal weight, activity level, diet goal, dietary restrictions, biggest challenge, meal times, fasting, calorie target, motivation. On submit calls `saveOnboarding()` server action.

---

### `src/app/(app)/` — Authenticated App Pages

All pages in this group require a valid `__fv_session` cookie plus completed onboarding. The shared `layout.tsx` checks both on every request.

#### `layout.tsx`
1. Calls `getSession()` → redirects to `/login` if null
2. Checks `profiles.onboarding_completed` → redirects to `/onboarding` if false
3. Renders `<BottomNav />` fixed to bottom

#### `dashboard/page.tsx` — Main Daily Tracking
URL: `/dashboard`. Shows: greeting header, score ring + streak display, meal cards (breakfast/lunch/dinner), recent badges, motivation tip.

#### `diet/page.tsx` — Diet Page (redesigned)
URL: `/diet`. Designed for minimum scrolling — plan-first, action-prominent:
1. **Header row** — "Diet" + today's date + today's score (right-aligned, colour-coded)
2. **TodayPlanSnippet** — shows today's assigned meal plan at the top (if current week plan published)
3. **"Log Today" section** — 3 MealCards (breakfast/lunch/dinner) front-and-centre
4. **Bottom 2-col grid** — [History & Streaks → /progress] + [Full week plan ExpandableSection]

**Current week detection:**
```ts
const todayDow = ((now.getDay() + 6) % 7) as DayOfWeek  // Mon=0 ISO
const isCurrentWeekPlan = isThisWeek(parseISO(activePlan.plan.week_start), { weekStartsOn: 1 })
const todayPlanItems = isCurrentWeekPlan ? activePlan.items.filter(i => i.day_of_week === todayDow) : []
```

#### `workout/page.tsx` — Workout Page (redesigned)
URL: `/workout`. Same minimal-scroll layout:
1. **Header row** — "Workout" + today's date + total kcal burned (right-aligned, if any)
2. **TodayWorkoutSnippet** — today's assigned workout from plan (if current week)
3. **"Log Session" section** — WorkoutLogger component
4. **"Logged Today" section** — WorkoutList (only shown if sessions exist)
5. **CalorieBalanceCard** — BMR/TDEE summary + calorie balance
6. **Bottom 2-col grid** — [History & Progress → /progress] + [Full week plan ExpandableSection]

#### `history/page.tsx` — History
Monthly calendar heatmap + last 7 days detail (meals as coloured pills).

#### `progress/page.tsx` — Progress & Charts
4 stat cards + Recharts bar chart of daily scores + workout history. The `ProgressCharts` subcomponent is `'use client'` because Recharts requires the browser DOM.

#### `badges/page.tsx` — Badge Collection
"X/9 badges earned" + all 9 badges shown (earned = full colour, locked = greyed out with requirement text).

---

### `src/app/(website)/` — Marketing Site

Public pages with their own layout (header + footer). No auth required.

| URL | What it is |
|---|---|
| `/` | Landing page / homepage |
| `/blog` | Blog post index |
| `/blog/[slug]` | Individual Markdown blog post |
| `/privacy-policy` | Privacy policy |
| `/terms` | Terms of service |

`robots.ts` and `sitemap.ts` in `src/app/` generate the SEO files automatically.

---

### `src/app/api/auth/session/route.ts`

**POST** — Called right after Firebase login (client-side). Creates `profiles` + `user_streaks` rows for new users. Issues `__fv_session` cookie. Returns `{ok: true, onboardingCompleted: boolean}`.

**DELETE** — Removes the cookie.

---

### `src/features/` — Feature Modules

#### `auth/client/firebase.ts`
Firebase app init + exports `auth` (Auth instance) + `googleProvider` (GoogleAuthProvider). Client-side only. The `NEXT_PUBLIC_FIREBASE_*` env vars are safe to expose in browser.

#### `meals/server/actions.ts`
- `saveMeal({meal_type, rating, calories, note, date})` → upserts `meal_logs` → recomputes daily score → updates streak → `revalidatePath('/dashboard')` + `revalidatePath('/diet')`
- `recomputeDailyScore(userId, date)` [internal] → sums meal points → upserts `daily_scores` → if today, calls `updateStreak`
- `updateStreak(userId, date, totalPoints)` [internal] → reads streak → `calculateNewStreak()` → updates `user_streaks` → awards new badges

#### `meals/components/meal-card.tsx`
The core interactive meal logging component. Collapsed: shows meal name + current rating + points. Expanded: 4 rating buttons, optional calories input, optional note, save button. Client component.

#### `workouts/server/actions.ts`
- `logWorkout({exercise_type, duration_minutes, notes, date})` → inserts `workout_logs` row with MET-computed `calories_burned` → `revalidatePath('/workout')`
- `deleteWorkout(id)` → deletes row → `revalidatePath('/workout')`

#### `workouts/server/queries.ts`
- `getTodayWorkouts()` → all workout_logs for today
- `getWorkoutHistory(days)` → last N days of workout logs
- `getTodayCaloriesConsumed(userId)` → sum of `meal_logs.calories` for today

#### `workouts/lib/calorie-math.ts`
MET (Metabolic Equivalent of Task) values per exercise type. Formula: `calories = MET × weight_kg × (duration_minutes / 60)`. Also exports `calculateBMR(weight, height, age, activityLevel)` and `calculateTDEE()`.

#### `workouts/components/`
- `workout-logger.tsx` — Client component. Dropdown for exercise type, duration input, optional note. Calls `logWorkout()`.
- `workout-list.tsx` — Renders list of logged sessions with type, duration, calories.
- `calorie-balance-card.tsx` — Shows BMR, TDEE, calories consumed today, calories burned, net balance.

#### `plans/server/queries.ts`
- `getActiveMealPlan()` → most recent `published` meal plan for current user + all items
- `getActiveWorkoutPlan()` → most recent `published` workout plan for current user + days + exercises

#### `plans/components/today-plan-snippet.tsx`
Compact today-only meal plan display. Groups `meal_plan_items` by `meal_slot`, shows emoji + slot name + "food1 100g · food2 50g" + kcal per slot. Header shows total kcal + protein for the day. Styled with `bg-primary/5 border border-primary/20`.

#### `plans/components/today-workout-snippet.tsx`
Compact today-only workout display. Rest day: 😴 + "Rest Day" text. Active day: numbered exercise list with sets × reps + rest seconds.

#### `plans/components/meal-plan-view.tsx`
Full 7-day week meal plan grid. Today's day is highlighted (`border-primary/40`, "Today" badge, `bg-primary/8` header). Per-slot shows food items with quantities + kcal. Day footer shows totals (kcal + P/C/F). Passed as `children` to `ExpandableSection`.

#### `plans/components/workout-plan-view.tsx`
Full 7-day workout week display. Today highlighted. Exercise details: sets, reps, rest seconds, duration, coaching notes. Passed as `children` to `ExpandableSection`.

#### `components/expandable-section.tsx`
Client component (`'use client'`). Toggle: `useState(false)`. Chevron rotates on open. The key pattern: **pre-rendered server component output can be passed as `children`** — this means the plan data (fetched on the server) is never re-fetched when the user taps to expand. Zero additional network requests.

```tsx
// In workout/page.tsx (server component):
<ExpandableSection trigger="Full week plan">
  <WorkoutPlanView plan={activeWorkoutPlan.plan} days={activeWorkoutPlan.days} />
</ExpandableSection>
```

#### `streaks/lib/streak.ts`
Pure functions, no DB calls:
- `calculateNewStreak(streak, todayPoints, today)` — streak state machine
- `getBadgesToAward(currentStreak, alreadyEarned, isPerfectDay, isFirstMeal)` — returns new badge slugs
- `getStreakMessage(streak, consecutiveBadDays)` — motivational string

#### `dashboard/server/queries.ts`
`getTodayData()` — 4 parallel Supabase queries: today's meals, today's score, streak, last 3 badges.

#### `history/server/queries.ts`
`getHistoryData(days)` — last N days of scores + meals.

#### `profile/server/queries.ts`
Profile data for current user.

#### `badges/server/queries.ts`
`getBadgesData()` — earned badges + current streak + `BADGE_DEFINITIONS`.

#### `navigation/components/bottom-nav.tsx`
Fixed bottom navigation. Client component (needs `usePathname`). 5 tabs in the consumer app:

| Icon | Label | URL |
|---|---|---|
| Home | Today | `/dashboard` |
| Utensils | Diet | `/diet` |
| Dumbbell | Workout | `/workout` |
| TrendingUp | Progress | `/progress` |
| Trophy | Badges | `/badges` |

Plus sign-out: Firebase `signOut(auth)` + server `signOut()` action.

---

### `src/server/session.ts` — Consumer Session Management

- `createSession(uid, email)` → signs JWT with `SESSION_SECRET`, sets `__fv_session` cookie (httpOnly, secure, sameSite lax, 14 days, path `/`)
- `getSession()` → reads cookie → verifies JWT → returns `{uid, email}` or `null`
- `deleteSession()` → removes cookie

---

### `src/server/supabase/server.ts` — Server Supabase Client

Creates a `SupabaseClient` using `SUPABASE_SERVICE_ROLE_KEY`. Server-side only — never imported in client components.

---

### `src/shared/types/plans.ts` — Plan Type Definitions

All TypeScript types for the plan system:
- `PlanStatus` = `'draft' | 'published' | 'archived'`
- `DayOfWeek` = `0 | 1 | 2 | 3 | 4 | 5 | 6` (0=Monday, 6=Sunday)
- `MealSlot` = `'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'`
- `MealPlan`, `MealPlanItem`, `WorkoutPlan`, `WorkoutPlanDay`, `WorkoutPlanExercise`, `FoodItem`
- `DAY_LABELS` = `['Monday', ..., 'Sunday']`
- `DAY_SHORT` = `['Mon', ..., 'Sun']`
- `MEAL_SLOTS` = ordered array of MealSlot values
- `MEAL_SLOT_LABELS` = `{breakfast: 'Breakfast', ...}`
- `MEAL_SLOT_EMOJIS` = `{breakfast: '🌅', morning_snack: '🍎', ...}`
- `DAYS_OF_WEEK` = `[0, 1, 2, 3, 4, 5, 6]`
- `scaleMacros(food: FoodItem, quantity_g: number)` — scales per-100g values to actual serving size
- `WORKOUT_EMOJIS`, `WORKOUT_LABELS` — exercise type display helpers

---

## 7. CRM App — `crm/`

### Root Files

#### `crm/next.config.ts`
```ts
turbopack: { root: path.resolve(__dirname) }
outputFileTracingRoot: path.resolve(__dirname)
```
**Critical.** Anchors the build context to the `crm/` directory. Without these, Turbopack can traverse up to the repo root and cause build failures. Do not remove.

#### `crm/tsconfig.json`
`"include": ["src/**/*.ts", "src/**/*.tsx", ...]` — explicitly scoped to `src/` only.

---

### `src/app/layout.tsx` — CRM Root Layout

- No custom fonts (system fonts)
- `robots: 'noindex, nofollow'` — CRM hidden from search engines
- `Toaster position="top-right"` with `richColors`
- Light mode (no dark class)

---

### `src/app/(dashboard)/users/[id]/page.tsx` — User Detail (updated)

**What's on screen:**

Left column:
- Streak card (current + longest)
- Profile details (goal, age, weight/height, activity level)
- Badges earned

Right column:
- **Last 14 days score grid** — 14 coloured boxes, green/amber/red
- **Meal Plans card** — list of plans with status badges. Each row is a `<Link href="/users/[id]/meal-plan/[planId]">` (clickable to edit). "+ New Plan" button → `/users/[id]/meal-plan/new`
- **Workout Plans card** — same pattern with `<Link href="/users/[id]/workout-plan/[planId]">`. "+ New Plan" → `/users/[id]/workout-plan/new`
- **Recent Meals** — last 7 days of meal logs

---

### `src/app/(dashboard)/users/[id]/meal-plan/new/page.tsx` — New Meal Plan
Server component. Fetches user profile, renders `<MealPlanBuilder userId={id} userName={...} />`.

### `src/app/(dashboard)/users/[id]/meal-plan/[planId]/page.tsx` — Edit Meal Plan
Server component. Fetches user profile + existing plan (`getMealPlanWithItems`), renders builder in edit mode:
```tsx
<MealPlanBuilder
  userId={id}
  userName={...}
  planId={planId}
  initialTitle={planData.plan.title}
  initialWeekStart={planData.plan.week_start}
  initialItems={planData.items}
/>
```

### `src/app/(dashboard)/users/[id]/workout-plan/new/page.tsx` — New Workout Plan
Same pattern, renders `<WorkoutPlanBuilder userId={id} userName={...} />`.

### `src/app/(dashboard)/users/[id]/workout-plan/[planId]/page.tsx` — Edit Workout Plan
Server component. Fetches plan data, renders builder:
```tsx
<WorkoutPlanBuilder
  userId={id} userName={...}
  planId={planId}
  initialTitle={planData.plan.title}
  initialWeekStart={planData.plan.week_start}
  initialDays={planData.days}
/>
```

---

### `src/app/api/foods/search/route.ts` — Food Search API

**GET `/api/foods/search?q=chicken&limit=8`**

Called by the meal plan builder's food autocomplete. Returns empty array for empty query. Uses Supabase `.ilike('name', '%q%')` for case-insensitive partial match.

Response shape:
```json
[{ "id": 123, "name": "Chicken, broiler", "food_group": "Poultry", "energy_kcal": 215, "protein_g": 27.3, "fat_g": 11.1, "carbs_g": 0, "fiber_g": 0 }]
```

**Why not full-text search?** `ilike` is sufficient for a 542-food database. GIN full-text index exists on `name` for future use.

---

### `src/features/plans/components/meal-plan-builder.tsx` — Meal Plan Builder

**Type:** Client component (`'use client'`)

**What it does:** A 7-column × 6-row interactive grid for building a week of meal plans.

**Columns:** Mon–Sun (7 days). **Rows:** Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack.

**Key state:**
- `weekStart: Date` — the Monday of the plan week
- `title: string` — plan title
- `grid: GridState` — `Record<"day-slot", GridItem[]>` — all food items in all cells
- `activeCell: CellKey | null` — which cell has the food search open

**MealCell component:** Each cell shows food chips (name + quantity + kcal). Clicking a chip's × removes it. "Add" button opens `FoodSearchInline` inline.

**FoodSearchInline component:** Debounced (220ms) `fetch` to `/api/foods/search`. Results shown inline (not absolute-positioned — avoids overflow clipping from `overflow-x-auto` container). After selecting a food, shows quantity input with live kcal preview. Pressing Enter or clicking "Add" inserts into the grid.

**Day totals row:** Summed kcal + P/C/F per column, shown at the bottom.

**Edit mode (when `planId` is provided):**
- `initialItems` pre-populates the grid
- Week navigation arrows are hidden (you can't change the week of an existing plan)
- `isPastDay(weekStartStr, dayIndex)` is called per column header and per cell
- Past day columns: header shows "past" label + 40% opacity, cells have `bg-gray-50/60` background, `MealCell` receives `isLocked=true` → no + Add button, no × remove, food chips use gray colour instead of blue
- **Only editable days are saved:** `editableDays = days.filter(d => !isPastDay(...))`. The `updateMealPlanAction` only deletes+reinserts rows for `editableDays`, leaving past days' DB rows untouched.

**Save flow:**
```ts
if (isEditing && planId) {
  await updateMealPlanAction({ planId, userId, title, weekStart, status, items, editableDays })
} else {
  await saveMealPlanAction({ userId, title, weekStart, status, items })
}
```
On success: Sonner toast + `router.push('/users/${userId}')`.

---

### `src/features/plans/components/workout-plan-builder.tsx` — Workout Plan Builder

**Type:** Client component

7 vertical day cards, each containing:
- Day header: short day name + date + optional label input + Rest Day toggle (Moon icon)
- Exercise rows: exercise name, sets, reps (text), rest seconds, duration minutes, notes

**Rest Day toggle:** When activated, clears all exercises for that day and shows a dimmed card.

**Edit mode (when `planId` is provided):**
- `initialDays` pre-populates all 7 day cards with labels + exercises
- `isPastDay()` is computed per day card
- Past days: card has 40% opacity, all inputs are `disabled`, no "Add exercise" button, no × remove on exercise rows, day header shows "past" label
- Week navigation hidden when editing

**DayCard + ExerciseRow** are sub-components. `isLocked` prop threads through both.

---

### `src/features/plans/server/actions.ts` — Plan Server Actions

All functions call `getSession()` first. Unauthorized → throws.

**`saveMealPlanAction(input)`**
1. Inserts `meal_plans` row (user_id, created_by=session.id, title, week_start, status)
2. Batch-inserts all `meal_plan_items` with `meal_plan_id`
3. `revalidatePath('/users/${userId}')`

**`updateMealPlanAction(input)`** (edit mode)
1. Updates `meal_plans` header (title, status, updated_at)
2. For `editableDays` only: deletes existing items → re-inserts new items
3. Past days' rows are never touched

**`saveWorkoutPlanAction(input)`**
1. Inserts `workout_plans` row
2. For each of 7 days: inserts `workout_plan_days` row → inserts exercises

**`updateWorkoutPlanAction(input)`** (edit mode)
1. Updates `workout_plans` header
2. For `editableDays`: fetches existing day row IDs → deletes exercises → deletes day rows → re-inserts days + exercises

---

### `src/features/plans/server/queries.ts` — Plan Queries (CRM)

- `getMealPlanWithItems(planId)` → plan header + all items ordered by `display_order`
- `getWorkoutPlanWithDays(planId)` → plan + days + exercises (grouped by day ID)
- `getUserMealPlans(userId)` → list of last 20 plans (id, title, week_start, status, created_at)
- `getUserWorkoutPlans(userId)` → same for workout plans

---

### `src/features/users/server/queries.ts` — User Queries (CRM)

`getUserDetail(id)` — 5 parallel Supabase queries:
1. `profiles` — profile data
2. `user_streaks` — streak state
3. `user_badges` — all earned badges
4. `meal_logs` last 30 rows
5. `daily_scores` last 14 rows

---

### `src/server/session.ts` — CRM Session Management

Same pattern as consumer app:
- Cookie: `__crm_session`
- Secret: `CRM_SESSION_SECRET`
- JWT payload: `{id, email, full_name, role}`
- Expiry: 14 days

---

### `src/server/supabase.ts` — CRM Supabase Client

Single Supabase client using `SUPABASE_SERVICE_ROLE_KEY`. Simpler than consumer app (no SSR helpers needed).

---

## 8. How Authentication Works

### Consumer App Login — Full Flow

```
BROWSER                          SERVER (Next.js)              EXTERNAL SERVICES
   │                                    │                              │
   │  1. Enter email + password         │                              │
   │  ─────────────────────────────────────────────────────────────────►
   │                                    │                         Firebase Auth
   │  2. Firebase returns {uid, email}  │                              │
   │  ◄─────────────────────────────────────────────────────────────────
   │                                    │                              │
   │  3. POST /api/auth/session         │                              │
   │     body: {uid, email}             │                              │
   │  ──────────────────────────────────►                              │
   │                                    │  4. Check profiles table     │
   │                                    │  ──────────────────────────► Supabase
   │                                    │  ◄──────────────────────────  │
   │                                    │                              │
   │                                    │  5. If new: create profiles  │
   │                                    │     + user_streaks rows      │
   │                                    │  ──────────────────────────► │
   │                                    │  ◄──────────────────────────  │
   │                                    │                              │
   │                                    │  6. Sign JWT, set cookie     │
   │                                    │     __fv_session (14 days)   │
   │  7. Response: {onboardingCompleted}│                              │
   │  ◄──────────────────────────────────                              │
   │                                    │                              │
   │  8. If onboarded → /dashboard      │                              │
   │     If new → /onboarding           │                              │
```

**Subsequent requests:** Every page load, server components call `getSession()` which reads and verifies the `__fv_session` cookie. Valid → `uid` extracted for all Supabase queries. Invalid/expired → `redirect('/login')`.

**Sign out:** BottomNav calls Firebase's `signOut(auth)` + server `signOut()` action.

---

### CRM Login — Full Flow

```
BROWSER                          SERVER (Next.js)              SUPABASE
   │                                    │                          │
   │  1. Enter email + password         │                          │
   │  ──────────────────────────────────►                          │
   │                                    │  2. Query crm_users      │
   │                                    │     WHERE email = ?      │
   │                                    │  ─────────────────────── ►
   │                                    │  ◄───────────────────────
   │                                    │                          │
   │                                    │  3. Check is_active      │
   │                                    │  4. verifyPassword()     │
   │                                    │     (scrypt comparison)  │
   │                                    │  5. Sign JWT, set cookie │
   │                                    │     __crm_session (14d)  │
   │  6. {ok: true, role}               │                          │
   │  ◄──────────────────────────────────                          │
   │  7. router.push('/dashboard')      │                          │
```

**No Firebase involved.** CRM authentication is entirely Supabase + custom JWT.

---

## 9. How Data Flows — Step by Step

### Logging a Meal

```
1.  User opens /diet page
    → Server reads __fv_session → uid
    → getActiveMealPlan() + getTodayData() + profile in parallel
    → If published plan for current week: renders TodayPlanSnippet with today's items
    → Renders 3 MealCard components

2.  User taps "Breakfast" card → expands (useState)

3.  User taps "Healthy" → rating = 'healthy'

4.  User taps "Save"

────── SERVER SIDE (saveMeal) ──────
5.  Supabase UPSERT into meal_logs
    ON CONFLICT (user_id, date, meal_type) DO UPDATE

6.  recomputeDailyScore → sums today's points → upserts daily_scores
    → if today: updateStreak → calculateNewStreak() → update user_streaks
    → getBadgesToAward() → insert any new badges

7.  revalidatePath('/dashboard') + revalidatePath('/diet')

────── CLIENT SIDE ──────
8.  Toast: "Breakfast saved! +3 pts"
9.  MealCard collapses
```

---

### CRM Nutritionist Creating a Meal Plan

```
1.  Nutritionist navigates to crm.fitterverse.in/users/[uid]/meal-plan/new

2.  Server: getUserDetail([uid]) → renders MealPlanBuilder
    (no initialItems → empty grid, week defaults to next week's Monday)

3.  Nutritionist:
    - Types plan title
    - Searches "paneer" in Monday Breakfast cell
    - GET /api/foods/search?q=paneer → returns IFCT matches
    - Selects "Paneer, cottage cheese" → types 100g
    - Live preview: ~265 kcal
    - Clicks "Add" → food chip appears in cell
    - Repeats for all 7 days × 6 slots
    - Clicks "Publish to User"

4.  handleSave('published'):
    → Collects all grid items into flat array
    → saveMealPlanAction({ userId, title, weekStart, status: 'published', items })

5.  Server inserts meal_plans row → batch-inserts meal_plan_items
    → revalidatePath('/users/[uid]')
    → Client: toast "Plan published to user!" → router.push('/users/[uid]')

6.  Consumer user opens app → /diet page:
    → getActiveMealPlan() finds this plan (published, current week)
    → TodayPlanSnippet shows today's assigned meals at top of page
```

---

### CRM Editing an Existing Plan (Past Day Locking)

```
1.  Today is Wednesday, May 8. Plan week is Mon May 6 – Sun May 12.

2.  Nutritionist clicks on the plan row in user detail page
    → navigates to /users/[uid]/meal-plan/[planId]

3.  Server: getMealPlanWithItems(planId) → passes initialItems to builder
    Grid pre-populated from DB

4.  isPastDay is evaluated for each column:
    - Mon (day 0): dayDate = May 6. isBefore(May 6, May 8 start) = true → LOCKED
    - Tue (day 1): dayDate = May 7. isBefore(May 7, May 8 start) = true → LOCKED
    - Wed (day 2): dayDate = May 8. isBefore(May 8, May 8 start) = false → editable
    - Thu–Sun: all editable

5.  Mon and Tue columns: gray background, "past" label, no + Add, no × remove

6.  Nutritionist modifies Wed–Sun cells

7.  handleSave:
    → editableDays = [2, 3, 4, 5, 6]
    → updateMealPlanAction({ planId, editableDays: [2,3,4,5,6], items, ... })

8.  Server:
    → UPDATE meal_plans SET title, status, updated_at
    → DELETE meal_plan_items WHERE meal_plan_id = planId AND day_of_week IN (2,3,4,5,6)
    → INSERT new items for days 2–6 only
    → Mon and Tue rows untouched
```

---

### Consumer Viewing Their Plan

```
1.  User opens /workout page (or /diet page)

2.  Server: getActiveWorkoutPlan() → most recent published workout plan
    → is it this week? isThisWeek(parseISO(plan.week_start), { weekStartsOn: 1 })

3.  If yes: todayDow = ((now.getDay() + 6) % 7)
    todayPlanDay = days.find(d => d.day_of_week === todayDow)

4.  TodayWorkoutSnippet rendered at top:
    - Rest day: 😴 "Rest Day"
    - Active day: numbered list of exercises (sets × reps, rest)

5.  User taps "Full week plan" button at bottom
    → ExpandableSection opens
    → WorkoutPlanView renders (already in DOM as server-rendered children)
    → No network request — zero re-fetch
```

---

## 10. Deployment & Hosting

### How Firebase App Hosting Works

1. Push code to `main` branch on GitHub
2. Firebase App Hosting detects push (GitHub webhook)
3. Firebase starts a Cloud Build job: `cd product/` (or `crm/`) → `pnpm install` → `pnpm build` → Docker image
4. Image deployed to Google Cloud Run (serverless containers)
5. Firebase routes traffic from custom domain to Cloud Run container
6. New deploys shift traffic gradually (no downtime)

**Both apps build from the same repo.** Each backend has a `rootDir` configured pointing to its subdirectory.

---

### Manual Rollout Trigger

Even with auto-deploy on push, you can manually kick off a build:

```bash
firebase apphosting:rollouts:create fitterverse-app --git-branch main --project fitterverse --force
firebase apphosting:rollouts:create fitterverse-crm --git-branch main --project fitterverse --force
```

Both run in ~5–10 minutes. Track at: `https://console.firebase.google.com/project/fitterverse/apphosting`

---

### `apphosting.yaml` — The Deployment Config

**Consumer app** (`product/apphosting.yaml`): nodejs20, 1 CPU, 512 MB, 100 concurrent requests. Secrets: all Firebase vars + Supabase URL at BUILD+RUNTIME; service role key + session secret at RUNTIME only.

**CRM** (`crm/apphosting.yaml`): nodejs20, 1 CPU, 512 MB, 80 concurrent requests. Secrets: Supabase URL at BUILD+RUNTIME; service role key + CRM session secret at RUNTIME only.

**Critical rule:** Any `NEXT_PUBLIC_*` variable is embedded at BUILD time. It must have `availability: [BUILD, RUNTIME]` or it will be `undefined` in production.

---

### Deployment URLs

| App | Firebase Backend | Auto URL | Custom Domain |
|---|---|---|---|
| Consumer | `fitterverse-app` | https://fitterverse-app--fitterverse.us-central1.hosted.app | https://fitterverse.in |
| CRM | `fitterverse-crm` | https://fitterverse-crm--fitterverse.us-central1.hosted.app | https://crm.fitterverse.in |

---

## 11. Environment Variables & Secrets

### Consumer App Variables

| Variable | Available where | What it is |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser + Server | Firebase project API key (safe to expose) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Browser + Server | `fitterverse.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser + Server | `fitterverse` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser + Server | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser + Server | Firebase project number |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser + Server | Firebase App identifier |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | `https://wwzabsfwfojsizexptxe.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Full DB access key — **never expose** |
| `SESSION_SECRET` | **Server only** | 32-char random string for signing JWTs |

### CRM App Variables

| Variable | Available where | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Full DB access key |
| `CRM_SESSION_SECRET` | **Server only** | Different from `SESSION_SECRET` — separate key for CRM JWTs |

### `.env.local` for Local Development

```bash
# product/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fitterverse.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fitterverse
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_SUPABASE_URL=https://wwzabsfwfojsizexptxe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SESSION_SECRET=<any-32-char-random-string>

# crm/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://wwzabsfwfojsizexptxe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRM_SESSION_SECRET=<different-32-char-random-string>
```

---

## 12. Running Locally

### Prerequisites
- Node.js 20+: `node --version` → `v20.x.x` or higher
- pnpm: `npm install -g pnpm`
- Git
- Access to the Supabase project (the URL + service role key)

### Consumer App

```bash
git clone https://github.com/fitterverse/Fitterverse.git
cd Fitterverse/product
pnpm install
cp .env.local.example .env.local   # fill in all values

# One-time database setup (in Supabase SQL Editor):
# 1. Run product/supabase/schema.sql
# 2. Run product/supabase/migrations/002_add_food_items.sql
# 3. Run product/supabase/migrations/003_add_plan_tables.sql
# 4. Seed food data: npx tsx scripts/seed-food-items.ts (needs ifct2017.json — see script)

pnpm dev  # → http://localhost:3000
```

### CRM

```bash
cd Fitterverse/crm
pnpm install

# Create crm/.env.local with SUPABASE vars + CRM_SESSION_SECRET

# One-time (in Supabase SQL Editor):
# Run crm/supabase/crm_migration.sql  (creates crm_users + seeds admin)

pnpm dev  # → http://localhost:3001

# Login: fitterverse.in@gmail.com / Fitterverse@123
```

### Running Both Simultaneously

Open two terminals. Run `pnpm dev` in `product/` (port 3000) and `pnpm dev` in `crm/` (port 3001). Both connect to the same Supabase database.

To test the plan flow end-to-end:
1. CRM (port 3001): create a meal plan or workout plan for a user → publish it
2. Consumer app (port 3000): log in as that user → open /diet or /workout → see the plan at top

---

## 13. Key Design Decisions

### Why Firebase Auth for consumers but custom auth for CRM?

Consumer users sign up themselves — they need Google sign-in, password resets, battle-tested identity. Firebase handles all of this.

CRM users are created manually by the admin — maybe 5–10 people. A username/password in a database table is all that's needed. Keeps the two identity systems completely separate: a compromised CRM password cannot be used to access consumer data through Firebase, and vice versa.

---

### Why two separate Next.js apps?

Complete isolation. Different styling, dependencies, build config, secrets. If the consumer app has a deploy failure, the CRM still works. Different screen design philosophies: consumer app is mobile-first (max-width 448px, bottom nav), CRM is desktop-first (full-width table layouts, sidebar nav).

---

### Why Supabase instead of a different database?

PostgreSQL is the gold standard for relational data. Supabase adds a web dashboard, easy JavaScript integration, and a generous free tier. We use the service role key on the server — safe because the key never reaches the browser.

---

### Why store `points` in `meal_logs` instead of computing at query time?

Storing `points: 3` directly means `SUM(points)` is a simple arithmetic operation — instant even with millions of rows. Computing from a rating string dynamically would be slower. Tradeoff: if points values ever change, historical data needs backfilling.

---

### Why a grace period for streaks?

Real life happens. Breaking a streak on the first bad day is demoralising and counterproductive. Research in habit formation shows occasional missed days don't break habits — giving up entirely does. The 3-day grace (break only after 3 consecutive bad days) keeps users engaged through slip-ups.

---

### Why are meal dates stored as `YYYY-MM-DD` strings, not timestamps?

Timestamps have timezone complexity — dinner at 11pm IST is 5:30pm UTC. A date string `"2026-05-08"` is the user's local date as they experience it — no timezone math. All date comparisons use simple string equality: `.eq('date', '2026-05-04')`.

---

### Why is `meal_plan_items.food_name` denormalized?

The plan item stores a copy of the food name even though `food_item_id` references `food_items`. This means the plan survives if the food database entry is ever edited or corrected. A plan created in January still shows exactly what was prescribed then, not the current state of the food record.

---

### Why is `reps` a text field, not an integer?

Workout programming uses ranges ("8-12"), max effort ("AMRAP"), time ("30s"), and percentage-based ("70% 1RM"). Constraining to a number would lose real coaching information.

---

### Why do plan macros get pre-computed at save time?

`meal_plan_items.energy_kcal` = `food.energy_kcal × quantity_g / 100`, computed by the builder at save time. This means the plan view doesn't need to JOIN with `food_items` and re-multiply every render. It also protects against drift if food data is later corrected.

---

### Why can't past plan days be edited?

A nutritionist might have given specific advice for Monday based on what happened that day (e.g., a client's meeting lunch). Allowing retroactive edits creates confusion about what the user was actually prescribed. Past days are frozen in the DB — the update action only touches `editableDays = days where !isPastDay`.

---

### Server component children passed to client `ExpandableSection`

The "Full week plan" button in the Diet and Workout pages hides a `<MealPlanView>` (or `<WorkoutPlanView>`) rendered on the server. Instead of re-fetching the data when the user taps, the server-rendered output is passed as `children` to a client `<ExpandableSection>` toggle component. Next.js App Router fully supports passing server-component output as children to client components. This gives zero additional network requests on expansion.

---

### Food search is inline (not absolute-positioned dropdown)

The meal plan builder uses `overflow-x-auto` on the grid table. Absolute-positioned dropdowns would be clipped by this container. Instead, food search results appear inline in the cell, causing the cell to grow vertically. This avoids the clipping issue entirely.

---

## 14. Known Gotchas & Critical Notes

### DO NOT delete `pnpm-workspace.yaml` from `product/` or `crm/`

Without it, pnpm traverses up looking for a root workspace file. This was fixed on May 4, 2026 (root-level `pnpm-workspace.yaml` intentionally deleted). Each sub-app has its own. Build error symptom: `"Found lockfile missing swc dependencies"`.

---

### `crm/next.config.ts` MUST have `turbopack.root` and `outputFileTracingRoot`

Without these, Turbopack may traverse from the Firebase Cloud Build container root (`/workspace/`) and pick up wrong files. Real production failure in early history. Do not remove.

---

### `NEXT_PUBLIC_*` variables MUST have `availability: [BUILD, RUNTIME]`

Any `NEXT_PUBLIC_*` variable is embedded into the browser bundle at BUILD time. If only available at RUNTIME, it will be `undefined` in production. This caused a real deployment failure once. The rule: if it starts with `NEXT_PUBLIC_`, it needs both.

---

### `SUPABASE_SERVICE_ROLE_KEY` must never reach the browser

Full read/write access bypassing all RLS. Always import `createClient()` from server-only files. Never import in `'use client'` components. If it ever ends up in the browser, anyone can extract it from the network tab.

---

### Firebase UIDs vs UUIDs

Consumer users: Firebase UIDs (28-char alphanumeric strings, e.g. `"Ua3mK9j2pNxY..."`). These are `text` columns.

CRM users and plan records: PostgreSQL UUIDs (format `"550e8400-e29b-41d4-a716-446655440000"`).

Don't mix them up in queries.

---

### CRM is `noindex, nofollow`

The CRM layout sets this in metadata. If removed, the CRM login page could appear in Google search results.

---

### `proxy.ts` is active in Next.js 16

In Next.js 16, `proxy.ts` replaces the old `middleware.ts` convention. `product/src/proxy.ts` **does execute** for matched requests. Route protection is layered: proxy.ts handles request-time redirects, and `app/(app)/layout.tsx` handles session + onboarding gating on the server.

---

### Day of week: JS vs ISO

JavaScript `Date.getDay()` returns 0=Sunday, 6=Saturday.
The app uses **ISO week numbering**: 0=Monday, 6=Sunday.

Conversion: `((date.getDay() + 6) % 7)` converts JS day to ISO day. This is used everywhere day-of-week is computed: plan display, today's workout/meal snippet, `isPastDay()`.

---

### IFCT 2017 uses raw ingredients, not prepared dishes

Searching "roti" won't find anything. Search "wheat flour, atta" instead. IFCT documents the nutritional content of raw ingredients before cooking. Nutritionists should know the ingredient names, not dish names.

---

### Stable git snapshot: `fitterverse_v1_04-05-2026`

Tag `fitterverse_v1_04-05-2026` is a verified restore point from May 4, 2026 (consumer + CRM v1). Rollback:
```bash
git checkout fitterverse_v1_04-05-2026
```

---

## 15. Git Workflow & Deployment Process

### Branch Structure

Single branch: `main`. All changes committed directly to `main`.

**Auto-deploy trigger:** Both Firebase backends watch `main`. Any push triggers builds for both apps simultaneously.

---

### How to Deploy a Change

```bash
# 1. Make changes locally (test with pnpm dev first)

# 2. Check what changed
git status
git diff

# 3. Stage specific files (prefer specific over git add .)
git add <specific-files>

# 4. Commit with a clear message
git commit -m "Brief description of what changed and why"

# 5. Push — auto-triggers Firebase builds (~5–10 min)
git push origin main

# 6. Track build progress:
# https://console.firebase.google.com/project/fitterverse/apphosting

# 7. (Optional) Force manual rollout if auto-deploy doesn't trigger:
firebase apphosting:rollouts:create fitterverse-app --git-branch main --project fitterverse --force
firebase apphosting:rollouts:create fitterverse-crm --git-branch main --project fitterverse --force
```

---

### How to Create a Stable Snapshot

```bash
git tag fitterverse_v2_DD-MM-YYYY
git push origin fitterverse_v2_DD-MM-YYYY
```

---

### Adding a New Team Member to the CRM

1. Log in to `crm.fitterverse.in` as admin
2. Team → "Add team member" → fill in name, email, role, password
3. Share password with them directly

No code change needed.

---

### Deactivating a CRM Team Member

1. Log in as admin → Team → find member → "Deactivate"
2. Account blocked immediately, not deleted, can be reactivated.

---

### Running the Database Migrations

All SQL migrations are in `product/supabase/migrations/`. Run them in order in the Supabase SQL Editor (project dashboard → SQL Editor):

1. `product/supabase/schema.sql` — original 5 consumer tables
2. `product/supabase/migrations/002_add_food_items.sql` — food_items table + GIN index
3. `product/supabase/migrations/003_add_plan_tables.sql` — all 5 plan tables
4. `crm/supabase/crm_migration.sql` — crm_users table + admin seed

---

## 16. Full Dependency Reference

### Consumer App (`product/package.json`)

| Package | What it does |
|---|---|
| `next` 16.x | The main framework |
| `react` + `react-dom` 19.x | UI library |
| `typescript` 5.x | Type checking |
| `tailwindcss` 4.x | CSS utility classes |
| `@tailwindcss/postcss` 4.x | Tailwind + PostCSS pipeline |
| `firebase` 12.x | Firebase Auth SDK (email + Google sign-in) |
| `@supabase/supabase-js` 2.x | Supabase database client |
| `@supabase/ssr` 0.x | Supabase helpers for SSR |
| `jose` 6.x | JWT creation and verification (session cookies) |
| `sonner` 2.x | Toast notification UI |
| `framer-motion` 12.x | Animation library (onboarding transitions) |
| `recharts` 3.x | Chart library (progress page) |
| `date-fns` 4.x | Date formatting, comparison, week detection |
| `lucide-react` 1.x | SVG icon library |
| `shadcn` 4.x | CLI for adding shadcn/ui components |
| `class-variance-authority` 0.x | `cva()` — conditional className strings |
| `clsx` 2.x | Merges className strings |
| `tailwind-merge` 3.x | Merges Tailwind classes without conflicts |
| `tw-animate-css` 1.x | Pre-built CSS animation classes |
| `next-themes` 0.x | Theme management (installed; dark hardcoded via CSS) |
| `react-hook-form` 7.x | Form state management |
| `@hookform/resolvers` 5.x | Connects react-hook-form with validators |
| `zod` 4.x | Schema-based runtime type validation |

---

### CRM App (`crm/package.json`)

| Package | What it does |
|---|---|
| `next` 16.x | Framework |
| `react` + `react-dom` 19.x | React |
| `typescript` 5.x | Type checking |
| `tailwindcss` 4.x | CSS utilities |
| `@tailwindcss/postcss` 4.x | Tailwind + PostCSS |
| `@supabase/supabase-js` 2.x | Supabase client |
| `jose` 6.x | JWT for session cookies |
| `sonner` 2.x | Toast notifications |
| `date-fns` 4.x | Date formatting + past-day detection |
| `lucide-react` 1.x | Icons (Plus, X, Loader2, Moon, ChevronLeft/Right, etc.) |
| `clsx` 2.x | Class merging |
| `tailwind-merge` 3.x | Tailwind class conflicts |

The CRM has a smaller footprint — no Firebase, no Framer Motion, no Recharts, no shadcn/ui. Keeps the CRM bundle small and builds fast.

---

## 17. Complete SQL Schemas

### Original Consumer Tables (`product/supabase/schema.sql`)

```sql
create table if not exists public.profiles (
  id text primary key,
  email text, full_name text, age integer,
  weight_kg decimal(5,2), height_cm decimal(5,1), goal_weight_kg decimal(5,2),
  activity_level text check (activity_level in ('sedentary','light','moderate','active')),
  practices_fasting boolean default false, meals_per_day integer default 3,
  breakfast_time text, lunch_time text, dinner_time text,
  calorie_limit_per_meal integer default 650,
  dietary_restrictions text, diet_goal text, biggest_challenge text, motivation text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner')),
  rating text check (rating in ('healthy','medium','junk','skipped')),
  calories integer, note text, points integer,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id, date, meal_type)
);

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, date date not null,
  total_points integer default 0, meals_logged integer default 0,
  is_streak_day boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists public.user_streaks (
  user_id text primary key,
  current_streak integer default 0, longest_streak integer default 0,
  consecutive_bad_days integer default 0, last_updated date, streak_start_date date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, badge_slug text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_slug)
);

alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;
alter table public.daily_scores enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_badges enable row level security;

create index if not exists meal_logs_user_date on public.meal_logs(user_id, date);
create index if not exists daily_scores_user_date on public.daily_scores(user_id, date);
create index if not exists user_badges_user on public.user_badges(user_id);
```

---

### Food Items Table (`product/supabase/migrations/002_add_food_items.sql`)

```sql
create table if not exists public.food_items (
  id            serial primary key,
  code          text not null unique,
  name          text not null,
  scientific    text, lang_names text, food_group text,
  energy_kcal   numeric(8,2), water_g numeric(8,2),
  protein_g     numeric(8,2), fat_g numeric(8,2),
  carbs_g       numeric(8,2), fiber_g numeric(8,2),
  sugar_g       numeric(8,2), sat_fat_g numeric(8,2),
  cholesterol_mg numeric(8,2),
  vit_c_mg      numeric(8,3), vit_a_mcg numeric(8,3),
  thiamine_mg   numeric(8,4), riboflavin_mg numeric(8,4),
  niacin_mg     numeric(8,3), vit_b6_mg numeric(8,4),
  folate_mcg    numeric(8,2), beta_carotene_mcg numeric(8,2),
  calcium_mg    numeric(8,2), iron_mg numeric(8,3),
  magnesium_mg  numeric(8,2), phosphorus_mg numeric(8,2),
  potassium_mg  numeric(8,2), sodium_mg numeric(8,2),
  zinc_mg       numeric(8,3)
);

create index if not exists food_items_name_fts on public.food_items
  using gin(to_tsvector('english', name));

alter table public.food_items enable row level security;
create policy "Public read" on public.food_items for select using (true);
```

*Seeded with 542 IFCT 2017 foods via `product/scripts/seed-food-items.ts`. The seed script reads `ifct2017.json` (pre-processed from the IFCT CSV using Python) and upserts in batches of 50.*

---

### Plan Tables (`product/supabase/migrations/003_add_plan_tables.sql`)

```sql
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, created_by text not null,
  title text not null default 'Meal Plan',
  week_start date not null,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists meal_plans_user_id on public.meal_plans(user_id);
create index if not exists meal_plans_status on public.meal_plans(status);
alter table public.meal_plans enable row level security;

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  meal_slot text not null check (meal_slot in (
    'breakfast','morning_snack','lunch','afternoon_snack','dinner','evening_snack'
  )),
  food_item_id integer references public.food_items(id),
  food_name text not null,
  quantity_g numeric(8,1) not null check (quantity_g > 0),
  energy_kcal numeric(8,2), protein_g numeric(8,2),
  fat_g numeric(8,2), carbs_g numeric(8,2), fiber_g numeric(8,2),
  display_order integer not null default 0, notes text,
  created_at timestamptz default now()
);
create index if not exists meal_plan_items_plan on public.meal_plan_items(meal_plan_id);
alter table public.meal_plan_items enable row level security;

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, created_by text not null,
  title text not null default 'Workout Plan',
  week_start date not null,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists workout_plans_user_id on public.workout_plans(user_id);
create index if not exists workout_plans_status on public.workout_plans(status);
alter table public.workout_plans enable row level security;

create table if not exists public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  label text, is_rest_day boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz default now(),
  unique(workout_plan_id, day_of_week)
);
create index if not exists workout_plan_days_plan on public.workout_plan_days(workout_plan_id);
alter table public.workout_plan_days enable row level security;

create table if not exists public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_day_id uuid not null references public.workout_plan_days(id) on delete cascade,
  exercise_name text not null,
  sets integer, reps text,
  duration_minutes integer, rest_seconds integer,
  notes text, display_order integer not null default 0,
  created_at timestamptz default now()
);
create index if not exists workout_plan_exercises_day on public.workout_plan_exercises(workout_plan_day_id);
alter table public.workout_plan_exercises enable row level security;
```

---

### CRM Schema (`crm/supabase/crm_migration.sql`)

```sql
create table if not exists public.crm_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null, password_hash text not null,
  full_name text not null,
  role text not null default 'nutritionist'
    check (role in ('admin','master_coach','nutritionist','trainer','sales')),
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists crm_users_email_idx on public.crm_users(email);

-- Seed admin account (fitterverse.in@gmail.com / Fitterverse@123)
insert into public.crm_users (email, password_hash, full_name, role) values (
  'fitterverse.in@gmail.com',
  'd6da09f50159c38b9f01685a3aedd12b:8b064478baed60c50e777e4ade3b9a6679dc93df040f3d24879b4433f0a6e403f41d7616393fd74803561dcabb3eeb3ff1f12dc69e6ec73f7c45c438f216236e',
  'Fitterverse Admin', 'admin'
) on conflict (email) do nothing;
```

---

*Last updated: May 8, 2026 — v2 live with workout tracking, IFCT food DB (542 foods), meal plan builder, workout plan builder, plan edit mode with past-day locking, consumer diet/workout pages redesigned (plan-first UX). Both apps deployed on Firebase App Hosting.*
