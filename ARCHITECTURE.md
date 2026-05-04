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

Fitterverse is a **habit-based nutrition accountability app** for busy Indian professionals. The core product is the **21-Day Reset** — a cohort programme where users pay ₹999 to track their meals daily for 21 days and build a sustainable eating habit.

**The product in one sentence:** Users log what they ate for each meal (Healthy / Medium / Junk / Skipped), earn points (max 9/day), and build a daily streak. A streak requires ≥6 points per day. The app gives a 2-day grace period before breaking a streak, so one bad day doesn't ruin progress.

**The two sides of the product:**

| Side | Who uses it | URL |
|---|---|---|
| Consumer App | Users (people tracking meals) | fitterverse.in |
| CRM | Internal team (admin, coaches, nutritionists) | crm.fitterverse.in |

These are **two completely separate websites** that share the same database. They don't call each other — they both read and write to the same Supabase database independently.

---

## 2. The Two Apps — Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   fitterverse.in              │   crm.fitterverse.in            │
│   (Consumer App)              │   (CRM)                         │
│                               │                                 │
│   - Login / Signup            │   - Team login (Supabase auth)  │
│   - Onboarding quiz (once)    │   - Dashboard stats overview    │
│   - Log meals daily           │   - All users list + search     │
│   - View streak & score       │   - Individual user deep-dive   │
│   - Earn badges               │   - Manage team members/roles   │
│   - View history & charts     │                                 │
└──────────────┬────────────────┴──────────────┬──────────────────┘
               │                               │
               │ reads/writes                  │ reads/writes
               │ (service role key)            │ (service role key)
               ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                          │
│    Hosted cloud database — single source of truth for all data   │
│                                                                  │
│   Consumer tables:         CRM table:                            │
│   - profiles               - crm_users                           │
│   - meal_logs                                                    │
│   - daily_scores                                                 │
│   - user_streaks                                                 │
│   - user_badges                                                  │
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
│   ├── apphosting.yaml              ← Firebase deployment config (runtime + secrets)
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
│   │   └── schema.sql               ← SQL to create all 5 consumer tables in Supabase
│   └── src/
│       ├── app/                     ← Pages (URL routes) and API routes
│       │   ├── layout.tsx           ← Root HTML shell: fonts, dark theme, toast container
│       │   ├── globals.css          ← Design tokens (colors, spacing) via CSS variables
│       │   ├── page.tsx             ← Root "/" — redirects to /dashboard or /login
│       │   ├── actions.ts           ← ALL server-side data functions (server actions)
│       │   ├── login/page.tsx       ← Login form (email + Google sign-in)
│       │   ├── signup/page.tsx      ← New account creation form
│       │   ├── onboarding/page.tsx  ← 10-step health profile quiz (once per user)
│       │   ├── dashboard/
│       │   │   ├── layout.tsx       ← Auth gate + onboarding check + BottomNav wrapper
│       │   │   └── page.tsx         ← Main daily tracking screen
│       │   ├── history/
│       │   │   ├── layout.tsx       ← Auth gate + BottomNav wrapper
│       │   │   └── page.tsx         ← Monthly calendar + last 7 days detail
│       │   ├── progress/
│       │   │   ├── layout.tsx       ← Auth gate + BottomNav wrapper
│       │   │   └── page.tsx         ← Stats + bar charts (last 30 days)
│       │   ├── badges/
│       │   │   ├── layout.tsx       ← Auth gate + BottomNav wrapper
│       │   │   └── page.tsx         ← Badge collection (earned + locked)
│       │   └── api/
│       │       └── auth/
│       │           └── session/
│       │               └── route.ts ← POST (create session) + DELETE (sign out)
│       ├── components/
│       │   ├── diet/
│       │   │   ├── meal-card.tsx    ← Interactive meal logging card (expand/rate/save)
│       │   │   ├── score-ring.tsx   ← SVG circular progress (0-9 pts)
│       │   │   ├── streak-display.tsx ← Flame icon + streak count + grace dots
│       │   │   ├── badge-card.tsx   ← Single badge tile (earned vs locked)
│       │   │   ├── bottom-nav.tsx   ← Fixed bottom navigation bar (4 tabs + sign out)
│       │   │   └── progress-charts.tsx ← Recharts bar + area charts
│       │   └── ui/                  ← shadcn/ui components (copied into codebase)
│       │       ├── button.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── card.tsx
│       │       ├── badge.tsx
│       │       ├── progress.tsx
│       │       ├── select.tsx
│       │       ├── separator.tsx
│       │       ├── textarea.tsx
│       │       └── sonner.tsx
│       ├── lib/
│       │   ├── firebase/
│       │   │   └── client.ts        ← Firebase app init + auth instance + Google provider
│       │   ├── supabase/
│       │   │   ├── server.ts        ← Supabase client with service role key (server only)
│       │   │   └── client.ts        ← Supabase client for browser (public URL only)
│       │   ├── session.ts           ← Create / read / delete __fv_session JWT cookie
│       │   ├── streak.ts            ← Pure streak calculation logic (no DB calls)
│       │   └── utils.ts             ← cn() class-merge utility from shadcn
│       ├── types/
│       │   └── index.ts             ← All TypeScript types + POINTS map + BADGE_DEFINITIONS
│       └── proxy.ts                 ← Middleware logic (see section 6 for details)
│
└── crm/                             ← CRM app (crm.fitterverse.in)
    ├── apphosting.yaml              ← Firebase deployment config for CRM
    ├── firebase.json                ← Firebase project config
    ├── next.config.ts               ← *** Has turbopack.root + outputFileTracingRoot anchors ***
    ├── package.json                 ← CRM-specific dependencies (leaner than consumer app)
    ├── pnpm-lock.yaml               ← Exact pinned versions
    ├── pnpm-workspace.yaml          ← *** CRITICAL: marks crm/ as standalone workspace ***
    ├── postcss.config.mjs           ← PostCSS config for Tailwind
    ├── tsconfig.json                ← TypeScript settings (scoped to src/ only — important!)
    ├── supabase/
    │   └── crm_migration.sql        ← SQL to create crm_users table + seed admin account
    └── src/
        ├── app/
        │   ├── layout.tsx           ← Root HTML: noindex meta, Toaster (top-right)
        │   ├── globals.css          ← Light-mode styling (whites, grays, green accents)
        │   ├── page.tsx             ← Root "/" — redirects based on session
        │   ├── login/page.tsx       ← Split-screen login: branded left + form right
        │   ├── (dashboard)/         ← Route group: ALL pages inside require login
        │   │   ├── layout.tsx       ← Auth gate + Sidebar wrapper for all CRM pages
        │   │   ├── dashboard/
        │   │   │   └── page.tsx     ← Stats overview (user counts, top streaks)
        │   │   ├── users/
        │   │   │   ├── page.tsx     ← Searchable user table
        │   │   │   └── [id]/
        │   │   │       └── page.tsx ← Individual user deep-dive
        │   │   └── team/
        │   │       ├── page.tsx     ← Team member list with inline role editor
        │   │       ├── role-toggle.tsx ← Client component: PATCH role/active status
        │   │       └── new/
        │   │           └── page.tsx ← Add new team member form
        │   └── api/
        │       ├── auth/
        │       │   ├── login/route.ts  ← POST: verify CRM login, issue session cookie
        │       │   └── logout/route.ts ← POST: delete session cookie
        │       └── team/route.ts       ← GET/POST/PATCH crm_users (admin only)
        ├── components/
        │   └── sidebar.tsx          ← Left nav: logo, links (role-filtered), user + logout
        └── lib/
            ├── auth.ts              ← hashPassword() + verifyPassword() using scrypt
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
- **Routing:** Every folder in `src/app/` becomes a URL. `src/app/dashboard/page.tsx` → `yoursite.com/dashboard`.
- **App Router:** The newer routing system (since Next.js 13). Pages live in `src/app/`, not `src/pages/`.
- **Server Components:** Pages that fetch data are rendered on the server (faster first load, better SEO, secure — DB keys never reach the browser).
- **Client Components:** Interactive parts (forms, buttons with state) are marked `'use client'` and run in the browser.
- **Server Actions:** Functions marked `'use server'` that can be called directly from React components — no separate API server needed.
- **API Routes:** `route.ts` files act as REST API endpoints when you need traditional HTTP calls (used for auth).

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
**Plain English:** Those small popup messages that appear and disappear — "Breakfast saved! +3 pts" or "Wrong password".

Used in both apps. Consumer app: `Toaster position="top-center"`. CRM: `Toaster position="top-right"`.

---

### date-fns — Date Utilities
**Plain English:** A toolbox for working with dates. Formats them, compares them, adds/subtracts days.

Used for: `format(new Date(), 'yyyy-MM-dd')` → `"2026-05-04"`, formatting display dates like `"Monday, May 4"`.

---

### Lucide React — Icons
**Plain English:** A library of 1000+ clean, consistent SVG icons. Used as React components: `<Flame size={20} />`, `<Users />`, `<ArrowLeft />`.

