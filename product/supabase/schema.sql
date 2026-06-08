-- ============================================================
-- Fitterverse Diet Tracker — Supabase Schema
-- Auth: Firebase (user_id = Firebase UID, stored as text)
-- All DB ops use service role key (server-side only)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles
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

-- Meal logs
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

-- Daily scores
create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,             -- Firebase UID
  date date not null,
  total_points integer default 0,
  meals_logged integer default 0,
  is_streak_day boolean default false,
  steps integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- User streaks
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

-- User badges
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,             -- Firebase UID
  badge_slug text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_slug)
);

-- ============================================================
-- Row Level Security
-- All writes go through service role key (bypasses RLS).
-- RLS is enabled as a safety net — service role always bypasses it.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;
alter table public.daily_scores enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_badges enable row level security;

-- Workout logs
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,             -- Firebase UID
  date date not null,
  workout_type text not null check (workout_type in (
    'running','walking','cycling','swimming','strength','yoga','hiit','dance','sports','stretching','other'
  )),
  intensity text not null check (intensity in ('low','moderate','high')),
  duration_minutes integer not null check (duration_minutes > 0),
  calories_burned integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workout_logs enable row level security;

-- Unified journal entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entry_type text check (entry_type in ('food', 'workout')),
  source_type text check (source_type in ('text', 'camera', 'gallery', 'text_image')),
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed', 'deleted')),
  logged_for_date date not null,
  logged_at timestamptz not null,
  display_title text,
  raw_input_text text,
  latest_analysis_id uuid,
  image_count integer not null default 0,
  is_edited boolean not null default false,
  edit_count integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entry_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes integer,
  width integer,
  height integer,
  retention_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entry_analyses (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id text not null,
  model_provider text not null default 'google',
  model_name text,
  analysis_kind text not null check (analysis_kind in ('create', 'edit', 'detail_refresh')),
  input_text text,
  parsed_json jsonb not null default '{}'::jsonb,
  display_title text,
  summary_text text,
  calories integer,
  carbs_g numeric(8,2),
  protein_g numeric(8,2),
  fat_g numeric(8,2),
  secondary_nutrients jsonb,
  confidence_score numeric(5,2),
  latency_ms integer,
  token_input integer,
  token_output integer,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_nutrition_summaries (
  user_id text not null,
  date date not null,
  food_calories integer not null default 0,
  exercise_calories integer not null default 0,
  carbs_g numeric(10,2) not null default 0,
  protein_g numeric(10,2) not null default 0,
  fat_g numeric(10,2) not null default 0,
  entry_count integer not null default 0,
  food_entry_count integer not null default 0,
  workout_entry_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists public.ai_usage_daily (
  user_id text not null,
  date date not null,
  analysis_count integer not null default 0,
  image_analysis_count integer not null default 0,
  detail_analysis_count integer not null default 0,
  last_request_at timestamptz,
  primary key (user_id, date)
);

alter table public.journal_entries enable row level security;
alter table public.journal_entry_media enable row level security;
alter table public.journal_entry_analyses enable row level security;
alter table public.daily_nutrition_summaries enable row level security;
alter table public.ai_usage_daily enable row level security;

-- Indexes for performance
create index if not exists meal_logs_user_date on public.meal_logs(user_id, date);
create index if not exists daily_scores_user_date on public.daily_scores(user_id, date);
create index if not exists user_badges_user on public.user_badges(user_id);
create index if not exists workout_logs_user_date on public.workout_logs(user_id, date);
create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, logged_for_date, logged_at desc);
create index if not exists journal_entries_user_status_idx on public.journal_entries(user_id, status, logged_for_date);
create index if not exists journal_entry_media_entry_idx on public.journal_entry_media(entry_id, created_at desc);
create index if not exists journal_entry_media_retention_idx on public.journal_entry_media(retention_expires_at);
create index if not exists journal_entry_analyses_entry_idx on public.journal_entry_analyses(entry_id, created_at desc);
create index if not exists journal_entry_analyses_user_idx on public.journal_entry_analyses(user_id, created_at desc);
