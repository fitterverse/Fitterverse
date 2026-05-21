# Fitterverse Architecture Guide

Last verified against the repository on `2026-05-21`.

This document is the current source of truth for how the Fitterverse repo is structured, how the two live apps behave, where data lives, how the UI is meant to work, and which constraints matter when changing the system.

It intentionally focuses on real implementation details from the codebase, not a generic product description.

## Table of Contents

1. [What Fitterverse Is](#1-what-fitterverse-is)
2. [Repo Snapshot](#2-repo-snapshot)
3. [System Topology](#3-system-topology)
4. [Next.js 16 Conventions Used Here](#4-nextjs-16-conventions-used-here)
5. [Consumer App (`product/`) Deep Dive](#5-consumer-app-product-deep-dive)
6. [Question Capture and Logging Model](#6-question-capture-and-logging-model)
7. [Scoring, Streaks, Badges, and Energy Math](#7-scoring-streaks-badges-and-energy-math)
8. [Notifications Architecture](#8-notifications-architecture)
9. [Website, Blog, SEO, and Content Pipeline](#9-website-blog-seo-and-content-pipeline)
10. [UI/UX System and Product Intent](#10-uiux-system-and-product-intent)
11. [CRM App (`crm/`) Deep Dive](#11-crm-app-crm-deep-dive)
12. [Data Model and Table Catalog](#12-data-model-and-table-catalog)
13. [Deployment, Hosting, and Runtime Ops](#13-deployment-hosting-and-runtime-ops)
14. [Local Development](#14-local-development)
15. [Known Gotchas](#15-known-gotchas)
16. [Open Gaps and Future Architecture Ideas](#16-open-gaps-and-future-architecture-ideas)

## 1. What Fitterverse Is

Fitterverse is not built like a calorie-tracking app that happens to have a streak counter attached.

The current product architecture is built around five ideas:

- Daily compliance should be fast enough that a user can finish it on a tired day.
- "Good enough today" matters more than perfect logging.
- The core unit is a repeatable day, not a long-term macro spreadsheet.
- Streak protection and visible momentum are first-class UX elements.
- Coach or CRM visibility is part of the system, not a bolt-on reporting layer.

That is why the product centers on:

- A short onboarding flow that captures routine, goal, and friction points.
- Three daily meal check-ins with lightweight rating-based scoring.
- Optional calorie capture for users who want an energy view.
- Workout logging with calories burned estimated from weight, workout type, duration, and intensity.
- A forgiving streak engine that tolerates some bad days before a reset.
- Published weekly plans authored in the CRM and consumed inside the product.
- Push notifications designed as accountability nudges rather than generic marketing blasts.

## 2. Repo Snapshot

The repo root is a workspace container, not an app.

Top-level layout:

```text
Fitterverse/
  AGENTS.md
  ARCHITECTURE.md
  README.md
  business/          business and operating docs
  crm/               internal CRM app for team operations
  product/           consumer app for fitterverse.in
```

Current high-level truth:

- `product/` is the consumer app.
- `crm/` is the internal team app.
- Both are separate Next.js 16 App Router apps.
- Both deploy independently with their own Firebase hosting config.
- Both use Supabase with the service role key on the server.
- The consumer app uses Firebase Auth plus a local signed session cookie.
- The CRM uses its own credential table plus a local signed session cookie.

## 3. System Topology

### 3.1 Runtime surfaces

There are two independently deployed web apps:

| Surface | Directory | Audience | Purpose |
| --- | --- | --- | --- |
| Consumer app | `product/` | End users | Daily logging, streaks, plans, notifications, website, blog |
| CRM app | `crm/` | Internal team | User management, plan authoring, team admin |

### 3.2 Shared infrastructure

Both apps rely on the same broad set of backend services:

- Supabase for relational storage.
- Firebase project resources for the consumer auth and web push stack.
- Firebase Hosting / App Hosting for deployment.
- GitHub Actions for scheduled notification triggers.

### 3.3 Data ownership model

The repo does **not** use browser-side direct Supabase access for core writes.

Instead:

- The browser talks to Next.js pages, server actions, and route handlers.
- Server-side code creates a Supabase client with the service role key.
- Database writes happen from server-side code only.
- RLS is enabled on tables as a safety net, but the service role bypasses it.

This means the practical trust boundary is:

- Browser -> app server: untrusted input
- App server -> Supabase: trusted internal write path

### 3.4 Identity model split

Consumer app:

- Identity source: Firebase Auth
- Session source: signed `__fv_session` JWT cookie
- App user primary key: Firebase UID stored as `text`

CRM app:

- Identity source: `crm_users` table in Supabase
- Session source: signed `__crm_session` JWT cookie
- CRM user primary key: UUID from `crm_users.id`

This split is deliberate:

- Consumer auth needs low-friction sign-in and consumer identity providers.
- CRM access needs team-controlled credentials and internal roles.

## 4. Next.js 16 Conventions Used Here

This repo is on Next.js `16.2.4`, and some naming matters.

### 4.1 App Router everywhere

Both apps use the App Router.

That means:

- Routes live under `src/app/`.
- Layouts are nested by directory.
- Route groups like `(app)`, `(public)`, and `(website)` organize code without affecting URLs.
- Server Components are the default.
- Client Components are explicit with `"use client"`.

### 4.2 `proxy.ts`, not `middleware.ts`

The consumer app uses `product/src/proxy.ts`.

Important:

- In this codebase, request gating is implemented in `proxy.ts`.
- The architecture doc must refer to this as `Proxy`, not the older `middleware` naming.
- `proxy.ts` runs before protected requests complete and handles auth redirects.

### 4.3 Metadata routes are first-class files

The consumer app uses App Router metadata files:

- `src/app/manifest.ts`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/(website)/blog/[slug]/opengraph-image.tsx`
- `src/app/(website)/blog/opengraph-image.tsx`

This is the correct Next 16 pattern. The manifest is not a static JSON file in `public/`.

### 4.4 Server actions are a major write path

Most consumer mutations happen via server actions:

- onboarding save
- meal save
- workout save
- notification preference save

CRM plan publishing and updates also use server actions.

### 4.5 Route handlers are used selectively

Route handlers are used where HTTP semantics matter:

- session creation / deletion
- notification token registration
- scheduled notification sending
- CRM login / logout
- food search
- team admin API

### 4.6 Build and bundling

Both apps currently build with:

```bash
next build --webpack
```

Each app also sets `turbopack.root` in `next.config.ts` for dev/runtime correctness.

## 5. Consumer App (`product/`) Deep Dive

### 5.1 Product directory layout

Important directories:

```text
product/
  apphosting.yaml
  firebase.json
  next.config.ts
  public/
    firebase-messaging-sw.js
  src/
    app/
    components/
    content/blog/
    features/
    lib/firebase/
    proxy.ts
    server/
    shared/
  supabase/
    schema.sql
    migrations/
  diet-tracker/   scaffold only, not integrated into the live app
```

### 5.2 Consumer route map

Public marketing / website routes:

| Route | Purpose |
| --- | --- |
| `/` | Marketing homepage |
| `/blog` | Blog index |
| `/blog/[slug]` | Static article page |
| `/privacy-policy` | Legal |
| `/terms` | Legal |

Public auth routes:

| Route | Purpose |
| --- | --- |
| `/login` | Consumer login |
| `/signup` | Consumer signup |
| `/onboarding` | Profile and habit setup |

Protected product routes:

| Route | Purpose |
| --- | --- |
| `/dashboard` | Daily overview |
| `/diet` | Meal logging plus meal plan |
| `/workout` | Workout logging plus workout plan |
| `/progress` | History, charts, consistency calendar, badges |
| `/settings` | Account and app settings |
| `/settings/notifications` | Push preferences |

Compatibility / redirect routes:

| Route | Behavior |
| --- | --- |
| `/history` | Redirects to `/progress` |
| `/badges` | Redirects to `/progress` |

API routes:

| Route | Purpose |
| --- | --- |
| `/api/auth/session` | Creates and deletes signed server session cookie |
| `/api/notifications/subscribe` | Registers / unregisters FCM token |
| `/api/notifications/send` | Protected cron endpoint for scheduled push sends |

### 5.3 Shell layers

The consumer app has three main route-group shells.

#### Root layout: `src/app/layout.tsx`

Responsibilities:

- Defines global metadata.
- Defines viewport.
- Injects Google Tag Manager.
- Adds the global Sonner toaster.
- Applies global dark styling and shared layout classes.

#### Website layout: `src/app/(website)/layout.tsx`

Responsibilities:

- Renders `SiteHeader`.
- Renders website content.
- Renders `SiteFooter`.

Important note:

- The website layout no longer clips overflow the way it used to.
- This change matters because the blog article sidebar uses desktop sticky positioning.

#### App layout: `src/app/(app)/layout.tsx`

Responsibilities:

- Verifies session.
- Checks `profiles.onboarding_completed`.
- Redirects users who are not onboarded to `/onboarding`.
- Renders the mobile-first application shell.
- Renders the fixed bottom nav.
- Renders the notification permission banner above the nav.

### 5.4 Auth and request gating

#### Consumer auth stack

There are three layers:

1. Firebase client auth authenticates the person.
2. `/api/auth/session` creates or deletes the signed app cookie.
3. `product/src/proxy.ts` gates protected routes based on the cookie.

#### Firebase client setup

`product/src/features/auth/client/firebase.ts` initializes:

- Firebase app
- Firebase Auth
- Google provider

The Firebase config is built from `NEXT_PUBLIC_FIREBASE_*` environment variables.

#### Session cookie

The app server creates a signed JWT cookie:

- cookie name: `__fv_session`
- library: `jose`
- expiry: 14 days
- payload: `uid`, `email`

This is intentionally lightweight:

- no Firebase Admin token verification on every request
- no extra network hop for routine auth checks
- simple cookie validation inside app server code

#### Session bootstrap flow

Login flow:

1. User authenticates with Firebase on the client.
2. Client calls `POST /api/auth/session` with `uid` and `email`.
3. Server ensures a `profiles` row exists.
4. Server ensures a `user_streaks` row exists for new users.
5. Server creates `__fv_session`.
6. Response includes `onboardingCompleted`.
7. Client routes to `/dashboard` or `/onboarding`.

#### Proxy behavior

`product/src/proxy.ts` is the first request-level guard.

It:

- allows the website and legal pages to remain public
- allows auth pages to remain public
- allows `/api/auth/session`
- allows `/api/notifications/send` so the cron job can call it
- redirects anonymous users away from product routes to `/login`
- redirects logged-in users from `/` and auth pages to `/dashboard`

Important nuance:

- onboarding completion is **not** checked in `proxy.ts`
- onboarding is checked in the `(app)` layout instead
- this avoids a Supabase read on every single request, since the app layout already needs server context

### 5.5 Daily product surfaces

#### `/dashboard`

This is the daily control room.

It combines:

- greeting and current date
- score ring out of 9
- streak summary
- grace-day indicator
- meal completion dots
- energy balance card
- today's meal cards
- today's workout card

Server reads:

- `getTodayData()`
- profile data from `profiles`
- today's workouts
- today's consumed calories

Derived values on the page:

- BMR
- TDEE
- energy target after workout burn
- energy balance
- score label and color state
- grace period remaining

#### `/diet`

This is the dedicated meal logging and meal plan surface.

It combines:

- daily score summary
- today's published meal plan snippet, if current-week data exists
- three meal cards
- link to `/progress`
- full weekly meal plan in an expandable section

Important nuance:

- the app fetches the latest published meal plan
- the page only shows "today's items" if that plan belongs to the current ISO-style Monday-start week
- the full weekly plan is still viewable if a plan exists

#### `/workout`

This is the dedicated workout logging and workout plan surface.

It combines:

- workout header and burn summary
- today's published workout plan day, if current-week data exists
- workout logger
- list of workouts logged today
- energy snapshot
- link to `/progress`
- full weekly workout plan in an expandable section

#### `/progress`

This page now owns:

- score trend chart
- day distribution chart
- monthly consistency heatmap
- badge progress
- streak badge progression

Legacy routes `/history` and `/badges` redirect here so progress and recognition live in a single surface.

#### `/settings`

This page is intentionally thin.

It provides:

- account summary
- notification settings link
- legal links
- sign out action

The architecture decision here is intentional:

- settings are not a full profile editor yet
- the app optimizes for routine compliance first, configuration second

### 5.6 End-to-end consumer journeys

#### Journey A: new user signup to first usable dashboard

1. User lands on website or signup page.
2. User creates account with Firebase Auth or signs in with Google.
3. Client calls `POST /api/auth/session`.
4. Server ensures `profiles` and `user_streaks` rows exist.
5. Server returns whether onboarding is complete.
6. User is sent to `/onboarding` if needed.
7. Onboarding writes a flattened routine profile into `profiles`.
8. `(app)` layout now allows access to the authenticated shell.
9. Dashboard reads today's score state, streak state, workouts, and profile math inputs.

#### Journey B: user logs meals through the day

1. User opens `/dashboard` or `/diet`.
2. UI renders three meal cards for the current date.
3. User logs breakfast with a rating and optional calories/note.
4. `saveMeal()` upserts the meal row.
5. `daily_scores` is recomputed for that date.
6. If the date is today, `user_streaks` is also recomputed.
7. Any new badges for the streak/day are inserted.
8. Relevant routes are revalidated.
9. Dashboard and diet views now show the updated score and streak state.

#### Journey C: user logs a workout

1. User opens `/workout`.
2. Page preloads weight and today's workouts.
3. User chooses workout type, intensity, and duration.
4. Client shows estimated calories before save.
5. `saveWorkout()` inserts a workout row with calories burned.
6. `/workout` and `/dashboard` are revalidated.
7. Energy cards update to reflect the extra burn.

#### Journey D: user enables push notifications

1. Notification banner appears if browser permission is still `default`.
2. User accepts.
3. Browser permission is requested.
4. FCM token is created and cached in local storage.
5. Token is POSTed to `/api/notifications/subscribe`.
6. Server upserts the token into `notification_tokens`.
7. Preference save auto-enables the master notification setting.

#### Journey E: blog visitor converts into a product user

1. Visitor lands on `/blog` or a specific article.
2. Article is statically rendered from local markdown with metadata and JSON-LD.
3. Reading progress and TOC increase long-form usability.
4. CTA card or nav sends the visitor to `/signup`.
5. From that point the user enters the normal consumer auth and onboarding flow.

### 5.7 Consumer feature-to-file map

This is the most useful "where do I change it?" map for the consumer app.

#### Auth and gating

- `product/src/features/auth/client/firebase.ts`
- `product/src/features/auth/server/session.ts`
- `product/src/server/session.ts`
- `product/src/app/api/auth/session/route.ts`
- `product/src/proxy.ts`

#### Onboarding and profile capture

- `product/src/app/(public)/onboarding/page.tsx`
- `product/src/features/onboarding/server/actions.ts`
- `product/src/features/profile/server/queries.ts`

#### Meal logging and streak updates

- `product/src/features/meals/components/meal-card.tsx`
- `product/src/features/meals/server/actions.ts`
- `product/src/features/streaks/lib/streak.ts`
- `product/src/features/dashboard/server/queries.ts`

#### Workout logging and calorie math

- `product/src/features/workouts/components/workout-logger.tsx`
- `product/src/features/workouts/components/workout-list.tsx`
- `product/src/features/workouts/components/today-workout-card.tsx`
- `product/src/features/workouts/server/actions.ts`
- `product/src/features/workouts/server/queries.ts`
- `product/src/features/workouts/lib/calorie-math.ts`

#### Plans consumption

- `product/src/features/plans/server/queries.ts`
- `product/src/features/plans/components/today-plan-snippet.tsx`
- `product/src/features/plans/components/today-workout-snippet.tsx`
- `product/src/features/plans/components/meal-plan-view.tsx`
- `product/src/features/plans/components/workout-plan-view.tsx`

#### Progress and badges

- `product/src/app/(app)/progress/page.tsx`
- `product/src/features/history/server/queries.ts`
- `product/src/features/progress/components/progress-charts.tsx`
- `product/src/features/badges/server/queries.ts`
- `product/src/features/badges/components/badge-card.tsx`

#### Notifications

- `product/src/features/notifications/components/permission-banner.tsx`
- `product/src/features/notifications/components/notification-settings-form.tsx`
- `product/src/features/notifications/hooks/use-notification-permission.ts`
- `product/src/features/notifications/lib/fcm-client.ts`
- `product/src/features/notifications/lib/constants.ts`
- `product/src/features/notifications/server/actions.ts`
- `product/src/features/notifications/server/queries.ts`
- `product/src/app/api/notifications/subscribe/route.ts`
- `product/src/app/api/notifications/send/route.ts`
- `product/public/firebase-messaging-sw.js`
- `.github/workflows/notify.yml`

#### Website, blog, and SEO

- `product/src/app/(website)/page.tsx`
- `product/src/app/(website)/blog/page.tsx`
- `product/src/app/(website)/blog/[slug]/page.tsx`
- `product/src/features/website/lib/blog.ts`
- `product/src/features/website/lib/blog-headings.ts`
- `product/src/features/website/components/blog-markdown.tsx`
- `product/src/features/website/components/blog-reading-progress.tsx`
- `product/src/features/website/components/blog-table-of-contents.tsx`
- `product/src/features/seo/lib/metadata.ts`
- `product/src/features/seo/lib/schema.ts`
- `product/src/features/seo/components/json-ld.tsx`
- `product/src/content/blog/*.md`

## 6. Question Capture and Logging Model

This repo has two different meanings of "logging":

- question capture during onboarding
- daily compliance logging for meals and workouts

Both matter and both should be understood as architecture, not just UI.

### 6.1 Onboarding question capture

The onboarding flow is a 10-step client page backed by a single server action.

UI file:

- `product/src/app/(public)/onboarding/page.tsx`

Write path:

- `product/src/features/onboarding/server/actions.ts`

Persistence model:

- flattened directly onto `profiles`
- no separate `onboarding_responses` table
- no question versioning
- no per-question event history

That means the onboarding data model is optimized for immediate product use, not for analytics-grade survey replay.

### 6.2 Onboarding questions and how they map to the system

| Step | Prompt / concept | Stored fields | Why the product asks it |
| --- | --- | --- | --- |
| 1 | Name | `full_name` | Personalization |
| 2 | Body stats | `age`, `weight_kg`, `height_cm`, `goal_weight_kg` | BMR/TDEE and goal framing |
| 3 | Activity level | `activity_level` | TDEE multiplier |
| 4 | Goal | `diet_goal` | Product framing and future plan context |
| 5 | Meal pattern and fasting | `meals_per_day`, `practices_fasting` | Interprets routine and skipped-meal context |
| 6 | Meal timing | `breakfast_time`, `lunch_time`, `dinner_time` | Schedule understanding and future reminder logic |
| 7 | Calorie limit | `calorie_limit_per_meal` | Per-meal warning threshold in the logging UI |
| 8 | Dietary restrictions | `dietary_restrictions` | Future plan compatibility and food preference context |
| 9 | Biggest challenge | `biggest_challenge` | Behavioral context for coaching and future UX personalization |
| 10 | Motivation | `motivation` | Qualitative context for accountability direction |

### 6.3 Meal logging model

Meal logging is deliberately lightweight.

Each day has exactly three primary meal slots:

- breakfast
- lunch
- dinner

Each meal log can store:

- rating
- optional calories
- optional note
- derived points

Ratings:

| Rating | Points | Meaning |
| --- | --- | --- |
| `healthy` | 3 | good meal decision |
| `medium` | 2 | okay but not ideal |
| `junk` | 1 | poor quality or overeating context |
| `skipped` | 3 | fasting-compatible skip treated as healthy |

Write behavior:

- `saveMeal()` upserts one row per `user_id + date + meal_type`
- repeated saves update the same meal entry
- `daily_scores` is recomputed immediately after the save
- if the save is for today, streak state is also updated

UI behavior:

- `MealCard` is expandable and optimized for one-handed mobile use
- users pick a rating first
- calories are optional unless the user wants energy balance visibility
- a local warning appears if a "healthy" meal exceeds the per-meal calorie limit

### 6.4 Workout logging model

Workout logging is separate from streak scoring.

Each workout log stores:

- workout type
- intensity
- duration
- notes
- derived calories burned

Supported workout types:

- running
- walking
- cycling
- swimming
- strength
- yoga
- hiit
- dance
- sports
- stretching
- other

Write behavior:

- `saveWorkout()` inserts a new row rather than upserting
- multiple workouts can exist on the same day
- calories burned are calculated at save time
- `/workout` and `/dashboard` are revalidated

### 6.5 Logging philosophy

The architecture intentionally separates:

- **behavioral compliance**: meal logging, streaks, badges
- **energy math**: calories consumed vs estimated burn

Why this matters:

- a user can succeed in the product without counting calories
- the streak system is based on meal ratings, not numeric calorie precision
- calorie capture exists as an optional visibility layer, not the main compliance engine

## 7. Scoring, Streaks, Badges, and Energy Math

### 7.1 Daily score

The score is a sum of meal points for a given date.

Current maximum:

- 3 meals x 3 points = 9 points

Derived fields stored in `daily_scores`:

- `total_points`
- `meals_logged`
- `is_streak_day`

Threshold:

- `is_streak_day = total_points >= 6`

### 7.2 Streak model

The streak engine lives in `product/src/features/streaks/lib/streak.ts`.

Constants:

- `MIN_STREAK_POINTS = 6`
- `STREAK_BREAK_DAYS = 3`

Interpretation:

- a "good day" is a day with 6 or more points
- bad days do not immediately kill the streak
- the streak breaks on the third consecutive bad day

State stored in `user_streaks`:

- `current_streak`
- `longest_streak`
- `consecutive_bad_days`
- `last_updated`
- `streak_start_date`

Important behavior:

- if a user logs some meals and is currently below 6, the day can still recover later
- the meal save path specifically re-evaluates "today was bad, but now became good"
- this avoids penalizing users who log gradually through the day

### 7.3 Badge model

Badges are awarded in `saveMeal()` after streak recomputation.

Current badge classes:

- streak milestones
- first meal
- perfect day

Examples:

- `first_meal`
- `perfect_day`
- `streak_1`
- `streak_3`
- `streak_7`
- `streak_21`
- `streak_90`
- `streak_180`
- `streak_365`

### 7.4 BMR and TDEE

The workout subsystem uses:

- BMR calculation from body stats
- TDEE derived from activity level

These numbers power:

- dashboard energy target
- workout page energy snapshot
- comparison of calories consumed vs estimated daily burn

The architecture is intentionally simple:

- the consumer app is not doing advanced adaptive calorie coaching
- it is exposing understandable math for awareness and accountability

### 7.5 Workout calorie burn

Workout calories are calculated on save using:

- workout type
- workout intensity
- duration in minutes
- body weight

The estimate is derived from activity MET-style logic in `workouts/lib/calorie-math.ts`.

## 8. Notifications Architecture

Push is not a generic engagement layer. It is an accountability subsystem.

### 8.1 Core pieces

Browser side:

- permission prompt banner
- notification settings form
- `useNotificationPermission()` hook
- FCM token client
- service worker

Server side:

- token persistence
- preference persistence
- scheduled send route
- Firebase Admin messaging
- GitHub Actions cron trigger

Database:

- `notification_preferences`
- `notification_tokens`

### 8.2 Permission and token lifecycle

The client flow is:

1. Banner or settings page requests browser permission.
2. If granted, the app obtains an FCM token.
3. The token is cached in `localStorage` under `fv_fcm_token`.
4. The token is POSTed to `/api/notifications/subscribe`.
5. Server upserts it into `notification_tokens`.

Disable flow:

1. Client removes the token from the server with `DELETE /api/notifications/subscribe`.
2. Local storage cache is cleared.
3. Firebase Messaging token is deleted from the client SDK.

### 8.3 Notification preferences model

Stored preferences include:

- master `enabled`
- intensity: `light`, `standard`, `active`
- category booleans:
  - `meal_reminders`
  - `workout_reminders`
  - `motivation_quotes`
  - `streak_alerts`
- quiet hours
- timezone

Default preference state is defined in the server query layer, not just the UI.

### 8.4 Schedule model

Current send slots:

| Slot | Time (IST) | Purpose |
| --- | --- | --- |
| `morning` | 09:00 | daily quote |
| `lunch` | 13:00 | meal reminder |
| `workout` | 18:00 | workout reminder |
| `evening` | 20:00 | streak / day close reminder |

Intensity controls which slots a user receives:

| Intensity | Slots |
| --- | --- |
| `light` | evening |
| `standard` | morning, lunch, evening |
| `active` | morning, lunch, workout, evening |

### 8.5 Send architecture

Send trigger:

- GitHub workflow `.github/workflows/notify.yml`

Execution target:

- `POST /api/notifications/send?slot=...`

Auth:

- bearer token via `CRON_SECRET`

Send path:

1. Validate cron secret.
2. Validate slot.
3. Fetch eligible notification preferences.
4. Optionally fetch streak data for the evening slot.
5. Fetch all matching FCM tokens.
6. Build multicast batches of up to 500 tokens.
7. Send with Firebase Admin messaging.
8. Prune invalid tokens.

### 8.6 Quiet hours nuance

The schema stores:

- `quiet_start`
- `quiet_end`
- `timezone`

But the current server send route does **not** calculate dynamic per-user quiet-hour suppression.

Current practical behavior:

- quiet hours exist in the settings model and UI language
- send times are already chosen to avoid night hours in IST
- the architecture is ready for per-user schedule logic later, but that logic is not implemented yet

### 8.7 Service worker nuance

`product/public/firebase-messaging-sw.js` contains hardcoded Firebase config.

This is intentional in the current codebase.

Reason:

- it avoids a race where the service worker would need runtime config via postMessage
- the current implementation favors deterministic initialization over config indirection

Tradeoff:

- config is duplicated between client Firebase init and service worker init
- updates must keep both in sync

## 9. Website, Blog, SEO, and Content Pipeline

The consumer app is both:

- a logged-in accountability product
- a public marketing and content site

### 9.1 Marketing homepage

The homepage is a custom editorial landing page rather than a generic SaaS shell.

Current traits:

- strong brand framing around accountability
- FAQ-driven SEO
- hero that positions Fitterverse as an accountability partner, not a tracker
- visual mock accountability preview
- direct path to signup and login

### 9.2 Blog content storage model

Blog posts live as local markdown files in:

- `product/src/content/blog/*.md`

Current pipeline:

1. Files are read from disk with `fs/promises`.
2. Frontmatter is parsed manually.
3. Body text is parsed by a custom markdown renderer.
4. FAQ sections are extracted by convention.
5. headings are extracted for deep-linking and TOC.
6. pages are statically generated with `generateStaticParams()`.

### 9.3 Markdown feature subset

The current blog renderer supports a curated subset:

- `##` headings
- `###` headings
- paragraphs
- unordered lists
- ordered lists
- blockquotes
- horizontal rules
- tables
- inline bold
- external links

It is **not** a general MDX system.

That means:

- content authors should stay within the supported subset
- the parser is intentionally small and predictable
- future markdown complexity should be treated as a product decision, not casually introduced

### 9.4 Blog reading experience

Current article UX includes:

- top reading progress bar
- generated table of contents
- anchor-linked section headings
- sticky desktop sidebar
- related article cards
- article and FAQ JSON-LD

This is one of the places where the recent architecture changed:

- the website shell had to stop clipping overflow so sticky article sidebars could work correctly

### 9.5 SEO architecture

SEO is built from:

- route-level metadata
- shared site config
- JSON-LD helpers
- sitemap route
- robots route
- Open Graph image routes
- FAQ extraction from blog markdown

Current behaviors:

- app pages are disallowed in `robots.ts`
- website and blog pages remain crawlable
- metadata is generated per article
- FAQ schema is included when a blog post contains a recognized FAQ section

### 9.6 PWA metadata

The consumer app exposes:

- `manifest.ts`
- favicon and PWA icon assets

Current manifest intent:

- app-like installability
- correct theme/background colors
- standalone display mode

### 9.7 Current content inventory

The blog currently includes a growing library of habit, calorie, and routine content, including the newer pieces added in the latest content pass such as:

- high-protein Indian breakfast for weight loss
- home workout plan for beginners in India

## 10. UI/UX System and Product Intent

This section is not a style guide in the abstract. It documents the current product interaction model so changes do not accidentally drift into generic health-app UI.

### 10.1 Design principles

The product UI is built around:

- mobile-first completion speed
- visible momentum
- low-friction logging
- sparse but meaningful feedback
- brand contrast between "serious accountability" and "friendly enough to use daily"

### 10.2 Brand system

Current global theme is defined in `product/src/app/globals.css`.

Typography:

- display: `Bricolage Grotesque`
- body: `Manrope`
- data / numeric: `JetBrains Mono`

Brand palette:

- midnight: `#0B0F0D`
- charcoal: `#1A1F1C`
- slate: `#2C322F`
- bone: `#F5F2EA`
- vital green: `#3FD17A`
- saffron: `#E8A95B`
- crimson: `#D8462E`
- plum: `#8E4D87`

### 10.3 Mobile app shell philosophy

The authenticated product shell assumes:

- most usage happens on mobile
- the user is often standing, commuting, or between tasks
- bottom navigation is more important than dense desktop chrome

Architecture decisions that reflect this:

- max-width mobile column layout
- fixed bottom nav
- primary actions embedded inside each surface
- expandable secondary content instead of permanently visible dense panels

### 10.4 Daily logging UX patterns

Current patterns:

- meal logging is card-based and expandable
- workout logging is segmented into type, intensity, duration, optional note
- derived information is shown quickly after input
- optimistic-feeling feedback uses toasts and instant revalidation

These are not incidental implementation details. They support the product claim that logging should take under a few minutes.

### 10.5 Momentum and state signaling

The UI repeatedly surfaces:

- score out of 9
- streak count
- grace days remaining
- logged vs unlogged meals
- calorie budget remaining
- badges and milestones

That is the core behavioral loop:

- show the state
- make the next action obvious
- make incomplete days recoverable instead of shame-heavy

### 10.6 Website / blog UX direction

The public site intentionally feels more editorial than dashboard-like.

Current website traits:

- higher-contrast typography
- sticky header
- large hero copy
- article-focused layouts
- readable prose spacing
- fixed reading progress and TOC in long-form content

### 10.7 CRM UX direction

The CRM is intentionally more utilitarian:

- clearer grid and form density
- faster scanning of users and plans
- fewer decorative interactions
- role-aware nav
- plan builders optimized for internal operators, not end users

### 10.8 Product UX opportunities worth pursuing

These are architecture-level ideas that fit the current system well:

- Add a post-onboarding summary card before landing on `/dashboard` so the user sees "this is the routine we heard from you."
- Use `biggest_challenge` to vary microcopy and reminder language instead of sending the same tone to everyone.
- Add a "streak rescue" state to the dashboard when the user is on grace day 2 of 3.
- Add a plan-compliance layer that compares logged meals against assigned plan slots, not just generic healthy/medium/junk ratings.
- Add a CRM intervention log so coaches can record "what was discussed" alongside plans.
- Add a separate structured `onboarding_response_log` table if analytics or questionnaire versioning becomes important.

## 11. CRM App (`crm/`) Deep Dive

The CRM is a second app, not an admin route inside the consumer app.

That separation reduces:

- auth model complexity
- accidental SEO exposure
- shared bundle bloat
- cross-surface permission leakage

### 11.1 CRM route map

| Route | Purpose |
| --- | --- |
| `/` | Redirect to `/dashboard` or `/login` |
| `/login` | Team login |
| `/dashboard` | Internal metrics summary |
| `/users` | User search and list |
| `/users/[id]` | User detail view |
| `/users/[id]/meal-plan/new` | Create meal plan |
| `/users/[id]/meal-plan/[planId]` | Edit meal plan |
| `/users/[id]/workout-plan/new` | Create workout plan |
| `/users/[id]/workout-plan/[planId]` | Edit workout plan |
| `/team` | Team management, admin only |
| `/team/new` | Add team member |

API routes:

| Route | Purpose |
| --- | --- |
| `/api/auth/login` | CRM login |
| `/api/auth/logout` | CRM logout |
| `/api/foods/search` | Food search for meal plan builder |
| `/api/team` | Team list, create, and patch actions |

### 11.2 CRM session model

The CRM has a separate session stack from the consumer app.

Cookie:

- name: `__crm_session`
- expiry: 14 days
- payload: `id`, `email`, `full_name`, `role`

Identity source:

- `crm_users`

Password strategy:

- hashed with Node.js crypto scrypt
- verified in `crm/src/features/auth/server/password.ts`

### 11.3 CRM roles

Current roles:

- `admin`
- `master_coach`
- `nutritionist`
- `trainer`
- `sales`

Navigation currently exposes:

- dashboard to all roles
- users to all roles
- team management to admins only

### 11.4 CRM dashboard

The dashboard is a compact operational snapshot.

Current metrics:

- total users
- active today
- total meals logged
- top streaks

It is intentionally simple and read-heavy.

### 11.5 User detail page

`/users/[id]` is the internal user 360 page.

It aggregates:

- profile summary
- onboarding completion status
- streak summary
- badges
- last 14 daily scores
- recent meals
- meal plans
- workout plans

This page is the key bridge between:

- consumer behavior data
- coach intervention decisions

### 11.6 Meal plan builder architecture

The meal plan builder is a grid editor with:

- seven days
- six meal slots per day
- food search
- quantity-based macro scaling
- per-day totals
- draft and publish modes

Write model:

- one `meal_plans` row
- many `meal_plan_items` rows

Saved macro values are denormalized onto each item row at save time.

This is intentional so:

- plan display remains stable even if the food database changes later
- consumption pages do not have to recalculate every macro on read

### 11.7 Workout plan builder architecture

The workout plan builder uses:

- one card per day
- optional rest day flag
- freeform exercises inside each day
- draft and publish modes

Write model:

- one `workout_plans` row
- seven-ish `workout_plan_days` rows
- many `workout_plan_exercises` rows

### 11.8 Past-day locking rule

This is a major current business rule.

When editing an existing plan:

- only today and future days in that week are editable
- past days are visually locked
- update actions delete and recreate rows only for editable days

Why this exists:

- preserves historical plan integrity
- avoids rewriting what a user was already supposed to do earlier in the week
- gives operators freedom to adjust the remaining week

### 11.9 Team management

The team system is intentionally lightweight.

Current capabilities:

- list members
- add member
- change role
- activate / deactivate member

It is implemented through:

- the `crm_users` table
- the `/api/team` route
- admin-only UI and routing checks

### 11.10 End-to-end CRM journeys

#### Journey A: team member logs into the CRM

1. Staff member lands on `/login`.
2. Credentials are submitted to `/api/auth/login`.
3. Server looks up `crm_users`.
4. Password hash is verified with scrypt.
5. Signed `__crm_session` cookie is created.
6. User is redirected into `/dashboard`.
7. Sidebar visibility is filtered by role.

#### Journey B: coach publishes a meal plan

1. Operator opens `/users/[id]/meal-plan/new`.
2. Food search uses `/api/foods/search`.
3. Builder grid captures day, slot, food, quantity, and scaled macros.
4. Save action inserts a `meal_plans` row.
5. Save action inserts `meal_plan_items`.
6. User detail page is revalidated.
7. Consumer app will now load the latest published plan for that user.

#### Journey C: coach edits the current week

1. Operator opens `/users/[id]/meal-plan/[planId]` or workout equivalent.
2. Builder marks past days as locked.
3. Update action computes `editableDays`.
4. Existing rows for editable days are deleted.
5. Replacement rows for editable days are inserted.
6. Past-day rows remain unchanged.

#### Journey D: admin adds or modifies a team member

1. Admin opens `/team`.
2. Team table is fetched from `/api/team`.
3. New member creation calls `POST /api/team`.
4. Role or activation toggles call `PATCH /api/team`.
5. Credentials and roles stay entirely in the CRM domain, not the consumer auth system.

## 12. Data Model and Table Catalog

This section describes the live data contract and who owns each table.

### 12.1 Shared principles

- Consumer app user IDs are Firebase UIDs stored as `text`.
- CRM user IDs are UUIDs stored in `crm_users`.
- Most reads and writes go through server-side Supabase clients using the service role key.
- Several tables are intentionally denormalized for simpler reads.

### 12.2 `profiles`

Purpose:

- canonical consumer profile row

Primary key:

- `id text` (Firebase UID)

Written by:

- `/api/auth/session` bootstrap for new users
- onboarding save action

Read by:

- dashboard
- diet page
- workout page
- settings
- CRM user views

Notable fields:

- body stats
- routine times
- goal
- challenge
- motivation
- onboarding completion

Architecture note:

- onboarding answers are flattened here rather than normalized into a questionnaire response table

### 12.3 `meal_logs`

Purpose:

- daily meal-level compliance log

Primary key:

- UUID `id`

Uniqueness:

- `unique(user_id, date, meal_type)`

Written by:

- `saveMeal()`

Read by:

- dashboard
- diet page
- history/progress
- CRM recent meal view

Architecture note:

- `points` are stored directly on the log row

### 12.4 `daily_scores`

Purpose:

- precomputed daily compliance summary

Written by:

- recomputation after meal saves

Read by:

- dashboard
- progress charts
- CRM daily score strip

Fields:

- `total_points`
- `meals_logged`
- `is_streak_day`

Architecture note:

- this table exists to avoid recomputing daily state everywhere

### 12.5 `user_streaks`

Purpose:

- durable streak state per consumer user

Written by:

- session bootstrap for new users
- streak update logic after today meal saves

Read by:

- dashboard
- progress
- notification send route
- CRM

### 12.6 `user_badges`

Purpose:

- earned badge ledger

Written by:

- badge award logic after qualifying meal saves

Read by:

- progress page
- dashboard recent badge preview
- CRM user detail

### 12.7 `workout_logs`

Purpose:

- workout session history

Written by:

- `saveWorkout()`

Read by:

- dashboard
- workout page
- future analytics use

Architecture note:

- workouts are additive, not unique per day

### 12.8 `notification_preferences`

Purpose:

- user-level push settings

Written by:

- notification settings form
- permission banner auto-enable path

Read by:

- settings page
- send route

### 12.9 `notification_tokens`

Purpose:

- multi-device FCM token store

Written by:

- subscribe route
- notification token server actions

Read by:

- send route

Architecture note:

- tokens are globally unique
- stale tokens are pruned after send failures

### 12.10 `food_items`

Purpose:

- searchable nutrition database for CRM meal plan authoring

Current role:

- lookup table
- source of per-100g macro values

### 12.11 `meal_plans`

Purpose:

- top-level weekly meal plan record

Written by:

- CRM meal plan actions

Read by:

- CRM plan list and edit
- consumer latest-published-plan queries

### 12.12 `meal_plan_items`

Purpose:

- plan entries per day and meal slot

Written by:

- CRM meal plan builder

Read by:

- consumer meal plan surfaces
- CRM plan edit page

Denormalized fields:

- `food_name`
- macros at saved quantity

### 12.13 `workout_plans`

Purpose:

- top-level weekly workout plan record

Written by:

- CRM workout plan actions

Read by:

- CRM plan list and edit
- consumer latest-published-plan queries

### 12.14 `workout_plan_days`

Purpose:

- one row per day in a workout plan

Key semantics:

- `day_of_week` is `0..6`
- Monday is `0`

### 12.15 `workout_plan_exercises`

Purpose:

- ordered exercises inside a plan day

Architecture note:

- `reps` is free text to support formats like `8-12`, `AMRAP`, or time-based patterns

### 12.16 `crm_users`

Purpose:

- internal staff accounts and roles

Written by:

- CRM team admin API

Read by:

- CRM login
- team management pages

### 12.17 Relationship summary

Main consumer relationships:

- `profiles.id -> meal_logs.user_id`
- `profiles.id -> daily_scores.user_id`
- `profiles.id -> user_streaks.user_id`
- `profiles.id -> user_badges.user_id`
- `profiles.id -> workout_logs.user_id`
- `profiles.id -> notification_preferences.user_id`
- `profiles.id -> notification_tokens.user_id`
- `profiles.id -> meal_plans.user_id`
- `profiles.id -> workout_plans.user_id`

Plan relationships:

- `meal_plans.id -> meal_plan_items.meal_plan_id`
- `workout_plans.id -> workout_plan_days.workout_plan_id`
- `workout_plan_days.id -> workout_plan_exercises.workout_plan_day_id`

### 12.18 Why this model is shaped this way

Several current denormalizations are intentional:

- `points` are stored on `meal_logs` for direct reuse.
- `daily_scores` exists because the UI repeatedly needs day-level summaries.
- `food_name` and scaled macros are stored on `meal_plan_items` to preserve historical plan fidelity.
- `workout_plan_exercises.reps` is text because structured rep schemes are still too limited for real coaching language.

### 12.19 Current read models and derived projections

Several screens are not reading raw tables directly in a one-to-one way. They assemble small read models in the query layer.

Important examples:

- `getTodayData()` combines today's `meal_logs`, today's `daily_scores`, current `user_streaks`, and recent `user_badges`.
- dashboard energy state combines `profiles`, today's `meal_logs`, and today's `workout_logs`.
- plan consumption queries load the latest published plan first, then load child rows separately.
- CRM user detail combines `profiles`, `user_streaks`, `user_badges`, recent `meal_logs`, and recent `daily_scores`.

This matters for refactors because:

- a table change often breaks multiple screens indirectly
- query-layer composition is where page-level business semantics currently live

### 12.20 What is not modeled yet

The current schema still lacks several potentially useful data structures:

- onboarding answer version history
- explicit user habit events
- coach notes / interventions
- plan adherence records
- structured notification delivery logs

Those omissions are not accidental. They reflect the current product stage and the bias toward simple reads and writes.

## 13. Deployment, Hosting, and Runtime Ops

### 13.1 Hosting model

Both apps deploy with Firebase Hosting / App Hosting style config:

- `product/apphosting.yaml`
- `product/firebase.json`
- `crm/apphosting.yaml`
- `crm/firebase.json`

Current Firebase Hosting region:

- `asia-south1`

### 13.2 Product runtime config

Consumer app secrets include:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

### 13.3 CRM runtime config

CRM secrets include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRM_SESSION_SECRET`

### 13.4 Analytics and tracking

The consumer root layout currently injects:

- Google Tag Manager via `@next/third-parties`

This means the website and app shell inherit that script from the root layout.

### 13.5 Notification cron operations

Daily push sends are triggered from GitHub Actions, not from a Firebase scheduler inside the repo.

That is important operationally because:

- the scheduler lives in repository automation
- the actual send logic lives in the app
- auth between the two is `CRON_SECRET`

### 13.6 Caching and generation characteristics

Current behavior by surface:

- blog article routes are statically generated
- marketing metadata routes are generated through App Router conventions
- authenticated app surfaces are request-time because they depend on session state and live data
- notification send route is explicitly `dynamic = 'force-dynamic'`

## 14. Local Development

### 14.1 Prerequisites

- Node.js 20+
- `pnpm`
- access to Supabase project values
- Firebase web config for the consumer app

### 14.2 Consumer app

```bash
cd product
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
```

### 14.3 CRM app

```bash
cd crm
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
```

### 14.4 Database setup order

Consumer schema order:

1. `product/supabase/schema.sql`
2. `product/supabase/migrations/001_add_workout_logs.sql`
3. `product/supabase/migrations/002_add_food_items.sql`
4. `product/supabase/migrations/002_add_notifications.sql`
5. `product/supabase/migrations/003_add_plan_tables.sql`

CRM schema:

1. `crm/supabase/crm_migration.sql`

### 14.5 Seed and credentials notes

CRM seed currently inserts:

- email: `fitterverse.in@gmail.com`
- password: `Fitterverse@123`
- role: `admin`

Treat that as bootstrap infrastructure, not a long-term acceptable security posture.

## 15. Known Gotchas

These are the things most likely to cause incorrect edits or false assumptions.

### 15.1 The repo root is not an app

Do not treat the root `package.json` as the consumer app.

All deployment-sensitive app files live inside `product/` and `crm/`.

### 15.2 This repo is on Next.js 16

Do not fall back to older assumptions about:

- middleware naming
- metadata route conventions
- App Router defaults

Use `proxy.ts`, not `middleware.ts`, in explanations and code changes.

### 15.3 `product/diet-tracker/` is only a scaffold right now

It currently contains:

- `next.config.ts`
- `package.json`

It is not wired into the consumer app runtime.

### 15.4 Website and app shells are intentionally different

Do not collapse the marketing site and the product shell into one generic layout.

They serve different jobs:

- website: acquisition and trust
- app: fast daily completion

### 15.5 Onboarding answers are not versioned

Changing the onboarding questions is not just a UI change.

Because the data is flattened onto `profiles`, question changes can affect:

- downstream meaning of fields
- analytics consistency
- coach interpretation

### 15.6 Quiet hours are modeled but not fully enforced

Do not assume the send route does dynamic timezone-aware suppression today.

### 15.7 Service worker config is duplicated on purpose

Do not "clean it up" casually unless you preserve deterministic FCM initialization.

### 15.8 Day-of-week indexing is Monday-first in plan data

Plan tables use:

- `0 = Monday`
- `6 = Sunday`

This is not the same as JavaScript `Date.getDay()`.

The UI converts JS day values with:

```ts
((now.getDay() + 6) % 7)
```

### 15.9 Browser does not write directly to Supabase

If you introduce client-side DB writes, you are changing a core architecture boundary.

### 15.10 Consumer and CRM sessions are separate

Do not try to unify cookie names or assume one app's session applies to the other.

### 15.11 `history` and `badges` are compatibility routes now

Do not build new features assuming those pages are standalone destinations.

### 15.12 Latest published plan does not automatically mean current-week plan

The read model fetches the latest published plan, then page logic decides whether its week matches the current week for "today" snippets.

### 15.13 `crm/next.config.ts` must keep `outputFileTracingRoot`

The CRM app sets:

- `turbopack.root`
- `outputFileTracingRoot`

Do not remove `outputFileTracingRoot` casually. The CRM is deployed as its own app package and relies on correct file tracing boundaries.

### 15.14 Firebase App Hosting env availability matters

For the consumer app in particular, `NEXT_PUBLIC_*` values used by Next.js at build time must be available in:

- `BUILD`
- `RUNTIME`

If a variable is only available at runtime, you can get a build that succeeds structurally but ships broken client config.

### 15.15 Each app owns its own hosting config

Do not move hosting-sensitive files to the repo root.

Current app-local config files include:

- `product/firebase.json`
- `product/apphosting.yaml`
- `crm/firebase.json`
- `crm/apphosting.yaml`

## 16. Open Gaps and Future Architecture Ideas

The current architecture is coherent, but it still has clear next steps.

### 16.1 Separate question history from profile state

If onboarding becomes a serious analysis surface, add something like:

- `onboarding_submissions`
- `onboarding_submission_answers`

That would allow:

- question versioning
- cohort analysis
- before/after profile comparisons

### 16.2 Add a coach intervention log

Today the CRM can assign plans, but it cannot record structured intervention history such as:

- "user reported late-night cravings"
- "adjusted dinner composition"
- "asked to increase walking"

A lightweight event log would improve continuity across staff members.

### 16.3 Add plan compliance scoring

Current daily scoring is generic meal-quality scoring.

A future architecture could compare:

- assigned plan slot
- actual logged meal
- adherence score

without losing the simplicity of the current rating model.

### 16.4 Improve notification personalization

The system already stores:

- challenge
- motivation
- activity level
- fasting behavior

Notification content could eventually use that context instead of relying only on slot-based templates.

### 16.5 Introduce a content authoring contract

The blog currently works because authors stay inside the supported markdown subset.

If content complexity increases, choose one of two clear futures:

- keep the current constrained markdown system and document the allowed syntax hard
- move to a richer parser / MDX pipeline intentionally

### 16.6 Decide what `diet-tracker/` becomes

Right now it is a stub.

Future options:

- remove it if it was exploratory only
- develop it into a separate experiment with its own architecture
- fold it into the main product if it becomes a real feature track

## Closing Note

When changing this repo, the fastest way to make a bad architectural decision is to assume Fitterverse is "just another tracker."

The current system is shaped around:

- low-friction daily compliance
- forgiving but visible accountability
- coach-readable behavior data
- a public website and content layer that teaches the same mental model the product reinforces

If a change improves those four things, it is probably aligned.

If a change adds complexity without making those loops stronger, it probably is not.