---

### Firebase App Hosting — Deployment Platform
**Plain English:** Google's service that takes our code from GitHub, builds it, and serves it to users worldwide.

Automatically redeploys whenever code is pushed to the `main` branch. No manual deployment steps needed.

**Two separate backends:**
- `fitterverse-app` → builds from `product/` → serves `fitterverse.in`
- `fitterverse-crm` → builds from `crm/` → serves `crm.fitterverse.in`

---

### pnpm — Package Manager
**Plain English:** The tool that installs JavaScript libraries. Like an app store for code packages.

Faster and more disk-efficient than the standard `npm`. Reads `package.json` and installs everything into `node_modules/`. The `pnpm-lock.yaml` file pins exact versions so every machine gets identical installs.

---

### Google Fonts (Geist) — Typography (consumer app)
**Plain English:** Loads the fonts used in the app.

The consumer app uses **Geist Sans** (the main body/UI font) and **Geist Mono** (for monospace/code-like text). Loaded via `next/font/google` which optimizes and self-hosts them automatically.

---

## 5. The Database — Supabase

All data lives in one Supabase project (`wwzabsfwfojsizexptxe.supabase.co`). Both apps connect using the same service role key.

**Row Level Security:** All 5 consumer tables have RLS enabled as a safety net. However, all actual DB operations use the service role key (which bypasses RLS). RLS rules are not explicitly written — the service role bypasses them anyway.

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

**Lifecycle:** Row is created on first-ever login (via `POST /api/auth/session`). Updated when onboarding is completed (`saveOnboarding()` action). Read by the dashboard for name and calorie limit; read by CRM user detail page.

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

**Unique constraint:** `(user_id, date, meal_type)` — only one breakfast per user per day. If breakfast is logged twice, it **upserts** (updates the existing row instead of creating a second one).

**Why `points` is stored:** Performance — querying `SUM(points)` is instant. Computing from rating string on every query would be slower.

