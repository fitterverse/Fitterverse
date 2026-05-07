-- ──────────────────────────────────────────────────────────────────
-- Meal Plans
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.meal_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,       -- Firebase UID of the member
  created_by  text not null,       -- Firebase UID of the nutritionist (CRM)
  title       text not null default 'Meal Plan',
  week_start  date not null,       -- Monday of the target week
  status      text not null default 'draft'
                check (status in ('draft', 'published', 'archived')),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists meal_plans_user_id on public.meal_plans(user_id);
create index if not exists meal_plans_status  on public.meal_plans(status);
alter table public.meal_plans enable row level security;

-- ──────────────────────────────────────────────────────────────────
-- Meal Plan Items  (one row per food item per meal slot)
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.meal_plan_items (
  id            uuid primary key default gen_random_uuid(),
  meal_plan_id  uuid not null references public.meal_plans(id) on delete cascade,
  day_of_week   integer not null check (day_of_week between 0 and 6), -- 0=Mon … 6=Sun
  meal_slot     text not null
                  check (meal_slot in (
                    'breakfast', 'morning_snack', 'lunch',
                    'afternoon_snack', 'dinner', 'evening_snack'
                  )),
  food_item_id  integer references public.food_items(id),
  food_name     text not null,    -- denormalized so plan survives food DB edits
  quantity_g    numeric(8,1) not null check (quantity_g > 0),

  -- Macros pre-computed at save time (food values × quantity_g ÷ 100)
  energy_kcal   numeric(8,2),
  protein_g     numeric(8,2),
  fat_g         numeric(8,2),
  carbs_g       numeric(8,2),
  fiber_g       numeric(8,2),

  display_order integer not null default 0,
  notes         text,
  created_at    timestamptz default now()
);

create index if not exists meal_plan_items_plan on public.meal_plan_items(meal_plan_id);
alter table public.meal_plan_items enable row level security;

-- ──────────────────────────────────────────────────────────────────
-- Workout Plans
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  created_by  text not null,
  title       text not null default 'Workout Plan',
  week_start  date not null,
  status      text not null default 'draft'
                check (status in ('draft', 'published', 'archived')),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists workout_plans_user_id on public.workout_plans(user_id);
create index if not exists workout_plans_status  on public.workout_plans(status);
alter table public.workout_plans enable row level security;

-- ──────────────────────────────────────────────────────────────────
-- Workout Plan Days  (7 rows per plan, one per day-of-week)
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.workout_plan_days (
  id               uuid primary key default gen_random_uuid(),
  workout_plan_id  uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week      integer not null check (day_of_week between 0 and 6),
  label            text,          -- e.g. "Push Day", "Leg Day", "Active Recovery"
  is_rest_day      boolean not null default false,
  display_order    integer not null default 0,
  created_at       timestamptz default now(),
  unique (workout_plan_id, day_of_week)
);

create index if not exists workout_plan_days_plan on public.workout_plan_days(workout_plan_id);
alter table public.workout_plan_days enable row level security;

-- ──────────────────────────────────────────────────────────────────
-- Workout Plan Exercises  (N rows per day)
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.workout_plan_exercises (
  id                   uuid primary key default gen_random_uuid(),
  workout_plan_day_id  uuid not null references public.workout_plan_days(id) on delete cascade,
  exercise_name        text not null,
  sets                 integer,
  reps                 text,           -- "8-12", "AMRAP", "30s" — free text
  duration_minutes     integer,
  rest_seconds         integer,
  notes                text,
  display_order        integer not null default 0,
  created_at           timestamptz default now()
);

create index if not exists workout_plan_exercises_day on public.workout_plan_exercises(workout_plan_day_id);
alter table public.workout_plan_exercises enable row level security;