**Lifecycle:** Written by `saveMeal()` action. Read by dashboard (today's meals), history page (last 90 days), CRM user detail (last 30 days).

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

**Unique constraint:** `(user_id, date)` — one row per day.

**Lifecycle:** Recomputed by `recomputeDailyScore()` every time any meal is saved. The logic: query all `meal_logs` for this user+date → sum points → update this row. Read by dashboard score ring, history calendar, progress charts.

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

**Streak rules (exactly as coded in `src/lib/streak.ts`):**
- **Good day:** `total_points >= 6` → streak increments by 1, `consecutive_bad_days` resets to 0
- **Bad day:** `total_points < 6` → `consecutive_bad_days` increments by 1
- **Streak breaks:** when `consecutive_bad_days >= 3` → `current_streak` resets to 0
- **Grace period:** 2 bad days are allowed before the streak breaks on the 3rd
- **Skipped/Fasting:** counts as 3 points (same as healthy) — fasting is never penalised
- **No double-update:** If `last_updated == today`, streak is not recalculated (idempotent)

**Lifecycle:** Created when user first signs up. Updated by `updateStreak()` only when a meal is saved for **today's date** (not backdated meals). Read by dashboard streak display, CRM user detail.

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

**All 9 badge definitions (from `src/types/index.ts`):**

| Slug | Name | Icon | Color | How to earn |
|---|---|---|---|---|
| `first_meal` | First Bite | 🍽️ | `#6366f1` (indigo) | Log your very first meal |
| `perfect_day` | Perfect Day | ⭐ | `#f59e0b` (amber) | Score 9/9 in one day |
| `streak_1` | Getting Started | 🔥 | `#f97316` (orange) | 1-day streak |
| `streak_3` | Three-peat | 💪 | `#22c55e` (green) | 3-day streak |
| `streak_7` | One Full Week | 🏆 | `#3b82f6` (blue) | 7-day streak |
| `streak_21` | 21-Day Warrior | ⚡ | `#8b5cf6` (purple) | 21-day streak |
| `streak_90` | Quarter Master | 💎 | `#06b6d4` (cyan) | 90-day streak |
| `streak_180` | Half Year Hero | 🚀 | `#ec4899` (pink) | 180-day streak |
| `streak_365` | Legend | 👑 | `#fbbf24` (yellow) | 365-day streak |

**Lifecycle:** Checked and inserted by `getBadgesToAward()` inside `updateStreak()`. Awards are idempotent — checks `alreadyEarned` before inserting. Read by dashboard (last 3 recent badges), badges page (all earned + all locked).

---

### Table 6: `crm_users`
CRM team member accounts. Completely separate from consumer users.

| Column | Type | Default | What it stores |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | |
| `email` | text UNIQUE | (required) | e.g. "priya@fitterverse.in" |
| `password_hash` | text | (required) | Format: `"salt:hash"` (scrypt) |
| `full_name` | text | (required) | e.g. "Priya Sharma" |
| `role` | text | `nutritionist` | One of: `admin` / `master_coach` / `nutritionist` / `trainer` / `sales` |
| `is_active` | boolean | true | Can they log in? Deactivate without deleting the record. |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Index:** `crm_users_email_idx` on `email` for fast login lookup.

**Seeded admin:** `fitterverse.in@gmail.com` / `Fitterverse@123` (hash stored, not the plaintext).

**Lifecycle:** Created by admin via the "Add team member" form → `POST /api/team`. Password hashed before insert. Modified via `PATCH /api/team` (role change or deactivate/reactivate).

---

## 6. Consumer App — `product/`

### Root Files

#### `product/next.config.ts`
```ts
turbopack: { root: path.resolve(__dirname) }
```
Anchors Turbopack's workspace root to the `product/` directory. Without this, during Cloud Build, Turbopack might traverse up to the repo root and find the CRM's files.

#### `product/pnpm-workspace.yaml`
```yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```
Marks `product/` as its own pnpm workspace (prevents pnpm from looking for a root workspace). Also ignores packages that require native binary compilation during install (avoids Cloud Build failures).

#### `product/components.json`
shadcn/ui configuration: sets style (`default`), TypeScript on, Tailwind CSS config paths, component aliases (`@/components/ui/`).

---

### `src/app/layout.tsx` — Root HTML Layout

**What it does:** Wraps every single page in the consumer app. Sets up:
- **Geist Sans font** — loaded from Google Fonts via `next/font/google`, applied as CSS variable `--font-geist-sans`
- **Geist Mono font** — same, applied as `--font-geist-mono`
- **Dark theme** — the `<html>` element has `class="dark"` hardcoded (app is always dark mode)
- **SEO metadata** — `title: "Fitterverse Diet Tracker"`, `description: "Track your meals, build streaks, earn badges"`
- **Toaster** — the Sonner toast container, positioned `top-center`, with `richColors` enabled

This file runs on the server. Every page is a child of this layout.

---

### `src/app/globals.css` — Design System / Theme

This CSS file defines the entire visual design of the consumer app through CSS custom properties (variables).

**Key design choices:**
- **Color space:** Uses `oklch()` — a modern color format that's more perceptually uniform than hex/rgb
- **Forced dark mode:** The `:root` block at the bottom of the file overrides with dark theme values (dark background, light text, green primary)
- **Primary color:** `oklch(0.72 0.19 145)` — a vibrant green used for buttons, progress rings, streak indicators
- **Background:** `oklch(0.1 0 0)` — very dark, near-black
- **Card background:** `oklch(0.13 0 0)` — slightly lighter than background for depth
- **Border radius:** `0.75rem` — applied to all rounded corners
- **Custom scrollbar:** Thin 4px scrollbar with transparent track
- **Streak fire animation:** `@keyframes flicker` — the streak flame icon gently pulses using a CSS animation class `.streak-fire`

---

### `src/app/page.tsx` — Root Redirect

**URL:** `fitterverse.in/`

A server component. Reads the session cookie. If valid → `redirect('/dashboard')`. If not → `redirect('/login')`. No UI rendered — just an instant redirect.

---

### `src/app/login/page.tsx` — Login Page

**URL:** `fitterverse.in/login`

**Type:** Client component (`'use client'` — needs event handlers, useState, Firebase SDK)

**What's on screen:**
- Fitterverse logo
- "Sign in with Google" button (primary CTA)
- Divider line with "or"
- Email + password fields
- "Sign in" button
- "Don't have an account? Sign up" link

**Email+password flow:**
1. Firebase `signInWithEmailAndPassword(auth, email, password)` — Firebase validates
2. On success: `POST /api/auth/session` with `{uid, email}` → server creates cookie
3. Response has `onboardingCompleted: true/false` → redirect to `/dashboard` or `/onboarding`
4. On failure: Sonner toast with Firebase error message

**Google flow:**
1. `signInWithPopup(auth, googleProvider)` — opens Google popup
2. Same session creation step
3. Same redirect logic

**UI components used:** Card, CardHeader, CardContent, Input, Label, Button (all from `src/components/ui/`). Loader2 spinner from Lucide while loading.

---

### `src/app/signup/page.tsx` — Signup Page

**URL:** `fitterverse.in/signup`

**Type:** Client component

Same form layout as login but uses `createUserWithEmailAndPassword()`. New users always go to `/onboarding` (never to `/dashboard` directly).

---

### `src/app/onboarding/page.tsx` — Onboarding Quiz

**URL:** `fitterverse.in/onboarding`

**Type:** Client component

A 10-step animated quiz run once when a user first signs up. Uses `useState` to track current step + form values. Uses Framer Motion's `<motion.div>` with `<AnimatePresence>` for slide transitions (current question slides out left, next slides in right).

**10 questions / data collected:**
1. Full name + age
2. Current weight (kg) + height (cm) + goal weight (kg)
3. Activity level (sedentary / light / moderate / active)
4. Diet goal (lose weight / gain muscle / better energy / balanced)
5. Dietary restrictions (none / vegetarian / vegan / jain / keto / gluten-free)
6. Biggest challenge (cravings / busy schedule / portion control / social eating / emotional eating)
7. Meal times (breakfast, lunch, dinner times as "HH:MM" strings)
8. Whether they practice fasting (yes/no toggle)
9. Target calories per meal (slider or number input, default 650)
10. Motivation (free text)

**On submit:** Calls `saveOnboarding(formData)` server action → upserts `profiles` row with all data + sets `onboarding_completed = true` → redirects to `/dashboard`.

---

### `src/app/dashboard/layout.tsx` — Dashboard Auth Gate

**Type:** Server component (runs on every dashboard page load)

**What it does:**
1. Calls `getSession()` — reads + verifies `__fv_session` cookie
2. If no session → `redirect('/login')`
3. Queries `profiles` table for `onboarding_completed`
4. If not completed → `redirect('/onboarding')`
5. Renders: `<div className="min-h-screen bg-background"><main ...>{children}</main><BottomNav /></div>`

This layout wraps `/dashboard` only (not `/history`, `/progress`, `/badges`). The other pages have their own layouts that also check for session but skip the onboarding check.

---

### `src/app/dashboard/page.tsx` — Main Tracking Screen

**URL:** `fitterverse.in/dashboard`

**Type:** Server component (data fetched server-side)

**What's on screen (top to bottom):**
1. **Header row:** Greeting (`"Good morning, Priya 👋"` with time-based greeting) + today's date + meals logged count (`"2/3 logged"`)
2. **Score + Streak grid (2 columns):**
   - Left: `<ScoreRing>` showing `totalPoints / 9` + status text
   - Right: `<StreakDisplay>` with streak count + `<StreakGraceDots>` if grace period active
3. **Grace period warning banner** (amber) — shows if `consecutive_bad_days > 0`
4. **Meal cards section:** Three `<MealCard>` components for breakfast, lunch, dinner
5. **Recent badges:** Last 3 earned badges (if any)
6. **Motivation tip:** Bottom nudge card when no meals logged yet (`totalPoints === 0`)

**Data:** Calls `getTodayData()` (4 parallel Supabase queries) + one more query for profile (name, calorie limit). All data fetched in parallel with `Promise.all`.

---

### `src/app/history/page.tsx` — History Page

**URL:** `fitterverse.in/history`

**Type:** Server component

**What's on screen:**
- **Month calendar:** Each day rendered as a coloured dot:
  - Bright green = 9 pts (perfect day)
  - Teal = streak day (6–8 pts)
  - Amber = some meals logged (1–5 pts)
  - Red = meals logged but poor score
  - Light grey = nothing logged
- **Last 7 days detail:** Each day expanded, meals listed as coloured pills (Healthy/Medium/Junk/Skipped in respective colours)

**Data:** `getHistoryData(90)` — last 90 days of scores + last 90×3=270 meal logs.

---

### `src/app/progress/page.tsx` — Progress Charts

**URL:** `fitterverse.in/progress`

**Type:** Server component (data) + `ProgressCharts` client component (Recharts)

**What's on screen:**
- **4 stat cards:** Avg score/day, Streak days count, Perfect days count, Completion %
- **Bar chart:** Daily scores over last 30 days (bars coloured green/amber/red by score)
- **Meal distribution:** Horizontal stacked breakdown (healthy % vs medium % vs junk % vs skipped %)

**Data:** `getHistoryData(30)` — last 30 days.

---

### `src/app/badges/page.tsx` — Badge Collection

**URL:** `fitterverse.in/badges`

**Type:** Server component

**What's on screen:**
- **Progress header:** "X/9 badges earned" with a progress bar
- **Special badges section:** First Bite + Perfect Day
- **Streak badges section:** All 7 streak badges in order (Getting Started → Legend)
- Earned badges: full colour with icon + earned date
- Locked badges: greyed out with requirement text

**Data:** `getBadgesData()` — earned badges + current streak + `BADGE_DEFINITIONS` array.

---

### `src/app/actions.ts` — All Server Actions

Marked `'use server'` at the top — every function in this file runs on the server, called directly from React components.

**Auth:**
- `signOut()` → calls `deleteSession()` + `redirect('/login')`
- `requireSession()` → gets session or redirects (used internally by other actions)

**Onboarding:**
- `saveOnboarding(data)` → upserts `profiles` row with all 16 onboarding fields + `onboarding_completed: true`

**Meal logging:**
- `saveMeal({meal_type, rating, calories, note, date})` → upserts `meal_logs` row → calls `recomputeDailyScore` → calls `revalidatePath('/dashboard')` and `revalidatePath('/history')`
- `recomputeDailyScore(userId, date)` [internal] → sums all meal points for user+date → upserts `daily_scores` → if date is today, calls `updateStreak`
- `updateStreak(userId, date, totalPoints)` [internal] → reads `user_streaks` → calls `calculateNewStreak()` → updates `user_streaks` → checks + awards new badges → calls `revalidatePath('/badges')`

**Data fetching:**
- `getTodayData()` → 4 parallel queries: today's meals, today's score, streak, last 3 badges
- `getHistoryData(days)` → scores + meals for last N days
- `getBadgesData()` → earned badges + streak + BADGE_DEFINITIONS
- `getProfile()` → full profile row for current user

---

### `src/app/api/auth/session/route.ts` — Session API

**POST `/api/auth/session`**

Called by the browser immediately after Firebase login succeeds (Firebase runs client-side, the session cookie needs a server call).

1. Reads `{uid, email}` from request body
2. Checks if `profiles` row exists for this uid
3. **New user:** inserts row in `profiles` (with just uid+email) AND inserts row in `user_streaks` (all zeros)
4. **Existing user:** reads `onboarding_completed` flag
5. Calls `createSession(uid, email)` → creates `__fv_session` JWT cookie
6. Returns `{ok: true, onboardingCompleted: boolean}`

**DELETE `/api/auth/session`**

Calls `deleteSession()` → removes the cookie. Returns `{ok: true}`.

---

### `src/proxy.ts` — Middleware Logic

**Important context:** This file is named `proxy.ts` (not `middleware.ts`) to prevent the CRM's Turbopack build from accidentally finding and compiling it. Next.js only auto-runs files named exactly `middleware.ts` — so this file's logic is **not** currently executing as Next.js Edge Middleware.

**Actual route protection mechanism:** Each section of the app has a layout server component that calls `getSession()` and `redirect('/login')` if no session is found. This is where the real protection lives.

**What `proxy.ts` contains:** The complete middleware logic — session verification via `jwtVerify`, public route detection, redirect logic, and a `config.matcher` that would exclude static files. This serves as a reference implementation and could be activated by renaming to `middleware.ts` in the future.

---

### `src/lib/firebase/client.ts` — Firebase Initialisation

Creates the Firebase app (using `NEXT_PUBLIC_FIREBASE_*` env vars) and exports:
- `auth` — the Firebase Auth instance used for `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`
- `googleProvider` — `GoogleAuthProvider` instance for `signInWithPopup`

**Client-side only.** The `NEXT_PUBLIC_*` Firebase credentials are safe to expose in the browser — they identify the project but don't grant admin access. Firebase Auth rules control what authenticated users can do.

---

### `src/lib/supabase/server.ts` — Server Supabase Client

Creates a `SupabaseClient` using `SUPABASE_SERVICE_ROLE_KEY`. This key has full read/write access to the entire database, bypassing Row Level Security.

**Server-side only** — never imported in client components. Used in all server actions and API routes.

---

### `src/lib/supabase/client.ts` — Browser Supabase Client

Creates a `SupabaseClient` using only the public `NEXT_PUBLIC_SUPABASE_URL`. No sensitive key. Limited to what's allowed by RLS rules (which in practice block everything from the browser since we use service role on server).

Used only when a browser component needs to make a direct Supabase call (rare — most data flows through server actions).

---

### `src/lib/session.ts` — Consumer Session Management

Four functions:
- `createSession(uid, email)` → signs a JWT with `SESSION_SECRET`, sets `__fv_session` cookie (httpOnly, secure, lax, 14 days, path `/`)
- `getSession()` → reads cookie → verifies JWT → returns `{uid, email}` or `null`
- `deleteSession()` → removes the cookie
- `verifySessionToken(token)` → verifies an arbitrary token string (used internally)

JWT payload: `{uid: string, email: string}`, algorithm HS256, expires 14 days.

---

### `src/lib/streak.ts` — Streak Logic

Pure functions — no database calls, no side effects.

- `calculateNewStreak(streak, todayPoints, today)` — Takes current streak state + today's score → returns new streak state object. Constants: `MIN_STREAK_POINTS = 6`, `STREAK_BREAK_DAYS = 3`.

  Logic:
  - If `todayPoints >= 6`: increment `current_streak`, reset `consecutive_bad_days` to 0, update `longest_streak` if new record
  - If `todayPoints < 6`: increment `consecutive_bad_days`. If `consecutive_bad_days >= 3`: reset `current_streak` to 0 and `consecutive_bad_days` to 0

- `getBadgesToAward(currentStreak, alreadyEarned, isPerfectDay, isFirstMeal)` — returns array of new `BadgeSlug` values to award. Checks `first_meal`, `perfect_day`, and all streak thresholds (1, 3, 7, 21, 90, 180, 365).

- `getStreakMessage(streak, consecutiveBadDays)` — returns a motivational string. If bad days active: warns about remaining days. Otherwise scales from "Start your streak!" → "ABSOLUTE LEGEND! 👑" at 365 days.

---

### `src/types/index.ts` — All Type Definitions

Central type file. Everything TypeScript needs to know about the data shapes:
- `MealType` = `'breakfast' | 'lunch' | 'dinner'`
- `MealRating` = `'healthy' | 'medium' | 'junk' | 'skipped'`
- `POINTS` map — `{healthy: 3, medium: 2, junk: 1, skipped: 3}`
- `RATING_LABELS` — display names for each rating
- `RATING_COLORS` — hex colors per rating (green/amber/red/indigo)
- `MEAL_LABELS` — "Breakfast", "Lunch", "Dinner"
- `MEAL_EMOJIS` — 🌅 / ☀️ / 🌙
- Interfaces: `MealLog`, `DailyScore`, `UserStreak`, `UserBadge`, `Profile`
- `BadgeSlug` union type
- `BadgeDefinition` interface
- `BADGE_DEFINITIONS` array — all 9 badges with slug, name, description, icon emoji, hex color, requirement (streak days)

---

### `src/components/diet/meal-card.tsx` — Meal Logging Card

**Type:** Client component

The core interactive element of the app. One instance per meal (breakfast, lunch, dinner).

**Collapsed state:** Shows meal name + emoji, current rating (if logged) as coloured text, points earned, expand chevron.

**Expanded state:**
- 4 rating buttons in a row: ✅ Healthy (3pts) / 🟡 Medium (2pts) / 🔴 Junk (1pt) / ⏭️ Skipped (3pts)
- Optional: calories number input
- Optional: note text area
- Warning text if `calories > calorieLimit && rating === 'healthy'` ("You might be overeating")
- "Save" button

**On save:** Calls `saveMeal(...)` server action → shows Sonner toast `"Breakfast saved! +3 pts"` → collapses the card.

Uses `useState` for: expanded state, selected rating, calories, note, loading state.

---

### `src/components/diet/score-ring.tsx` — Score Ring

**Type:** Server component (pure, no state)

Renders an SVG circle progress ring. Props: `score` (0–9), `maxScore` (9), `size`, `strokeWidth`.

**Color logic:**
- 0 pts → grey (`hsl(240 3.7% 15.9%)`)
- 1–5 pts → amber (`hsl(38 92% 50%)`)
- 6–8 pts → green (`hsl(142 71% 45%)`)
- 9 pts → bright green (`hsl(142 76% 55%)`)

Shows `score/maxScore` text in the center. The circle fills proportionally using SVG `stroke-dasharray` and `stroke-dashoffset`.

---

### `src/components/diet/streak-display.tsx` — Streak Display

**Type:** Server component

`StreakDisplay` component: Shows flame icon (with `.streak-fire` CSS animation) + `current_streak` number + "day streak" label. Also shows `longest_streak` below.

`StreakGraceDots` component: Shows 3 small dots indicating grace period status. Red dot = bad day used. Grey dot = remaining grace day. Only rendered when `consecutive_bad_days > 0`.

---

### `src/components/diet/badge-card.tsx` — Badge Card

**Type:** Server component (no interactivity)

**Earned badge:** Full color with icon emoji, badge name, earned date formatted as "May 4, 2026".

**Locked badge:** Greyed out with opacity, shows requirement ("Reach a 7-day streak").

Props: `definition: BadgeDefinition`, `earned: UserBadge | null`, `currentStreak: number`.

---

### `src/components/diet/bottom-nav.tsx` — Bottom Navigation

**Type:** Client component (needs `usePathname` hook to highlight active tab)

Fixed to the bottom of the screen on all dashboard pages. 4 navigation tabs:

| Icon | Label | URL |
|---|---|---|
| Home | Today | `/dashboard` |
| Calendar | History | `/history` |
| TrendingUp | Progress | `/progress` |
| Trophy | Badges | `/badges` |

Plus a sign-out button (LogOut icon) that:
1. Calls Firebase's client-side `signOut(auth)` — clears Firebase session
2. Calls server `signOut()` action — deletes the `__fv_session` cookie
3. Redirects to `/login`

Active tab has brighter/larger styling. Inactive tabs are muted.

---

### `src/components/diet/progress-charts.tsx` — Charts

**Type:** Client component (`'use client'` — Recharts needs browser DOM)

Receives pre-fetched data as props from the server component. Renders:
- `BarChart` of daily scores (last 30 days) — bars coloured by score (red < 6, green ≥ 6)
- `AreaChart` or breakdown for meal distribution (healthy vs medium vs junk vs skipped percentages)

---

### `src/components/ui/` — shadcn/ui Primitives

All these files are copied into the codebase (not a black-box dependency). Fully customisable.

| File | Component(s) | What it is |
|---|---|---|
| `button.tsx` | `Button` | Styled button with variants: default, outline, ghost, destructive, link. Size variants: default, sm, lg, icon. |
| `input.tsx` | `Input` | Styled `<input>` text field. |
| `label.tsx` | `Label` | Styled `<label>` for form fields. |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Container box with structured sections. |
| `badge.tsx` | `Badge` | Small pill/chip for status labels. Variants: default, secondary, destructive, outline. |
| `progress.tsx` | `Progress` | Horizontal progress bar, 0–100. |
| `select.tsx` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | Accessible dropdown selector. |
| `separator.tsx` | `Separator` | Horizontal or vertical dividing line. |
| `textarea.tsx` | `Textarea` | Multi-line text input. |
| `sonner.tsx` | `Toaster` | Toast notification container (wraps Sonner library). |

---

## 7. CRM App — `crm/`

### Root Files

#### `crm/next.config.ts`
```ts
turbopack: { root: path.resolve(__dirname) }
outputFileTracingRoot: path.resolve(__dirname)
```
**Critical.** These two lines anchor the build context to the `crm/` directory. Without them, Turbopack traverses up to the repo root and accidentally tries to compile the consumer app's files (which import `jose` from the consumer's `node_modules`). See section 14 for the full explanation.

#### `crm/tsconfig.json`
Has `"include": ["src/**/*.ts", "src/**/*.tsx", ...]` — explicitly scoped to `src/` only. This prevents TypeScript from traversing up to parent directories.

#### `crm/pnpm-workspace.yaml`
Same as consumer app — marks `crm/` as its own standalone pnpm workspace.

---

### `src/app/layout.tsx` — CRM Root Layout

Minimal HTML shell:
- No custom fonts (uses system fonts)
- `robots: 'noindex, nofollow'` — CRM is intentionally hidden from search engines
- `Toaster position="top-right"` (different from consumer app's `top-center`)
- No dark mode class — CRM uses light mode (white background, grey text)

---

### `src/app/globals.css` — CRM Styles

Light-mode design: white backgrounds, grey borders, slate text, green accents (`green-500` / `green-600`). No dark mode overrides. Clean and minimal — focused on data density.

---

### `src/app/page.tsx` — CRM Root Redirect

Server component. Reads `__crm_session` cookie. If session valid → `redirect('/dashboard')`. If not → `redirect('/login')`.

---

### `src/app/login/page.tsx` — CRM Login

**URL:** `crm.fitterverse.in/login`

**Type:** Client component

**Layout:** Two-column split screen:
- **Left panel (dark, branded):** Dark slate-900 background, Fitterverse logo, "Internal Tools" label, tagline about the team
- **Right panel (white, form):** Email + password fields, "Sign in" button

**Flow:**
1. Client `POST /api/auth/login` with `{email, password}`
2. Server looks up email in `crm_users`, verifies password with `verifyPassword()`, checks `is_active`
3. On success: `createSession()` sets `__crm_session` cookie, server returns `{ok: true, role}`
4. Client redirects to `/dashboard`
5. On failure: Sonner toast with error

---

### `src/app/(dashboard)/layout.tsx` — CRM Auth Gate

**Type:** Server component. Wraps ALL pages inside the `(dashboard)/` route group.

1. Calls `getSession()` on `__crm_session` cookie
2. If no session → `redirect('/login')`
3. Renders: `<div className="flex h-screen"><Sidebar session={session} /><main className="flex-1 overflow-auto">{children}</main></div>`

The `(dashboard)` folder name uses parentheses — this is a Next.js **route group**. The folder name does NOT become part of the URL. Pages inside are at `/dashboard`, `/users`, `/team` — not `/dashboard/dashboard`, etc.

---

### `src/app/(dashboard)/dashboard/page.tsx` — CRM Dashboard

**URL:** `crm.fitterverse.in/dashboard`

**Type:** Server component. Has `export const dynamic = 'force-dynamic'` — disables caching so stats are always fresh.

**4 stat cards:**
| Card | Data source | What it shows |
|---|---|---|
| Total Users | `COUNT(*)` on `profiles` | Total registered consumer users |
| Active Today | `COUNT(*)` on `daily_scores WHERE date = today` | Users who logged at least one meal today |
| Total Meals Logged | `COUNT(*)` on `meal_logs` | All-time total meals logged across all users |
| Users Active Today % | (activeToday / totalUsers) × 100 | Engagement percentage for today |

**Top 5 Streaks:** Queries `user_streaks` ordered by `current_streak DESC LIMIT 5`. Shows user ID (first 8 chars) + current streak.

**Greeting:** Uses `session.full_name.split(' ')[0]` to get first name of the logged-in CRM user.

**Access:** All roles.

---

### `src/app/(dashboard)/users/page.tsx` — User List

**URL:** `crm.fitterverse.in/users`

**Type:** Server component

**What's on screen:**
- Search box (URL param `?q=searchterm`)
- Table of users: Name + Email | Current Streak | Last Active (date from `user_streaks.last_updated`) | Onboarded (Yes/No) | "View" link

**Search:** Uses Supabase `.ilike('email', '%q%')` and `.ilike('full_name', '%q%')` — case-insensitive partial match. Triggered by `?q=` URL parameter (no JavaScript needed — server renders filtered results).

**Data:** Join of `profiles` + `user_streaks` table (matched on `profiles.id = user_streaks.user_id`).

**Access:** All roles.

---

### `src/app/(dashboard)/users/[id]/page.tsx` — User Detail

**URL:** `crm.fitterverse.in/users/[firebase-uid]`

**Type:** Server component. The `[id]` in the folder name is a dynamic segment — whatever is in the URL becomes the `id` parameter.

**What's on screen:**

Left column:
- **Streak card:** current streak + longest streak + streak start date
- **Profile details:** Diet goal, age, weight/height (if provided), activity level, dietary restrictions
- **Badges earned:** All badges this user has, with icons and earned dates

Right column:
- **Last 14 days score grid:** 14 coloured boxes, each showing the day's total points. Colour-coded green/amber/red. Missing days shown as light grey.
- **Recent meals:** Last 7 days of meals grouped by date. Each meal shown as a coloured pill (Healthy/Medium/Junk/Skipped).

**Data:** 5 parallel queries via `Promise.all`:
1. `profiles` — profile data
2. `user_streaks` — streak data
3. `user_badges` — earned badges
4. `meal_logs` last 30 rows — meal history
5. `daily_scores` last 14 rows — score grid

**Access:** All roles.

---

### `src/app/(dashboard)/team/page.tsx` — Team Management

**URL:** `crm.fitterverse.in/team`

**Type:** Server component

**Access control:** Checks `session.role === 'admin'`. If not admin → `redirect('/dashboard')`.

**What's on screen:**
- "Add team member" button (links to `/team/new`)
- Table of all CRM users: Name | Email | Role (colour-coded badge) | Status (Active/Inactive green/red pill) | Added date | Edit controls

**Edit controls:** Each row contains a `<RoleToggle>` client component for inline editing.

---

### `src/app/(dashboard)/team/role-toggle.tsx` — Inline Role Editor

**Type:** Client component

Rendered inside each row of the team table. Contains:
- Role dropdown (select) — current role pre-selected
- "Save Role" button
- Activate / Deactivate button (toggles `is_active`)

**On change:** `PATCH /api/team` with `{id, role}` or `{id, is_active}` → Sonner toast → `router.refresh()` to reload the server component data.

---

### `src/app/(dashboard)/team/new/page.tsx` — Add Team Member

**URL:** `crm.fitterverse.in/team/new`

**Type:** Client component

**Fields:**
- Full name (required)
- Work email (required, type="email")
- Role (dropdown: Admin / Master Coach / Nutritionist / Trainer / Sales) — default: Nutritionist
- Temporary password (required, min 8 chars)

**On submit:** `POST /api/team` → server hashes password, inserts `crm_users` row → Sonner success toast → `router.push('/team')`.

**Note for admins:** Password shown as hint — "Share this with the team member — they can't change it yet."

---

### `src/app/api/auth/login/route.ts` — CRM Login API

**POST `/api/auth/login`**

1. Reads `{email, password}` from request body
2. Queries `crm_users WHERE email = ?` — returns password_hash, full_name, role, is_active, id
3. If not found → `{error: 'Invalid email or password'}` (vague on purpose — don't reveal whether email exists)
4. If `is_active = false` → `{error: 'Account is deactivated'}`
5. `verifyPassword(password, stored_hash)` — if false → same vague error
6. `createSession({id, email, full_name, role})` — sets `__crm_session` JWT cookie
7. Returns `{ok: true, role}`

---

### `src/app/api/auth/logout/route.ts` — CRM Logout API

**POST `/api/auth/logout`**

Calls `deleteSession()` → removes `__crm_session` cookie → returns `{ok: true}`.

---

### `src/app/api/team/route.ts` — Team CRUD API

All requests check `session.role === 'admin'`. Non-admins get `403 Forbidden`.

**GET `/api/team`** → returns all rows from `crm_users` table (without `password_hash`).

**POST `/api/team`** — create new team member:
1. Validates: email, full_name, role, password all present
2. Validates role is one of the 5 allowed values
3. `hashPassword(password)` → `"salt:hash"` string
4. Inserts `crm_users` row
5. Returns `{ok: true, user: {id, email, full_name, role}}`

**PATCH `/api/team`** — update team member:
- Body `{id, role}` → updates role
- Body `{id, is_active}` → activates/deactivates
- Returns `{ok: true}`

---

### `src/components/sidebar.tsx` — CRM Sidebar

**Type:** Client component (needs `usePathname` for active link highlighting)

**Layout:** Fixed left sidebar, full screen height.

**Top section:**
- Fitterverse logo (green "F" mark)
- "CRM" label in slate text

**Navigation links (role-filtered):**

| Link | Icon | Roles that see it |
|---|---|---|
| Dashboard | LayoutDashboard | All roles |
| Users | Users | All roles |
| Team | Shield | Admin only |

Active link: green background with green text. Inactive: grey text.

**Bottom section:**
- Logged-in user's full name
- Role label (colour-coded pill: admin=purple, master_coach=blue, nutritionist=green, trainer=orange, sales=red)
- Sign out button → `POST /api/auth/logout` → `window.location.href = '/login'`

---

### `src/lib/auth.ts` — Password Hashing

```ts
hashPassword(password: string) → "salt:hash"
```
1. `randomBytes(16).toString('hex')` → 32-char hex salt
2. `scryptSync(password, salt, 64)` → 64-byte hash buffer
3. Returns `"${salt}:${hash.toString('hex')}"`

```ts
verifyPassword(password: string, stored: string) → boolean
```
1. Splits `stored` on `:` → `[salt, hash]`
2. `scryptSync(password, salt, 64)` → incoming hash buffer
3. `timingSafeEqual(incoming, Buffer.from(hash, 'hex'))` → boolean

`timingSafeEqual` is important — it prevents timing attacks where an attacker can determine if partial passwords match by measuring response time.

---

### `src/lib/session.ts` — CRM Session Management

Same pattern as consumer app but:
- Cookie name: `__crm_session`
- Secret env var: `CRM_SESSION_SECRET`
- JWT payload: `{id, email, full_name, role}` (not just uid+email)
- Expiry: 14 days

Exports: `createSession(payload)`, `getSession()` → `CrmSession | null`, `deleteSession()`.

Types exported: `CrmRole` (union type), `CrmSession` (interface).

---

### `src/lib/supabase.ts` — CRM Supabase Client

Single Supabase client using `SUPABASE_SERVICE_ROLE_KEY`. Simpler than the consumer app (no SSR package needed — CRM doesn't have client-side Supabase calls).

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

**Subsequent requests:** Every page load, the server components call `getSession()` which reads and verifies the `__fv_session` cookie. If valid, `uid` is extracted and used for all Supabase queries. If invalid/expired → `redirect('/login')`.

**Google sign-in:** Same flow, but step 1 uses `signInWithPopup(auth, googleProvider)` which opens a Google popup. Firebase handles the OAuth exchange and returns the same uid/email.

**Sign out:** `BottomNav` calls Firebase's `signOut(auth)` (clears Firebase session) + server `signOut()` action (deletes `__fv_session` cookie).

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
   │                                    │                          │
   │                                    │  4. verifyPassword()     │
   │                                    │     (scrypt comparison)  │
   │                                    │                          │
   │                                    │  5. Sign JWT, set cookie │
   │                                    │     __crm_session (14d)  │
   │  6. {ok: true, role}               │                          │
   │  ◄──────────────────────────────────                          │
   │                                    │                          │
   │  7. router.push('/dashboard')      │                          │
```

**No Firebase involved.** CRM authentication is entirely Supabase + custom JWT.

**Sign out:** `POST /api/auth/logout` → delete `__crm_session` → `window.location.href = '/login'`.

---

## 9. How Data Flows — Step by Step

### Logging a Meal (the core flow)

```
1.  User opens fitterverse.in/dashboard
    → Server reads __fv_session cookie → uid = "Ua3mK9..."
    → Queries today's meals, score, streak in parallel
    → Renders page with 3 MealCard components

2.  User taps "Breakfast" card → it expands (client-side useState)

3.  User taps "Healthy" button → rating state = 'healthy'

4.  User types "420" in the calories field (optional)

5.  User taps "Save"

────── CLIENT SIDE ──────
6.  MealCard calls:
    saveMeal({ meal_type: 'breakfast', rating: 'healthy', calories: 420, note: null, date: '2026-05-04' })

────── SERVER SIDE (actions.ts: saveMeal) ──────
7.  requireSession() → uid = "Ua3mK9..."
8.  mealDate = '2026-05-04' (format today)
9.  points = POINTS['healthy'] = 3

10. Supabase UPSERT into meal_logs:
    { user_id: uid, date: '2026-05-04', meal_type: 'breakfast', rating: 'healthy', calories: 420, points: 3 }
    ON CONFLICT (user_id, date, meal_type) DO UPDATE

────── SERVER SIDE (recomputeDailyScore) ──────
11. Query ALL meal_logs for uid + '2026-05-04':
    → breakfast: 3pts
    → lunch: 2pts (previously logged)
    → dinner: not yet logged
    → totalPoints = 5, mealsLogged = 2, isStreakDay = false (5 < 6)

12. Supabase UPSERT into daily_scores:
    { user_id: uid, date: '2026-05-04', total_points: 5, meals_logged: 2, is_streak_day: false }

13. date == today → call updateStreak(uid, '2026-05-04', 5)

────── SERVER SIDE (updateStreak) ──────
14. Query user_streaks WHERE user_id = uid
    → { current_streak: 7, consecutive_bad_days: 0, last_updated: '2026-05-03', ... }

15. last_updated != today → proceed with update

16. calculateNewStreak(streak, 5, today):
    → 5 pts is a bad day (< 6)
    → new consecutive_bad_days = 0 + 1 = 1
    → 1 < 3 → streak NOT broken
    → returns { current_streak: 7, consecutive_bad_days: 1, last_updated: '2026-05-04', ... }

17. Supabase UPDATE user_streaks SET ...

18. Query user_badges to get alreadyEarned slugs
19. getBadgesToAward(7, alreadyEarned, false, false):
    → streak_7 already earned → no new badges
    → returns []

────── BACK TO saveMeal ──────
20. revalidatePath('/dashboard') — invalidates Next.js page cache
21. revalidatePath('/history')
22. Returns { success: true }

────── CLIENT SIDE ──────
23. Toast: "Breakfast saved! +3 pts"
24. MealCard collapses, shows "Healthy ✓ 3 pts"
25. Dashboard re-renders with updated data (via Next.js cache revalidation)
```

---

### CRM Team Member Viewing a User

```
1. CRM user at crm.fitterverse.in/users/Ua3mK9... (clicks "View" link)

2. Server component runs:
   → Read __crm_session cookie → {id, role: 'nutritionist', ...}
   → (dashboard)/layout.tsx: session valid → render page

3. users/[id]/page.tsx receives params.id = "Ua3mK9..."

4. 5 parallel Supabase queries:
   → profiles WHERE id = 'Ua3mK9...'
   → user_streaks WHERE user_id = 'Ua3mK9...'
   → user_badges WHERE user_id = 'Ua3mK9...' ORDER BY earned_at
   → meal_logs WHERE user_id = 'Ua3mK9...' ORDER BY date DESC LIMIT 30
   → daily_scores WHERE user_id = 'Ua3mK9...' ORDER BY date DESC LIMIT 14

5. Page renders with all data — profile card, streak, badges, 14-day grid, recent meals

6. CRM user can see but NOT modify consumer user data
   (there are no edit/delete actions on this page)
```

---

## 10. Deployment & Hosting

### How Firebase App Hosting Works

1. You push code to the `main` branch on GitHub
2. Firebase App Hosting detects the push (via GitHub webhook)
3. Firebase starts a Cloud Build job in Google Cloud
4. Cloud Build: clones the repo → `cd crm/` (or `product/`) → `pnpm install` → `pnpm build` → creates a Docker image
5. The image is deployed to Google Cloud Run (serverless containers)
6. Firebase routes traffic from the custom domain to the Cloud Run container
7. New deploys are gradual (traffic shifts without downtime)

**Both apps build from the same repo.** Each backend (`fitterverse-app` and `fitterverse-crm`) has a `rootDir` configured in Firebase that tells it which subdirectory to build from.

---

### `apphosting.yaml` — The Deployment Config

**Consumer app** (`product/apphosting.yaml`):
```yaml
runConfig:
  runtime: nodejs20       # Node.js 20 LTS
  concurrency: 100        # Handle 100 simultaneous requests per instance
  cpu: 1                  # 1 CPU core
  memoryMiB: 512          # 512 MB RAM

env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: NEXT_PUBLIC_FIREBASE_API_KEY
    availability: [BUILD, RUNTIME]  # BUILD needed because variable is embedded in browser bundle
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    secret: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    secret: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    secret: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    secret: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    secret: NEXT_PUBLIC_FIREBASE_APP_ID
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_SUPABASE_URL
    secret: NEXT_PUBLIC_SUPABASE_URL
    availability: [BUILD, RUNTIME]  # BUILD because used in client-side code
  - variable: SUPABASE_SERVICE_ROLE_KEY
    secret: SUPABASE_SERVICE_ROLE_KEY
    availability: [RUNTIME]         # RUNTIME only — server-side only, never in browser
  - variable: SESSION_SECRET
    secret: SESSION_SECRET
    availability: [RUNTIME]         # RUNTIME only — used to sign cookies
```

**CRM app** (`crm/apphosting.yaml`):
```yaml
runConfig:
  runtime: nodejs20
  concurrency: 80
  cpu: 1
  memoryMiB: 512

env:
  - variable: NEXT_PUBLIC_SUPABASE_URL
    secret: NEXT_PUBLIC_SUPABASE_URL
    availability: [BUILD, RUNTIME]
  - variable: SUPABASE_SERVICE_ROLE_KEY
    secret: SUPABASE_SERVICE_ROLE_KEY
    availability: [RUNTIME]
  - variable: CRM_SESSION_SECRET
    secret: CRM_SESSION_SECRET
    availability: [RUNTIME]
```

**Rule:** Any variable starting with `NEXT_PUBLIC_` is embedded into the browser JavaScript bundle at BUILD time. If its `availability` doesn't include `BUILD`, the variable will be `undefined` in production even if it's set at runtime. This caused a real deployment failure once — now all `NEXT_PUBLIC_*` vars have `[BUILD, RUNTIME]`.

---

### Secrets Management

All sensitive values are stored in **Google Cloud Secret Manager** (accessed via Firebase Console or `firebase apphosting:secrets:grantaccess`).

**How secrets work:**
1. Secret is created once: `firebase apphosting:secrets:set SECRET_NAME`
2. The `apphosting.yaml` references the secret by name
3. At build/runtime, Firebase injects the secret as an environment variable
4. The secret value is never committed to git or visible in logs

**Why this matters:** If someone reads the git repo (even private repos can be compromised), they don't get any sensitive keys. All they see is secret names, not values.

---

### Deployment URLs

| App | Firebase Backend ID | Hosted URL (auto) | Custom Domain |
|---|---|---|---|
| Consumer | `fitterverse-app` | https://fitterverse-app--fitterverse.us-central1.hosted.app | https://fitterverse.in |
| CRM | `fitterverse-crm` | https://fitterverse-crm--fitterverse.us-central1.hosted.app | https://crm.fitterverse.in |

Both custom domains are verified in Firebase Console and have auto-provisioned SSL certificates.

---

## 11. Environment Variables & Secrets

### Consumer App Variables

| Variable | Browser or Server? | What it is | Secret Manager name |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser | Firebase project API key (safe to expose) | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Browser | Firebase Auth domain (`fitterverse.firebaseapp.com`) | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser | Firebase project ID (`fitterverse`) | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser | Firebase Storage bucket | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser | Firebase project number | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser | Firebase App identifier | `NEXT_PUBLIC_FIREBASE_APP_ID` |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Supabase project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Full DB access key — **never expose** | `SUPABASE_SERVICE_ROLE_KEY` |
| `SESSION_SECRET` | Server only | 32-char random string for signing JWTs | `SESSION_SECRET` |

### CRM App Variables

| Variable | Browser or Server? | What it is | Secret Manager name |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Server (treated as public) | Supabase project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Full DB access key | `SUPABASE_SERVICE_ROLE_KEY` |
| `CRM_SESSION_SECRET` | Server only | 32-char string for CRM JWT signing (different from `SESSION_SECRET`) | `CRM_SESSION_SECRET` |

### `.env.local` Template (for local development)

Both apps need a `.env.local` file in their directory. This file is git-ignored (never committed). Copy from `.env.local.example`.

```bash
# Consumer app: product/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fitterverse.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fitterverse
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_SUPABASE_URL=https://wwzabsfwfojsizexptxe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SESSION_SECRET=<any-32-char-random-string>

# CRM: crm/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://wwzabsfwfojsizexptxe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRM_SESSION_SECRET=<different-32-char-random-string>
```

---

## 12. Running Locally

### Prerequisites
- Node.js 20 or higher: `node --version` should say `v20.x.x` or higher
- pnpm: `npm install -g pnpm`
- Git
- Access to the Supabase project (or your own Supabase project with the schema applied)

---

### Running the Consumer App

```bash
# 1. Clone the repo
git clone https://github.com/fitterverse/Fitterverse.git
cd Fitterverse/product

# 2. Install dependencies (reads package.json, creates node_modules/)
pnpm install

# 3. Set up database (one time only)
# Go to: https://supabase.com/dashboard → your project → SQL Editor
# Paste the contents of product/supabase/schema.sql and run it

# 4. Create local secrets file
cp .env.local.example .env.local
# Fill in all the values in .env.local

# 5. Start development server (hot reload, shows changes instantly)
pnpm dev
# App runs at http://localhost:3000
```

### Running the CRM

```bash
cd Fitterverse/crm

pnpm install

# Set up CRM database (one time only)
# Go to Supabase SQL Editor
# Paste contents of crm/supabase/crm_migration.sql and run it
# This creates crm_users table AND seeds the admin account

# Create local secrets file
# Create crm/.env.local with:
#   NEXT_PUBLIC_SUPABASE_URL=https://wwzabsfwfojsizexptxe.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   CRM_SESSION_SECRET=anyrandom32chars

pnpm dev
# CRM runs at http://localhost:3001 (note port 3001 — avoids clash with consumer app)

# Default login: fitterverse.in@gmail.com / Fitterverse@123
```

### Running Both Simultaneously

Open two terminal windows. Run `pnpm dev` in `product/` and `pnpm dev` in `crm/`. They run on ports 3000 and 3001 respectively and both connect to the same Supabase database.

---

## 13. Key Design Decisions

### Why Firebase Auth for consumers but custom auth for CRM?

Consumer users sign up themselves — they need Google sign-in (reduces friction), password resets via email, and a battle-tested identity system. Firebase handles all of this.

CRM users are created manually by the admin — there are maybe 5–10 team members. A simple username/password in a database table is all that's needed. Using Firebase for CRM would mean mixing consumer and internal users in the same auth system — messy and unnecessary.

Keeping them separate means a compromised CRM password cannot be used to access consumer data through Firebase, and vice versa.

---

### Why two separate Next.js apps instead of one?

Complete isolation. The CRM has different styling, different dependencies, different build configuration, different secrets. If the consumer app has a bug that causes a deploy failure, the CRM still works and vice versa. Different teams can work on each independently.

Also practical: consumer app is mobile-first (max-width 448px, bottom navigation). CRM is desktop-first (full-width table layouts, sidebar navigation). These are fundamentally different UI architectures.

---

### Why Supabase instead of a different database?

PostgreSQL is the gold standard for relational data. Supabase adds:
- A web dashboard to view/edit data directly
- Auto-generated REST API (useful for quick data exploration)
- Easy JavaScript integration
- Free tier that's generous for early-stage

We use the **service role key** (bypasses Row Level Security) for all server-side operations — safe because the key never reaches the browser and all access is controlled by the server code.

---

### Why store `points` in `meal_logs` instead of computing at query time?

If we stored only `rating` and computed points dynamically (`SELECT CASE WHEN rating='healthy' THEN 3 ...`), every aggregation query would be slower. Storing `points: 3` directly means `SUM(points)` is a simple arithmetic operation on integers — instant even with millions of rows.

The tradeoff: if we ever change the points system (e.g., healthy becomes 4 pts), we'd need to backfill historical data. This is acceptable — the points system was designed upfront and is unlikely to change.

---

### Why a grace period for streaks?

Real life happens — travel, a wedding, illness, a bad day. Breaking a streak on the first bad day would be demoralising and defeat the purpose of building a habit. Research into habit formation shows that occasional missed days don't break habits — what breaks habits is giving up entirely.

The 3-day grace (break only after 3 consecutive bad days) means users stay engaged through slip-ups. This is core to the product philosophy: Fitterverse is about sustainable habits, not perfection.

---

### Why are meal dates stored as `YYYY-MM-DD` strings, not timestamps?

Timestamps have timezone complexity — if a user logs dinner at 11pm IST, that's 5:30pm UTC. Comparing timestamps across timezones is error-prone. A date string `"2026-05-04"` is the user's local date as they experience it — no timezone math needed. All date comparisons use simple string equality: `.eq('date', '2026-05-04')`.

---

### Why server actions instead of API routes for data mutations?

Server actions (functions marked `'use server'`) can be called directly from React components without writing an HTTP fetch call. They run on the server, have access to environment variables, and Next.js handles the serialisation automatically.

Traditional API routes (`route.ts`) are used only when you need a clean HTTP interface — specifically for the auth endpoints (login/logout) because those are called from client-side code using `fetch()`, not React component invocations.

---

## 14. Known Gotchas & Critical Notes

### DO NOT delete `pnpm-workspace.yaml` from `product/` or `crm/`

**Why this matters:** During Cloud Build, Firebase runs `pnpm install` in the app's subdirectory. Without a `pnpm-workspace.yaml` in that directory, pnpm looks upward for a root workspace file. If it finds one at the repo root, it treats the entire repo as a monorepo and installs all dependencies from root — causing path confusion.

**The root-level `pnpm-workspace.yaml` was intentionally deleted** on May 4, 2026. Each sub-app has its own `pnpm-workspace.yaml` which correctly scopes pnpm to that directory.

If you ever see a build error like `"Found lockfile missing swc dependencies"` or `"Module not found in /workspace/node_modules"`, this is the first thing to check.

---

### `crm/next.config.ts` MUST have `turbopack.root` and `outputFileTracingRoot`

```ts
turbopack: { root: path.resolve(__dirname) },
outputFileTracingRoot: path.resolve(__dirname),
```

**Why:** Without these, Turbopack traverses from the Firebase Cloud Build's container root (`/workspace/`) rather than the CRM directory. It finds the consumer app's `src/proxy.ts` (which imports `jose`) but can't resolve `jose` because it's only in `product/node_modules/`, not `crm/node_modules/`. The build fails with: `"./src/proxy.ts — Module not found: Can't resolve 'jose'"`.

This happened in production and took significant debugging to diagnose. Do not remove these lines.

---

### `NEXT_PUBLIC_*` variables MUST have `availability: [BUILD, RUNTIME]`

Any variable used in client-side (browser) code is **embedded into the JavaScript bundle at build time**. If the variable is only available at runtime, it will be `undefined` in the bundle. You'll see bugs where Firebase fails to initialise or Supabase returns "Invalid URL".

Rule: if the variable name starts with `NEXT_PUBLIC_`, always put `[BUILD, RUNTIME]` in `apphosting.yaml`.

---

### `SUPABASE_SERVICE_ROLE_KEY` must never reach the browser

This key has full read/write access to every table, bypassing all security rules. If it ever ends up in client-side code (imported in a component without `'use server'`), anyone could extract it from the browser's network tab and have full database access.

Always import `createClient()` from `@/lib/supabase/server` (server-side), never from `@/lib/supabase/client` (browser-side), when using the service role key.

---

### Firebase UIDs are text strings, not UUIDs

Consumer users are identified by Firebase UIDs — strings like `"Ua3mK9j2pNxY..."` (28 characters, alphanumeric). These are the primary key of `profiles` and `user_id` in every other consumer table.

Supabase's auto-generated IDs are UUIDs (formatted like `"550e8400-e29b-41d4-a716-446655440000"`). CRM user `id` columns use UUID. Don't mix them up.

---

### CRM is `noindex, nofollow`

The CRM's `layout.tsx` sets `robots: 'noindex, nofollow'` in the metadata. This tells search engines not to index the CRM. If this is ever removed, the CRM login page could appear in Google search results.

---

### `proxy.ts` is not currently running as middleware

The file `product/src/proxy.ts` contains middleware-style logic but is named `proxy.ts` instead of `middleware.ts`. Next.js only auto-runs files named exactly `middleware.ts` (at the src/ root). So this file is not executing on requests.

Route protection in the consumer app is done at the server component level — each section's `layout.tsx` calls `getSession()` and `redirect('/login')` if no session is found. This is equally effective.

The file was renamed to `proxy.ts` to prevent the CRM's Turbopack from accidentally picking it up during builds. It can be activated as real middleware in the future by renaming to `middleware.ts` and changing its export to `default`.

---

### Stable git snapshot: `fitterverse_v1_04-05-2026`

Tag `fitterverse_v1_04-05-2026` is a verified restore point committed May 4, 2026. Both apps (consumer + CRM) are fully working at this tag. If a future change breaks things badly, you can roll back:

```bash
git checkout fitterverse_v1_04-05-2026
```

---

## 15. Git Workflow & Deployment Process

### Branch Structure

Currently using a single branch: `main`. Everything is committed directly to `main`.

**Auto-deploy trigger:** Both Firebase backends watch the `main` branch. Any push to `main` triggers a build for both apps simultaneously.

---

### How to Deploy a Change

```bash
# 1. Make changes locally (test with pnpm dev first)

# 2. Check what's changed
git status
git diff

# 3. Stage the changed files
git add <specific-files>   # Prefer specific files over git add .

# 4. Commit with a clear message
git commit -m "Fix: description of what changed and why"

# 5. Push to main — this triggers auto-deploy
git push origin main

# 6. Watch the build at:
# Firebase Console → App Hosting → fitterverse-app (or fitterverse-crm)
# Build takes ~3-5 minutes
```

---

### How to Create a Stable Snapshot (git tag)

Done after any major milestone. Use this to create safe restore points:

```bash
git tag fitterverse_v2_DD-MM-YYYY
git push origin fitterverse_v2_DD-MM-YYYY
```

---

### Adding a New Team Member to the CRM

1. Log in to `crm.fitterverse.in` as admin (fitterverse.in@gmail.com / Fitterverse@123)
2. Go to Team → "Add team member"
3. Fill in: Full name, email, role, temporary password (min 8 chars)
4. Share the temporary password with the team member directly (WhatsApp/email)

No code change needed. The team member can log in immediately.

---

### Deactivating a CRM Team Member

1. Log in as admin
2. Go to Team → find the team member → click "Deactivate"
3. Their account is immediately blocked. They cannot log in.
4. Their account is not deleted — it can be reactivated at any time.

---

## 16. Full Dependency Reference

### Consumer App (`product/package.json`)

| Package | Version | What it does |
|---|---|---|
| `next` | 16.x | The main framework |
| `react` + `react-dom` | 19.x | React — the UI library |
| `typescript` | 5.x | Type checking |
| `tailwindcss` | 4.x | CSS utility classes |
| `@tailwindcss/postcss` | 4.x | Makes Tailwind work with PostCSS build pipeline |
| `firebase` | 12.x | Firebase Auth SDK (email + Google sign-in) |
| `@supabase/supabase-js` | 2.x | Supabase database client |
| `@supabase/ssr` | 0.x | Supabase helpers for server-side rendering |
| `jose` | 6.x | JWT creation and verification (session cookies) |
| `sonner` | 2.x | Toast notification UI |
| `framer-motion` | 12.x | Animation library (onboarding step transitions) |
| `recharts` | 3.x | Chart library (progress page bar charts) |
| `date-fns` | 4.x | Date formatting and manipulation |
| `lucide-react` | 1.x | SVG icon library |
| `shadcn` | 4.x | CLI for adding/updating shadcn/ui components |
| `class-variance-authority` | 0.x | `cva()` — builds conditional className strings (used by shadcn) |
| `clsx` | 2.x | Merges className strings (used by shadcn + `cn()` util) |
| `tailwind-merge` | 3.x | Merges Tailwind classes without conflicts |
| `tw-animate-css` | 1.x | Pre-built CSS animation classes via Tailwind |
| `next-themes` | 0.x | Theme management (installed but dark theme is hardcoded via CSS) |
| `@base-ui/react` | 1.x | Headless UI primitives (installed as shadcn dependency) |
| `react-hook-form` | 7.x | Form state management and validation (available but most forms use plain useState) |
| `@hookform/resolvers` | 5.x | Connects react-hook-form with schema validators |
| `zod` | 4.x | Schema-based runtime type validation |

---

### CRM App (`crm/package.json`)

| Package | Version | What it does |
|---|---|---|
| `next` | 16.x | The main framework |
| `react` + `react-dom` | 19.x | React |
| `typescript` | 5.x | Type checking |
| `tailwindcss` | 4.x | CSS utility classes |
| `@tailwindcss/postcss` | 4.x | Tailwind + PostCSS |
| `@supabase/supabase-js` | 2.x | Supabase database client |
| `jose` | 6.x | JWT for session cookies |
| `sonner` | 2.x | Toast notifications |
| `date-fns` | 4.x | Date formatting |
| `lucide-react` | 1.x | Icons |
| `clsx` | 2.x | Class merging |
| `tailwind-merge` | 3.x | Tailwind class conflict resolution |

The CRM has a significantly smaller dependency footprint — no Firebase, no Framer Motion, no Recharts, no shadcn/ui. This keeps the CRM bundle small and the build fast.

---

## 17. Complete SQL Schemas

### Consumer App Schema (`product/supabase/schema.sql`)

Run this once in the Supabase SQL Editor to create all 5 consumer tables.

```sql
-- ============================================================
-- Fitterverse Diet Tracker — Supabase Schema
-- Auth: Firebase (user_id = Firebase UID, stored as text)
-- All DB ops use service role key (server-side only)
-- ============================================================

create table if not exists public.profiles (
  id text primary key,               -- Firebase UID
  email text,
  full_name text,
  age integer,
  weight_kg decimal(5,2),
  height_cm decimal(5,1),
  goal_weight_kg decimal(5,2),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  practices_fasting boolean default false,
  meals_per_day integer default 3,
  breakfast_time text,
  lunch_time text,
  dinner_time text,
  calorie_limit_per_meal integer default 650,
  dietary_restrictions text,
  diet_goal text,
  biggest_challenge text,
  motivation text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,             -- Firebase UID
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  rating text check (rating in ('healthy', 'medium', 'junk', 'skipped')),
  calories integer,
  note text,
  points integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date, meal_type)
);

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  total_points integer default 0,
  meals_logged integer default 0,
  is_streak_day boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists public.user_streaks (
  user_id text primary key,          -- Firebase UID
  current_streak integer default 0,
  longest_streak integer default 0,
  consecutive_bad_days integer default 0,
  last_updated date,
  streak_start_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,             -- Firebase UID
  badge_slug text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_slug)
);

-- Enable Row Level Security (service role bypasses this, but it's good practice)
alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;
alter table public.daily_scores enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_badges enable row level security;

-- Performance indexes
create index if not exists meal_logs_user_date on public.meal_logs(user_id, date);
create index if not exists daily_scores_user_date on public.daily_scores(user_id, date);
create index if not exists user_badges_user on public.user_badges(user_id);
```

---

### CRM Schema (`crm/supabase/crm_migration.sql`)

Run this once in the Supabase SQL Editor to create the CRM users table and seed the admin account.

```sql
-- ============================================================
-- Fitterverse CRM — Supabase Migration
-- ============================================================

create table if not exists public.crm_users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text not null,
  role          text not null default 'nutritionist'
                  check (role in ('admin', 'master_coach', 'nutritionist', 'trainer', 'sales')),
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index for fast login lookup
create index if not exists crm_users_email_idx on public.crm_users (email);

-- Seed: fitterverse.in@gmail.com / Fitterverse@123
-- Password hash generated with Node.js scrypt (format: salt:hash)
insert into public.crm_users (email, password_hash, full_name, role)
values (
  'fitterverse.in@gmail.com',
  'd6da09f50159c38b9f01685a3aedd12b:8b064478baed60c50e777e4ade3b9a6679dc93df040f3d24879b4433f0a6e403f41d7616393fd74803561dcabb3eeb3ff1f12dc69e6ec73f7c45c438f216236e',
  'Fitterverse Admin',
  'admin'
)
on conflict (email) do nothing;
```

---

*Last updated: May 4, 2026 — Consumer app + CRM v1 live. Custom domains configured (fitterverse.in + crm.fitterverse.in). Git tag: `fitterverse_v1_04-05-2026`.*
